import { apiFetch } from '@/src/utils/apiFetch';

export interface ChatMessageRecord {
  messageId: string;
  conversationId: string;
  personaId: string;
  userId: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export async function sendChatMessage(payload: {
  personaId: string;
  conversationId?: string;
  message: string;
}) {
  return apiFetch<{
    conversationId: string;
    userMessage: ChatMessageRecord;
    assistantMessage: ChatMessageRecord;
    responseDelay?: number;
    memoriesUsed: Array<{ memoryId: string; summary: string; tags: string[] }>;
    model: { provider: string; name: string };
  }>('/chat/send', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export async function getChatHistory(conversationId: string) {
  return apiFetch<{
    conversationId: string;
    messages: ChatMessageRecord[];
  }>(`/chat/history/${conversationId}`, {
    method: 'GET',
    auth: true,
  });
}
