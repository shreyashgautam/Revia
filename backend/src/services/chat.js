const { retrieveRelevantMemories } = require('../memory/retrieve-relevant-memories');
const { buildMemorySummary } = require('../memory/build-memory-summary');
const {
  createConversationMessage,
  listConversationMessages,
  listRecentConversationMessages,
} = require('./chat-messages');
const { createMemory } = require('./memories');
const { getPersonaById } = require('./personas');
const { generateResponse } = require('../models');

function shouldCreateMemory(messagesCount) {
  const interval = Number(process.env.MEMORY_SUMMARY_INTERVAL || 6);
  return messagesCount > 0 && messagesCount % interval === 0;
}

async function sendPersonaMessage({ userId, personaId, conversationId, userMessage }) {
  const persona = await getPersonaById(userId, personaId);

  if (!persona) {
    const error = new Error('Persona not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const recentMessages = await listRecentConversationMessages(userId, conversationId, 12);
  const memories = await retrieveRelevantMemories({
    userId,
    personaId,
    userMessage,
    recentMessages,
  });

  const savedUserMessage = await createConversationMessage({
    userId,
    personaId,
    conversationId,
    role: 'user',
    text: userMessage,
  });

  const modelResponse = await generateResponse({
    provider: persona.modelProvider || process.env.DEFAULT_MODEL_PROVIDER || 'gemini',
    model: persona.modelName || process.env.DEFAULT_MODEL_NAME || 'gemini-2.5-flash',
    persona,
    memories,
    recentMessages,
    userMessage,
  });

  const savedAssistantMessage = await createConversationMessage({
    userId,
    personaId,
    conversationId,
    role: 'assistant',
    text: modelResponse.text,
  });

  const currentConversation = await listRecentConversationMessages(userId, conversationId, 18);

  if (shouldCreateMemory(currentConversation.length)) {
    const memoryPayload = buildMemorySummary(persona, currentConversation);
    await createMemory({
      userId,
      personaId,
      ...memoryPayload,
    });
  }

  return {
    conversationId,
    persona,
    memoriesUsed: memories.map((memory) => ({
      memoryId: memory.memoryId,
      summary: memory.summary,
      tags: memory.tags,
    })),
    userMessage: savedUserMessage,
    assistantMessage: savedAssistantMessage,
    model: {
      provider: modelResponse.provider,
      name: modelResponse.model,
    },
  };
}

async function getConversationHistory({ userId, conversationId }) {
  return listConversationMessages(userId, conversationId, {
    limit: 100,
    newestFirst: false,
  });
}

module.exports = {
  sendPersonaMessage,
  getConversationHistory,
};
