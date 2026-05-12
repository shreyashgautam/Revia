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

async function sendPersonaMessage({ userId, personaId, conversationId, userMessage, spontaneous }) {
  const persona = await getPersonaById(userId, personaId);

  if (!persona) {
    const error = new Error('Persona not found');
    error.name = 'NotFoundError';
    throw error;
  }

  const recentMessages = await listRecentConversationMessages(userId, conversationId, 20);
  const memories = await safelyRetrieveMemories({
    userId,
    personaId,
    userMessage: spontaneous ? (recentMessages.slice(-3).map(m => m.text).join(' ') || 'general check-in') : userMessage,
    recentMessages,
  });

  let savedUserMessage = null;
  if (!spontaneous) {
    savedUserMessage = await createConversationMessage({
      userId,
      personaId,
      conversationId,
      role: 'user',
      text: userMessage,
    });
  }

  // Build the actual message to send to AI
  let aiUserMessage = userMessage;
  if (spontaneous) {
    // For spontaneous messages, craft a system-level trigger
    aiUserMessage = '[The user has not sent a new message. You are initiating contact because you feel like reaching out. Send a casual, natural, short message as if you just thought of them. Do NOT say "hey, you there?" — be creative, reference past context if available, or just share a random thought/feeling. Keep it very short (1-2 lines). Be human.]';
  }

  const modelResponse = await generateResponse({
    provider: 'groq',
    model: persona.modelName || process.env.GROQ_MODEL || process.env.DEFAULT_MODEL_NAME || 'llama-3.3-70b-versatile',
    persona,
    memories,
    recentMessages,
    userMessage: aiUserMessage,
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

  const responseDelay = estimateResponseDelayMs(assistantText, persona);

  return {
    conversationId,
    persona,
    spontaneous: !!spontaneous,
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

function estimateResponseDelayMs(text, persona) {
  const charCount = (text || '').trim().length;
  const speed = (persona?.replyBehavior || persona?.personaConfig?.responseSpeed || '').toLowerCase();
  let baseDelay = 2500;

  if (speed.includes('instant')) {
    baseDelay = 800;
  } else if (speed.includes('fast')) {
    baseDelay = 1400;
  } else if (speed.includes('normal')) {
    baseDelay = 2200;
  } else if (speed.includes('slow')) {
    baseDelay = 4200;
  } else if (speed.includes('random')) {
    baseDelay = 1500 + Math.round(Math.random() * 3500);
  }

  if (charCount <= 40) {
    return Math.max(700, Math.round(baseDelay * 0.7));
  }
  if (charCount <= 120) {
    return Math.max(1200, baseDelay);
  }
  return Math.round(baseDelay * 1.2);
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
