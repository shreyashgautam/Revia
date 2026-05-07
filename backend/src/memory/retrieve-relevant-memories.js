const { listPersonaMemories } = require('../services/memories');

function tokenize(text) {
  return new Set(
    String(text || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/i)
      .map((token) => token.trim())
      .filter((token) => token.length > 2)
  );
}

function scoreMemory(memory, queryTokens) {
  const memoryTokens = tokenize(
    [memory.summary, memory.embeddingText, ...(memory.tags || [])].join(' ')
  );

  let overlap = 0;

  queryTokens.forEach((token) => {
    if (memoryTokens.has(token)) {
      overlap += 1;
    }
  });

  return overlap;
}

async function retrieveRelevantMemories({ userId, personaId, userMessage, recentMessages }) {
  const memories = await listPersonaMemories(
    userId,
    personaId,
    Number(process.env.MEMORY_RETRIEVAL_LIMIT || 25)
  );

  if (memories.length === 0) {
    return [];
  }

  const contextText = [
    userMessage,
    ...recentMessages.slice(-4).map((message) => message.text),
  ].join(' ');
  const queryTokens = tokenize(contextText);

  return memories
    .map((memory) => ({
      ...memory,
      score: scoreMemory(memory, queryTokens),
    }))
    .filter((memory) => memory.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);
}

module.exports = {
  retrieveRelevantMemories,
};
