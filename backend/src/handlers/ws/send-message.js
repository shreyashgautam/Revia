const { getConnectionById, listConnectionsForConversation } = require('../../services/ws-connections');
const { broadcastToConnections } = require('../../services/ws-events');
const { sendPersonaMessage } = require('../../services/chat');

function parseBody(event) {
  if (!event.body) {
    return {};
  }

  return JSON.parse(event.body);
}

function wait(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function sanitizeDelayWindow(input) {
  const minSeconds = Number(input?.minSeconds);
  const maxSeconds = Number(input?.maxSeconds);

  if (!Number.isFinite(minSeconds) || !Number.isFinite(maxSeconds)) {
    return {
      minSeconds: 10,
      maxSeconds: 20,
    };
  }

  const min = Math.max(1, Math.min(30, minSeconds));
  const max = Math.max(min, Math.min(30, maxSeconds));

  return {
    minSeconds: min,
    maxSeconds: max,
  };
}

exports.handler = async (event) => {
  try {
    const body = parseBody(event);
    const connectionId = event.requestContext.connectionId;
    const connection = await getConnectionById(connectionId);

    if (!connection) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Unknown connection' }),
      };
    }

    const personaId = typeof body.personaId === 'string' ? body.personaId.trim() : '';
    const conversationId =
      typeof body.conversationId === 'string' && body.conversationId.trim().length > 0
        ? body.conversationId.trim()
        : personaId;
    const userMessage = typeof body.message === 'string' ? body.message.trim() : '';
    const spontaneous = body.spontaneous === true;
    const tempId = typeof body.tempId === 'string' ? body.tempId : null;

    if (!personaId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'personaId is required' }),
      };
    }

    if (!spontaneous && !userMessage) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'message is required' }),
      };
    }

    const delayWindow = sanitizeDelayWindow(body.delayWindow);

    const response = await sendPersonaMessage({
      userId: connection.userId,
      personaId,
      conversationId,
      userMessage: spontaneous ? '' : userMessage,
      spontaneous,
      delayWindow,
    });

    const listeners = await listConnectionsForConversation(connection.userId, conversationId);
    const audience = listeners.length > 0 ? listeners : [connection];

    if (response.userMessage && tempId) {
      await broadcastToConnections({
        domainName: event.requestContext.domainName,
        stage: event.requestContext.stage,
        connections: audience,
        payload: {
          type: 'message_ack',
          tempId,
          conversationId,
          personaId,
          message: response.userMessage,
        },
      });
    }

    await broadcastToConnections({
      domainName: event.requestContext.domainName,
      stage: event.requestContext.stage,
      connections: audience,
      payload: {
        type: 'ai_typing',
        conversationId,
        personaId,
        typingDelay: response.typingDelay,
        moodState: response.emotionalMetadata?.moodState,
      },
    });

    await wait(Math.max(1000, response.typingDelay || 1000));

    const assistantMessages = response.assistantMessages || [];

    for (let index = 0; index < assistantMessages.length; index += 1) {
      if (index > 0) {
        const pauseDelay = Math.max(600, response.chunkDelays?.[index] || assistantMessages[index].metadata?.delay || 900);

        await broadcastToConnections({
          domainName: event.requestContext.domainName,
          stage: event.requestContext.stage,
          connections: audience,
          payload: {
            type: 'ai_pause',
            conversationId,
            personaId,
            delay: pauseDelay,
          },
        });

        await wait(pauseDelay);
      }

      await broadcastToConnections({
        domainName: event.requestContext.domainName,
        stage: event.requestContext.stage,
        connections: audience,
        payload: {
          type: 'ai_chunk',
          conversationId,
          personaId,
          message: assistantMessages[index],
        },
      });
    }

    await broadcastToConnections({
      domainName: event.requestContext.domainName,
      stage: event.requestContext.stage,
      connections: audience,
      payload: {
        type: 'ai_done',
        conversationId,
        personaId,
        spontaneous: response.spontaneous,
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Delivered' }),
    };
  } catch (error) {
    console.error('WebSocket send message failed', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: error?.message || 'Failed to send websocket message' }),
    };
  }
};
