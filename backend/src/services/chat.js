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

async function safelyRetrieveMemories({ userId, personaId, userMessage, recentMessages }) {
  try {
    return await retrieveRelevantMemories({
      userId,
      personaId,
      userMessage,
      recentMessages,
    });
  } catch (error) {
    console.error('Memory retrieval failed, continuing without memories', error);
    return [];
  }
}

async function safelyCreateMemory({ userId, personaId, persona, currentConversation }) {
  try {
    const memoryPayload = buildMemorySummary(persona, currentConversation);
    await createMemory({
      userId,
      personaId,
      ...memoryPayload,
    });
  } catch (error) {
    console.error('Memory summary creation failed, continuing without saving memory', error);
  }
}

async function sendPersonaMessage({ userId, personaId, conversationId, userMessage }) {
  const persona = await getPersonaById(userId, personaId);

  if (!persona) {
    const error = new Error('Persona not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const recentMessages = await listRecentConversationMessages(userId, conversationId, 12);
  const memories = await safelyRetrieveMemories({
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
    provider: 'groq',
    model: persona.modelName || process.env.GROQ_MODEL || process.env.DEFAULT_MODEL_NAME || 'llama-3.3-70b-versatile',
    persona,
    memories,
    recentMessages,
    userMessage,
  });
  const assistantText = (modelResponse?.text || '').trim();

  if (!assistantText) {
    const error = new Error('Groq returned an empty response');
    error.name = 'AiGenerationError';
    throw error;
  }

  const savedAssistantMessage = await createConversationMessage({
    userId,
    personaId,
    conversationId,
    role: 'assistant',
    text: assistantText,
  });

  const currentConversation = await listRecentConversationMessages(userId, conversationId, 18);

  if (shouldCreateMemory(currentConversation.length)) {
    await safelyCreateMemory({
      userId,
      personaId,
      persona,
      currentConversation,
    });
  }

  const responseDelay = estimateResponseDelayMs(assistantText);

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
    responseDelay,
    model: {
      provider: modelResponse?.provider || 'groq',
      name: modelResponse?.model || persona.modelName || process.env.GROQ_MODEL || process.env.DEFAULT_MODEL_NAME || 'llama-3.3-70b-versatile',
    },
  };
}

function estimateResponseDelayMs(text) {
  const charCount = (text || '').trim().length;

  if (charCount <= 40) {
    return 800;
  }
  if (charCount <= 120) {
    return 1500;
  }
  return 2500;
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
