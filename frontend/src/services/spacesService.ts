import { apiFetch } from '@/src/utils/apiFetch';
import { Space, SpaceMessage, CreateSpacePayload, UpdateSpacePayload } from '../types';

export async function listSpaces(): Promise<Space[]> {
  const result = await apiFetch<{ spaces: Space[] }>('/spaces', {
    method: 'GET',
    auth: true,
  });
  return result.spaces || [];
}

export async function getSpace(spaceId: string): Promise<Space> {
  const result = await apiFetch<{ space: Space }>(`/spaces/${spaceId}`, {
    method: 'GET',
    auth: true,
  });
  return result.space;
}

export async function createSpace(payload: CreateSpacePayload): Promise<Space> {
  const result = await apiFetch<{ space: Space }>('/spaces', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
  return result.space;
}

export async function updateSpace(spaceId: string, payload: UpdateSpacePayload): Promise<Space> {
  const result = await apiFetch<{ space: Space }>(`/spaces/${spaceId}`, {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(payload),
  });
  return result.space;
}

export async function deleteSpace(spaceId: string): Promise<void> {
  await apiFetch<{ message: string; spaceId: string }>(`/spaces/${spaceId}`, {
    method: 'DELETE',
    auth: true,
  });
}

export async function listSpaceMessages(
  spaceId: string,
  options?: { limit?: number; lastKey?: string }
): Promise<{ messages: SpaceMessage[]; lastKey?: string }> {
  let url = `/spaces/${spaceId}/messages?newestFirst=true`;
  if (options?.limit) {
    url += `&limit=${options.limit}`;
  }
  if (options?.lastKey) {
    url += `&lastKey=${encodeURIComponent(options.lastKey)}`;
  }

  const result = await apiFetch<{ messages: any[]; lastKey: string | null }>(url, {
    method: 'GET',
    auth: true,
  });

  const messages: SpaceMessage[] = (result.messages || []).map((m) => ({
    id: m.messageId,
    spaceId: m.spaceId,
    senderId: m.senderId,
    senderType: m.senderType,
    senderName: m.senderName,
    text: m.text,
    replyTo: m.replyTo,
    timestamp: new Date(m.timestamp),
    metadata: m.metadata,
  }));

  return {
    messages,
    lastKey: result.lastKey || undefined,
  };
}
