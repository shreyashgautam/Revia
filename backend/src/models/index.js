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
  const resolvedProvider = typeof provider === 'string' ? provider.toLowerCase() : 'gemini';
  const resolvedModel = model || process.env.DEFAULT_MODEL_NAME || 'gemini-2.5-flash';
  const systemPrompt = buildPersonaSystemPrompt({
    persona,
    memories,
  });

  const payload = {
    model: resolvedModel,
    persona,
    memories,
    recentMessages,
    systemPrompt,
    userMessage,
  };

  switch (resolvedProvider) {
    case 'gemini':
      return generateGeminiResponse(payload);
    case 'openrouter':
      return generateOpenRouterResponse(payload);
    case 'llama':
      return generateLlamaResponse(payload);
    default:
      return generateGeminiResponse(payload);
  }
}

module.exports = {
  generateResponse,
};
