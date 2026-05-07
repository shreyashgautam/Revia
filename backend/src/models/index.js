const { generateGeminiResponse } = require('./gemini');
const { generateOpenRouterResponse } = require('./openrouter');
const { generateLlamaResponse } = require('./llama');
const { buildPersonaSystemPrompt } = require('../prompts/persona-system-prompt');

async function generateResponse({
  provider,
  model,
  persona,
  memories,
  recentMessages,
  userMessage,
}) {
  const systemPrompt = buildPersonaSystemPrompt({
    persona,
    memories,
  });

  const payload = {
    model,
    persona,
    memories,
    recentMessages,
    systemPrompt,
    userMessage,
  };

  switch (provider) {
    case 'gemini':
      return generateGeminiResponse(payload);
    case 'openrouter':
      return generateOpenRouterResponse(payload);
    case 'llama':
      return generateLlamaResponse(payload);
    default:
      throw new Error(`Unsupported model provider: ${provider}`);
  }
}

module.exports = {
  generateResponse,
};
