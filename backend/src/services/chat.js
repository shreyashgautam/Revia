const { retrieveRelevantMemories } = require('../memory/retrieve-relevant-memories');
const { buildMemorySummary } = require('../memory/build-memory-summary');
const {
  createConversationMessage,
  createConversationMessages,
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

function inferEmotionalIntensity(text, persona) {
  const normalized = String(text || '').toLowerCase();
  const emotionalTokens = [
    'sad',
    'lonely',
    'miss',
    'cry',
    'hurt',
    'anxious',
    'stress',
    'love',
    'off',
    'mood',
    'tired',
    'upset',
    'scared',
    'happy',
    'excited',
  ];
  const tokenHits = emotionalTokens.filter((token) => normalized.includes(token)).length;
  const personaTone = String(persona?.emotionalTone || '').toLowerCase();

  if (tokenHits >= 2 || personaTone.includes('deep') || personaTone.includes('warm')) {
    return 'high';
  }

  if (tokenHits === 1 || personaTone.includes('support')) {
    return 'medium';
  }

  return 'low';
}

function pickScaleValue(value, fallback = 'medium') {
  const normalized = String(value || fallback).toLowerCase();
  if (normalized.includes('low') || normalized.includes('minimal') || normalized.includes('quiet')) {
    return 'low';
  }
  if (normalized.includes('high') || normalized.includes('max') || normalized.includes('bubbly') || normalized.includes('loud')) {
    return 'high';
  }
  return 'medium';
}

function normalizeTextingProfile(persona) {
  const config = persona?.personaConfig || {};
  const traits = (persona?.traits || []).map((trait) => String(trait).toLowerCase());
  const style = (persona?.speakingStyle || []).map((item) => String(item).toLowerCase()).join(' ');
  const tone = String(persona?.emotionalTone || '').toLowerCase();
  const relationshipType = String(persona?.relationshipType || '').toLowerCase();

  let textingEnergy = pickScaleValue(config.textingEnergy, 'medium');
  let expressiveLevel = pickScaleValue(config.expressiveLevel, 'medium');
  let emojiFrequency = pickScaleValue(config.emojiFrequency, 'low');

  if (traits.some((trait) => ['bubbly', 'fun', 'expressive', 'cheerful', 'upbeat'].includes(trait))) {
    textingEnergy = 'high';
    expressiveLevel = 'high';
    emojiFrequency = emojiFrequency === 'low' ? 'medium' : emojiFrequency;
  }

  if (traits.some((trait) => ['sarcastic', 'mysterious', 'brief', 'quiet', 'logical'].includes(trait))) {
    expressiveLevel = expressiveLevel === 'high' ? 'medium' : expressiveLevel;
    emojiFrequency = 'low';
  }

  if (style.includes('slow paced') || tone.includes('thoughtful') || relationshipType === 'mentor') {
    textingEnergy = textingEnergy === 'high' ? 'medium' : textingEnergy;
  }

  return {
    emojiFrequency,
    textingEnergy,
    expressiveLevel,
    typoFrequency: pickScaleValue(config.typoFrequency, textingEnergy === 'high' ? 'medium' : 'low'),
    fillerFrequency: pickScaleValue(config.fillerFrequency, expressiveLevel),
    lowercaseBias: config.lowercaseBias !== false,
    followUpStyle: config.followUpStyle || (relationshipType.includes('best') ? 'warm-check-in' : 'minimal'),
    moodPalette: Array.isArray(config.moodPalette) && config.moodPalette.length > 0
      ? config.moodPalette
      : ['present', 'soft', 'playful'],
  };
}

function pickMoodState({ persona, emotionalIntensity, spontaneous, recentMessages }) {
  const profile = normalizeTextingProfile(persona);
  const lastUserText = String(
    recentMessages.filter((message) => message.role === 'user').slice(-1)[0]?.text || ''
  ).toLowerCase();

  if (/(sad|miss|hurt|off|lonely|stress|tired|cry)/.test(lastUserText)) {
    return 'soft';
  }
  if (/(haha|lol|lmao|yay|excited|party)/.test(lastUserText)) {
    return 'excited';
  }
  if (spontaneous && profile.textingEnergy === 'high') {
    return 'clingy';
  }
  if (emotionalIntensity === 'high') {
    return 'warm';
  }
  if (profile.textingEnergy === 'low') {
    return 'dry';
  }

  const palette = profile.moodPalette;
  return String(palette[Math.floor(Math.random() * palette.length)] || 'present').toLowerCase();
}

function cleanupChunkText(text) {
  return String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?])/g, '$1')
    .trim();
}

function applyHumanTextingFinish(text, { persona, moodState, profile, index, totalChunks }) {
  let result = cleanupChunkText(text);

  if (!result) {
    return '';
  }

  if (profile.lowercaseBias && profile.textingEnergy !== 'low') {
    result = result.charAt(0).toLowerCase() + result.slice(1);
  }

  if (profile.textingEnergy === 'high' && /[a-z]{3,}/i.test(result) && Math.random() < 0.18) {
    result = result.replace(/\b([a-zA-Z]{3,})\b/, (word) => `${word}${word.slice(-1)}`);
  }

  if (profile.typoFrequency !== 'low' && moodState !== 'dry' && Math.random() < 0.08) {
    result = result.replace(/\b(hai|really|kya|yaar)\b/i, (word) => `${word}${word.slice(-1)}`);
  }

  if (
    profile.emojiFrequency === 'high' &&
    !/[!?.]$/.test(result) &&
    index === totalChunks - 1 &&
    Math.random() < 0.25
  ) {
    result = `${result} :)`;
  }

  return cleanupChunkText(result);
}

function splitByTextingPauses(text) {
  return String(text || '')
    .split(/(?<=[.!?])\s+|(?<=,)\s+|(?:\s+and\s+)|(?:\s+but\s+)|(?:\s+so\s+)/i)
    .map((chunk) => cleanupChunkText(chunk))
    .filter(Boolean);
}

function splitLongChunk(chunk, desiredCount) {
  if (!chunk || desiredCount <= 1) {
    return [chunk].filter(Boolean);
  }

  const words = chunk.split(/\s+/).filter(Boolean);
  if (words.length <= 4) {
    return [chunk];
  }

  const parts = [];
  const segmentSize = Math.ceil(words.length / desiredCount);
  for (let index = 0; index < words.length; index += segmentSize) {
    parts.push(words.slice(index, index + segmentSize).join(' '));
  }
  return parts.map(cleanupChunkText).filter(Boolean);
}

function splitAssistantReplyIntoChunks(text, persona, moodState) {
  const trimmed = cleanupChunkText(text);

  if (!trimmed) {
    return [];
  }

  const profile = normalizeTextingProfile(persona);
  const replyBehavior = String(persona?.replyBehavior || persona?.personaConfig?.responseSpeed || '').toLowerCase();
  const sentenceChunks = splitByTextingPauses(trimmed);

  let maxChunks = 2;
  if (profile.textingEnergy === 'high' || moodState === 'excited' || replyBehavior.includes('instant')) {
    maxChunks = 4;
  } else if (profile.textingEnergy === 'low' || moodState === 'dry' || replyBehavior.includes('measured')) {
    maxChunks = 2;
  } else if (moodState === 'soft' || moodState === 'warm') {
    maxChunks = 3;
  }

  let chunks = sentenceChunks.slice(0, maxChunks);

  if (chunks.length === 1) {
    const desiredCount =
      profile.textingEnergy === 'high'
        ? 3
        : profile.textingEnergy === 'medium' && trimmed.length > 55
          ? 2
          : 1;
    chunks = splitLongChunk(chunks[0], desiredCount);
  }

  if (profile.textingEnergy === 'high' && chunks.length < 3 && trimmed.length > 36) {
    const expanded = [];
    for (const chunk of chunks) {
      expanded.push(...splitLongChunk(chunk, 2));
    }
    chunks = expanded.slice(0, 4);
  }

  const cleaned = chunks
    .map((chunk, index) =>
      applyHumanTextingFinish(chunk, {
        persona,
        moodState,
        profile,
        index,
        totalChunks: chunks.length,
      })
    )
    .filter(Boolean);

  return cleaned.length > 0 ? cleaned : [trimmed];
}

function buildDeliveryPlan({ text, persona, spontaneous, recentMessages, delayWindow }) {
  const emotionalIntensity = inferEmotionalIntensity(text, persona);
  const profile = normalizeTextingProfile(persona);
  const moodState = pickMoodState({
    persona,
    emotionalIntensity,
    spontaneous,
    recentMessages,
  });
  const chunks = splitAssistantReplyIntoChunks(text, persona, moodState);
  const speed = String(persona?.replyBehavior || persona?.personaConfig?.responseSpeed || '').toLowerCase();

  let typingDelay;
  if (chunks.join(' ').length <= 24) {
    typingDelay = 700 + Math.round(Math.random() * 500);
  } else if (chunks.join(' ').length <= 95) {
    typingDelay = 1800 + Math.round(Math.random() * 1600);
  } else {
    typingDelay = 3200 + Math.round(Math.random() * 2400);
  }

  if (emotionalIntensity === 'high') {
    typingDelay += 700;
  }
  if (profile.textingEnergy === 'high') {
    typingDelay -= 250;
  }
  if (moodState === 'dry' || speed.includes('measured')) {
    typingDelay += 900;
  }
  if (spontaneous) {
    typingDelay += 500;
  }

  typingDelay = Math.max(500, typingDelay);

  if (delayWindow && Number.isFinite(delayWindow.minSeconds) && Number.isFinite(delayWindow.maxSeconds)) {
    const minMs = Math.max(1000, Number(delayWindow.minSeconds) * 1000);
    const maxMs = Math.max(minMs, Number(delayWindow.maxSeconds) * 1000);
    const moodWeight =
      moodState === 'dry' || moodState === 'thoughtful'
        ? 0.82
        : moodState === 'excited' || profile.textingEnergy === 'high'
          ? 0.28
          : 0.55;
    const jitter = Math.random() * Math.min(1800, (maxMs - minMs) * 0.12);
    typingDelay = Math.round(Math.min(maxMs, Math.max(minMs, minMs + moodWeight * (maxMs - minMs) + jitter)));
  }

  const chunkDelays = chunks.map((chunk, index) => {
    if (index === 0) {
      return typingDelay;
    }

    let basePause;
    if (profile.textingEnergy === 'high') {
      basePause = 450 + Math.round(Math.random() * 650);
    } else if (profile.textingEnergy === 'low' || moodState === 'dry') {
      basePause = 1800 + Math.round(Math.random() * 1600);
    } else {
      basePause = 900 + Math.round(Math.random() * 1200);
    }

    if (chunk.length > 40) {
      basePause += 700;
    }
    if (moodState === 'soft') {
      basePause += 300;
    }
    if (moodState === 'excited') {
      basePause = Math.max(400, basePause - 250);
    }

    return basePause;
  });

  return {
    chunks,
    chunkDelays,
    typingDelay,
    emotionalIntensity,
    moodState,
    textingProfile: profile,
  };
}

function buildChunkTimestamps(initialTimestamp, chunkDelays) {
  const timestamps = [];
  let elapsed = 0;
  const base = new Date(initialTimestamp).getTime();

  for (let index = 0; index < chunkDelays.length; index += 1) {
    elapsed += chunkDelays[index] || 0;
    timestamps.push(new Date(base + elapsed).toISOString());
  }

  return timestamps;
}

async function sendPersonaMessage({ userId, personaId, conversationId, userMessage, spontaneous, delayWindow }) {
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
    userMessage: spontaneous ? recentMessages.slice(-3).map((message) => message.text).join(' ') || 'general check-in' : userMessage,
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

  let aiUserMessage = userMessage;
  if (spontaneous) {
    aiUserMessage =
      '[The user has not sent a new message. You are reaching out first like a real person who suddenly thought of them. Send a short, natural texting-style opener in 1 to 3 tiny bursts. Use past emotional context if relevant, but do not invent events.]';
  }

  const modelResponse = await generateResponse({
    provider: 'groq',
    model: persona.modelName || process.env.GROQ_MODEL || process.env.DEFAULT_MODEL_NAME || 'llama-3.3-70b-versatile',
    persona,
    memories,
    recentMessages,
    userMessage: aiUserMessage,
  });

  const assistantText = cleanupChunkText(modelResponse?.text || '');

  if (!assistantText) {
    const error = new Error('Groq returned an empty response');
    error.name = 'AiGenerationError';
    throw error;
  }

  const deliveryPlan = buildDeliveryPlan({
    text: assistantText,
    persona,
    spontaneous,
    recentMessages,
    delayWindow,
  });

  const createdAt = new Date().toISOString();
  const chunkTimestamps = buildChunkTimestamps(createdAt, deliveryPlan.chunkDelays);
  const chunkGroupId = `${conversationId}-${Date.now()}`;
  const assistantMessages = await createConversationMessages(
    deliveryPlan.chunks.map((chunk, index) => ({
      userId,
      personaId,
      conversationId,
      role: 'assistant',
      text: chunk,
      timestamp: chunkTimestamps[index],
      metadata: {
        chunkGroupId,
        chunkIndex: index,
        chunkCount: deliveryPlan.chunks.length,
        delay: deliveryPlan.chunkDelays[index],
        typingDelay: deliveryPlan.typingDelay,
        emotionalIntensity: deliveryPlan.emotionalIntensity,
        spontaneous: !!spontaneous,
        moodState: deliveryPlan.moodState,
        textingProfile: deliveryPlan.textingProfile,
      },
    }))
  );

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
    assistantMessage: assistantMessages[assistantMessages.length - 1] || null,
    assistantMessages,
    fullAssistantText: assistantText,
    typingDelay: deliveryPlan.typingDelay,
    chunks: deliveryPlan.chunks,
    chunkDelays: deliveryPlan.chunkDelays,
    emotionalMetadata: {
      intensity: deliveryPlan.emotionalIntensity,
      spontaneous: !!spontaneous,
      moodState: deliveryPlan.moodState,
    },
    responseDelay,
    model: {
      provider: modelResponse?.provider || 'groq',
      name:
        modelResponse?.model ||
        persona.modelName ||
        process.env.GROQ_MODEL ||
        process.env.DEFAULT_MODEL_NAME ||
        'llama-3.3-70b-versatile',
    },
  };
}

function estimateResponseDelayMs(text, persona) {
  const charCount = (text || '').trim().length;
  const speed = String(persona?.replyBehavior || persona?.personaConfig?.responseSpeed || '').toLowerCase();
  let baseDelay = 2500;

  if (speed.includes('instant')) {
    baseDelay = 900;
  } else if (speed.includes('fast') || speed.includes('very fast')) {
    baseDelay = 1500;
  } else if (speed.includes('normal') || speed.includes('intentional')) {
    baseDelay = 2400;
  } else if (speed.includes('slow') || speed.includes('measured')) {
    baseDelay = 4200;
  } else if (speed.includes('random')) {
    baseDelay = 1200 + Math.round(Math.random() * 3600);
  }

  if (charCount <= 35) {
    return Math.max(700, Math.round(baseDelay * 0.75));
  }
  if (charCount <= 120) {
    return Math.max(1200, baseDelay);
  }
  return Math.round(baseDelay * 1.25);
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
