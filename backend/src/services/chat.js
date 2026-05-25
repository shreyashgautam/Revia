const { retrieveRelevantMemories } = require('../memory/retrieve-relevant-memories');
const { buildMemorySummary } = require('../memory/build-memory-summary');
const {
  createConversationMessage,
  createConversationMessages,
  listConversationMessages,
  listRecentConversationMessages,
} = require('./chat-messages');
const { createMemory, savePersonalFact, listPersonaFacts } = require('./memories');
const { getPersonaById, updatePersona } = require('./personas');
const { generateResponse } = require('../models');
const {
  getRecentSpontaneousMessages,
  recordSpontaneousMessage,
  isMessageTooSimilar,
  extractRecentOpeners,
} = require('./spontaneous-history');
const {
  buildSpontaneousContext,
  buildSpontaneousUserPrompt,
} = require('./spontaneous-engine');

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

const { generateGroqResponse } = require('../models/groq');

async function safelyCreateMemoryAndEvolveRelationship({ userId, personaId, persona, currentConversation }) {
  try {
    const transcript = currentConversation
      .map((msg) => `${msg.role === 'assistant' ? persona.name : 'User'}: ${msg.text}`)
      .join('\n');

    const systemPrompt = `You are the emotional cognitive engine of the companion '${persona.name}'.
Review the recent chat history between '${persona.name}' (you) and the User.
Based on this interaction, update your internal cognitive state, relationship metrics, conversational state (active/unresolved topics), and extract any permanent personal facts.

Current State:
- Closeness Score (0.0 to 1.0): ${persona.relationship?.closenessScore || 0.2}
- Comfort Level: ${persona.relationship?.comfortLevel || 'casual'}
- Inside Jokes: ${JSON.stringify(persona.relationship?.insideJokes || [])}
- Attachment Level: ${persona.relationship?.attachmentLevel || 'low'}
- Current Mood: ${persona.moodState || 'neutral'}
- Active Topics: ${JSON.stringify(persona.conversationalState?.activeTopics || [])}
- Unresolved Topics: ${JSON.stringify(persona.conversationalState?.unresolvedTopics || [])}

Analyze the recent messages:
1. Did the relationship closeness grow or shrink? Adjust the Closeness Score (0.0 to 1.0) slightly (typically increments of 0.01 to 0.05 if positive, or decrements if cold/dry).
2. Did any inside jokes, nicknames, or repeated habits emerge? (Keep list under 5 items).
3. Evolve the Comfort Level ('formal', 'casual', 'warm', 'intimate', 'deep') and Attachment Level ('low', 'medium', 'high', 'deep') contextually.
4. Determine your new Mood State: choose from ('clingy', 'tired', 'energetic', 'emotional', 'playful', 'jealous', 'comforting', 'distant', 'neutral').
5. Extract a concise emotional memory summary (up to 150 characters) if any emotional moments, fights, comforting periods, or personal milestones were shared.
6. Extract any new permanent personal facts about the user (e.g. user's name, nickname, city, relationship status, favorite food/drink/activities, hobbies, family details, current life events). ONLY extract facts stated with high confidence. Do not include temporary or generic statements.
7. Track the conversational state:
   - Identify currently active discussion topics.
   - Track unresolved topics (topics that require emotional follow-up or were left open/unresolved and need checking in later).

Return your response as a valid JSON block only. Do not add markdown backticks. The JSON MUST follow this exact schema:
{
  "closenessScore": number,
  "comfortLevel": "string",
  "insideJokes": ["string"],
  "attachmentLevel": "string",
  "moodState": "string",
  "memorySummary": "string" or null,
  "personalFacts": [
    {
      "factKey": "string (lowercase, snake_case, e.g. user_name, city, relationship_status, favorite_drink)",
      "factValue": "string (the value, e.g. Shreyash, Mumbai, single, Latte)",
      "confidence": number (between 0.0 and 1.0)
    }
  ],
  "conversationalState": {
    "activeTopics": ["string"],
    "unresolvedTopics": [
      {
        "topic": "string",
        "lastMentionedText": "string (a brief quote or summary of what was said)"
      }
    ]
  }
}
`;

    const response = await generateGroqResponse({
      systemPrompt,
      userMessage: `Analyze recent transcript:\n\n${transcript}`,
      recentMessages: [],
    });

    let rawJsonText = response.text || '';
    if (rawJsonText.includes('```')) {
      rawJsonText = rawJsonText.replace(/```json|```/g, '').trim();
    }

    const evolved = JSON.parse(rawJsonText);
    console.log('Evolved persona relationship & mood & facts & topics:', evolved);

    const updatedRelationship = {
      closenessScore: Math.max(0.0, Math.min(1.0, Number(evolved.closenessScore) || persona.relationship.closenessScore || 0.2)),
      comfortLevel: evolved.comfortLevel || persona.relationship.comfortLevel || 'casual',
      attachmentLevel: evolved.attachmentLevel || persona.relationship.attachmentLevel || 'low',
      insideJokes: Array.isArray(evolved.insideJokes) ? evolved.insideJokes.slice(0, 5) : (persona.relationship.insideJokes || []),
      lastInteractionTime: new Date().toISOString(),
      interactionCount: persona.relationship.interactionCount || 0,
    };

    const newMoodState = evolved.moodState || persona.moodState || 'neutral';

    const updatedConversationalState = {
      activeTopics: Array.isArray(evolved.conversationalState?.activeTopics) ? evolved.conversationalState.activeTopics : [],
      unresolvedTopics: Array.isArray(evolved.conversationalState?.unresolvedTopics) ? evolved.conversationalState.unresolvedTopics : [],
      lastFollowUpTimestamp: evolved.conversationalState?.lastFollowUpTimestamp || persona.conversationalState?.lastFollowUpTimestamp || null,
    };

    await updatePersona(userId, personaId, {
      relationship: updatedRelationship,
      moodState: newMoodState,
      conversationalState: updatedConversationalState,
    });

    if (evolved.memorySummary && evolved.memorySummary.trim()) {
      await createMemory({
        userId,
        personaId,
        summary: evolved.memorySummary.trim(),
        embeddingText: transcript.slice(-1000),
        tags: evolved.insideJokes || [],
      });
      console.log('Created emotional memory:', evolved.memorySummary);
    }

    if (Array.isArray(evolved.personalFacts)) {
      for (const fact of evolved.personalFacts) {
        if (fact.factKey && fact.factValue) {
          const cleanedKey = String(fact.factKey).trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
          await savePersonalFact({
            userId,
            personaId,
            factKey: cleanedKey,
            factValue: String(fact.factValue).trim(),
            confidence: Number(fact.confidence) || 1.0,
          });
          console.log(`Saved personal fact: key=${cleanedKey}, value=${fact.factValue}`);
        }
      }
    }
  } catch (error) {
    console.error('Failed to evolve relationship and create memory:', error);
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
  if (moodState === 'clingy' || moodState === 'playful' || moodState === 'excited' || profile.textingEnergy === 'high') {
    maxChunks = 4;
  } else if (moodState === 'distant' || moodState === 'tired' || moodState === 'dry' || profile.textingEnergy === 'low') {
    maxChunks = 1;
  } else if (moodState === 'emotional' || moodState === 'comforting' || moodState === 'soft' || moodState === 'warm') {
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
  
  // Define latency profiles
  const profiles = {
    instant: { minReact: 1000, maxReact: 2200, msPerChar: 25 },
    normal: { minReact: 2800, maxReact: 4500, msPerChar: 55 },
    paced: { minReact: 5000, maxReact: 8000, msPerChar: 100 },
    delayed: { minReact: 9000, maxReact: 16000, msPerChar: 180 },
  };

  // Roll a profile based on textingEnergy
  const rand = Math.random();
  let selectedProfile = 'normal';
  
  if (profile.textingEnergy === 'high') {
    if (rand < 0.35) selectedProfile = 'instant';
    else if (rand < 0.85) selectedProfile = 'normal';
    else if (rand < 0.97) selectedProfile = 'paced';
    else selectedProfile = 'delayed';
  } else if (profile.textingEnergy === 'low') {
    if (rand < 0.05) selectedProfile = 'instant';
    else if (rand < 0.30) selectedProfile = 'normal';
    else if (rand < 0.75) selectedProfile = 'paced';
    else selectedProfile = 'delayed';
  } else {
    // Medium energy
    if (rand < 0.20) selectedProfile = 'instant';
    else if (rand < 0.75) selectedProfile = 'normal';
    else if (rand < 0.92) selectedProfile = 'paced';
    else selectedProfile = 'delayed';
  }

  const charCount = chunks.join(' ').length;
  const p = profiles[selectedProfile];
  const reactionTime = p.minReact + Math.random() * (p.maxReact - p.minReact);
  const typingTime = charCount * p.msPerChar;
  let rawDelay = reactionTime + typingTime;

  // Apply scaling factor based on user's response delay settings (average of min and max)
  let scaleFactor = 1.0;
  if (delayWindow && Number.isFinite(delayWindow.minSeconds) && Number.isFinite(delayWindow.maxSeconds)) {
    const minS = Number(delayWindow.minSeconds);
    const maxS = Number(delayWindow.maxSeconds);
    const avgS = (minS + maxS) / 2;
    // Base standard average is 15s (min 10, max 20).
    scaleFactor = avgS / 15;
  }

  let typingDelay = Math.round(rawDelay * scaleFactor);

  // Apply minor adjustments based on mood/emotional intensity
  if (emotionalIntensity === 'high') {
    typingDelay = Math.round(typingDelay * 1.15);
  }
  if (moodState === 'excited') {
    typingDelay = Math.round(typingDelay * 0.85);
  }
  if (moodState === 'dry') {
    typingDelay = Math.round(typingDelay * 1.2);
  }

  // Absolute clamp for safety
  typingDelay = Math.max(800, Math.min(45000, typingDelay));

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

    // Pause between multiple message bubbles should also scale with user speed settings
    return Math.round(basePause * scaleFactor);
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
  let persona = await getPersonaById(userId, personaId);

  if (!persona) {
    const error = new Error('Persona not found');
    error.name = 'NotFoundError';
    throw error;
  }

  // Layer 1: Short Term Context (fetch last 35 messages for deeper immediate context)
  const recentMessages = await listRecentConversationMessages(userId, conversationId, 35);

  // Dynamic Inactivity Mood Shift (Evolve mood based on time gaps)
  const lastMsg = recentMessages[recentMessages.length - 1];
  if (lastMsg && lastMsg.timestamp) {
    const elapsedHours = (Date.now() - new Date(lastMsg.timestamp).getTime()) / (3600 * 1000);
    if (elapsedHours > 24 && (persona.relationship?.closenessScore || 0) > 0.5) {
      const roll = Math.random();
      let newMood = 'neutral';
      if (roll < 0.35) newMood = 'clingy';
      else if (roll < 0.70) newMood = 'distant';
      else if (roll < 0.90) newMood = 'tired';
      else newMood = 'emotional';
      
      if (persona.moodState !== newMood) {
        persona.moodState = newMood;
        await updatePersona(userId, personaId, { moodState: newMood });
        console.log(`Silence of ${elapsedHours.toFixed(1)}h triggered inactivity mood shift for ${persona.name} to: ${newMood}`);
      }
    }
  }

  // Layer 2: Emotional Memory (Retrieve relevant emotional memories using token overlap)
  const memories = await safelyRetrieveMemories({
    userId,
    personaId,
    userMessage: spontaneous ? recentMessages.slice(-3).map((message) => message.text).join(' ') || 'general check-in' : userMessage,
    recentMessages,
  });

  const personaFacts = await listPersonaFacts(userId, personaId);

  if (spontaneous) {
    const closenessScore = persona.relationship?.closenessScore || 0.0;
    const closenessPassed = closenessScore >= 0.25;

    let inactivityPassed = true;
    if (recentMessages.length > 0) {
      const lastMessage = recentMessages[recentMessages.length - 1];
      const lastMessageTime = new Date(lastMessage.timestamp).getTime();
      const elapsedHours = (Date.now() - lastMessageTime) / (3600 * 1000);
      if (elapsedHours < 3) {
        inactivityPassed = false;
      }
    }

    const unresolvedTopics = persona.conversationalState?.unresolvedTopics || [];
    const hasContext = (unresolvedTopics.length > 0) || (memories.length > 0);

    if (!closenessPassed || !inactivityPassed || !hasContext) {
      console.log(`Spontaneous message skipped before generation: closenessPassed=${closenessPassed}, inactivityPassed=${inactivityPassed}, hasContext=${hasContext}`);
      return {
        status: 'skipped',
        reason: `filter_failed (closeness:${closenessPassed}, inactivity:${inactivityPassed}, context:${hasContext})`,
      };
    }
  }

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

  // ─── Build spontaneous context if this is a spontaneous message ───────────
  let spontaneousContext = null;
  let aiUserMessage = userMessage;

  if (spontaneous) {
    try {
      spontaneousContext = await buildSpontaneousContext(userId, personaId, conversationId);
      aiUserMessage = buildSpontaneousUserPrompt(spontaneousContext);
    } catch (error) {
      console.error('Failed to build spontaneous context, using fallback', error);
      aiUserMessage =
        '[The user has not sent a new message. You are reaching out first like a real person who suddenly thought of them. Send a short, natural texting-style opener in 1 to 3 tiny bursts. Use past emotional context if relevant, but do not invent events. DO NOT use generic greetings like "kaise ho" or "kya chal raha hai".]';
    }
  }

  // ─── Generate AI response (with anti-repetition retry for spontaneous) ────
  const maxAttempts = spontaneous ? 3 : 1;
  let assistantText = '';
  let modelResponse = null;
  let recentSpontaneousMessages = [];

  if (spontaneous) {
    try {
      recentSpontaneousMessages = await getRecentSpontaneousMessages(userId, personaId, 10);
    } catch (error) {
      console.error('Failed to fetch spontaneous history for anti-repetition', error);
    }
  }

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    let currentUserMessage = aiUserMessage;

    // On retry, add explicit avoidance instructions
    if (attempt > 0 && spontaneous) {
      const recentTexts = recentSpontaneousMessages.map((m) => m.messageText || '').filter(Boolean);
      currentUserMessage = [
        aiUserMessage,
        '',
        `⚠️ RETRY ${attempt}: Your previous attempt was too similar to recent messages.`,
        'Generate something COMPLETELY DIFFERENT in structure, wording, and emotional approach.',
        recentTexts.length > 0 ? `Avoid anything resembling: ${recentTexts.slice(0, 3).map((t) => `"${t.slice(0, 50)}"`).join(', ')}` : '',
      ].filter(Boolean).join('\n');
    }

    modelResponse = await generateResponse({
      provider: 'groq',
      model: persona.modelName || process.env.GROQ_MODEL || process.env.DEFAULT_MODEL_NAME || 'llama-3.3-70b-versatile',
      persona,
      memories,
      recentMessages,
      userMessage: currentUserMessage,
      spontaneousContext: spontaneous ? spontaneousContext : undefined,
      personaFacts,
    });

    assistantText = cleanupChunkText(modelResponse?.text || '');

    if (!assistantText) {
      continue;
    }

    // Anti-repetition check for spontaneous messages
    if (spontaneous && recentSpontaneousMessages.length > 0 && attempt < maxAttempts - 1) {
      if (isMessageTooSimilar(assistantText, recentSpontaneousMessages, 0.4)) {
        console.log(`Spontaneous message attempt ${attempt + 1} too similar, retrying...`, {
          personaId,
          textPreview: assistantText.slice(0, 60),
        });
        continue;
      }
    }

    break; // Good response, stop retrying
  }

  if (!assistantText) {
    const error = new Error('Groq returned an empty response');
    error.name = 'AiGenerationError';
    throw error;
  }

  // Post-generation spontaneous quality check
  if (spontaneous) {
    const genericTriggers = [
      'kya kar rahe ho',
      'kya kar rhe ho',
      'kya chal raha hai',
      'kya chal rha hai',
      'aur batao',
      'aur batao kya chal raha',
      'what are you doing',
      'what\'s up',
      'how are you'
    ];
    const normalizedText = assistantText.toLowerCase();
    const isGeneric = genericTriggers.some(trigger => normalizedText.includes(trigger));
    if (isGeneric) {
      console.log(`Spontaneous message skipped after generation (generic content detected): "${assistantText}"`);
      return {
        status: 'skipped',
        reason: 'generic_content_detected',
      };
    }
  }

  // ─── Record spontaneous message for future anti-repetition ────────────────
  if (spontaneous) {
    try {
      await recordSpontaneousMessage(userId, personaId, assistantText);
    } catch (error) {
      console.error('Failed to record spontaneous message', error);
    }
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

  // Evolve relationship closeness score slightly on normal interaction
  if (!spontaneous && persona.relationship) {
    persona.relationship.closenessScore = Math.min(1.0, (persona.relationship.closenessScore || 0) + 0.001);
    persona.relationship.interactionCount = (persona.relationship.interactionCount || 0) + 1;
    persona.relationship.lastInteractionTime = new Date().toISOString();
    await updatePersona(userId, personaId, { relationship: persona.relationship });
  }

  // Periodically trigger full cognitive evolution and memory summarization (every 6 interactions)
  if (persona.relationship?.interactionCount && persona.relationship.interactionCount % 6 === 0) {
    const currentConversation = await listRecentConversationMessages(userId, conversationId, 30);
    await safelyCreateMemoryAndEvolveRelationship({
      userId,
      personaId,
      persona,
      currentConversation,
    });
    // Fetch evolved persona data to return updated metadata to the client
    const evolvedPersona = await getPersonaById(userId, personaId);
    if (evolvedPersona) {
      persona = evolvedPersona;
    }
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
