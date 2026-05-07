const { badRequest, internalServerError, notFound, ok, parseJsonBody } = require('../../lib/http');
const { withAuth } = require('../../lib/withAuth');
const { sendPersonaMessage } = require('../../services/chat');

async function sendMessageHandler(event) {
  try {
    const userId = event.auth.claims.sub;
    const body = parseJsonBody(event);
    const personaId = typeof body.personaId === 'string' ? body.personaId.trim() : '';
    const userMessage = typeof body.message === 'string' ? body.message.trim() : '';
    const conversationId =
      typeof body.conversationId === 'string' && body.conversationId.trim().length > 0
        ? body.conversationId.trim()
        : personaId;

    if (!personaId) {
      return badRequest('personaId is required');
    }

    if (!userMessage) {
      return badRequest('message is required');
    }

    const result = await sendPersonaMessage({
      userId,
      personaId,
      conversationId,
      userMessage,
    });

    return ok(result);
  } catch (error) {
    console.error('Send chat message error', error);

    if (error.message === 'Invalid JSON body') {
      return badRequest('Request body must be valid JSON');
    }

    if (error.name === 'NotFoundError') {
      return notFound(error.message);
    }

    if (error.message === 'Gemini API key is not configured') {
      return internalServerError('AI provider is not configured');
    }

    return internalServerError(error.message || 'Failed to generate chat response');
  }
}

exports.handler = withAuth(sendMessageHandler);
