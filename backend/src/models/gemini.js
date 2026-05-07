async function generateGeminiResponse({
  model,
  systemPrompt,
  recentMessages,
  userMessage,
}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key is not configured');
  }

  const resolvedModel = model || process.env.DEFAULT_MODEL_NAME || 'gemini-2.5-flash';
  const endpointBase = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
  const endpoint = `${endpointBase}/models/${resolvedModel}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const contents = [
    ...recentMessages.map((message) => ({
      role: message.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: message.text }],
    })),
    {
      role: 'user',
      parts: [{ text: userMessage }],
    },
  ];

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      systemInstruction: {
        parts: [{ text: systemPrompt }],
      },
      contents,
      generationConfig: {
        temperature: 0.85,
        topP: 0.9,
        topK: 40,
        maxOutputTokens: 500,
      },
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const message = data?.error?.message || 'Gemini request failed';
    throw new Error(message);
  }

  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text)
      .filter(Boolean)
      .join('\n')
      .trim() || '';

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return {
    text,
    provider: 'gemini',
    model: resolvedModel,
    raw: data,
  };
}

module.exports = {
  generateGeminiResponse,
};
