const rawWebSocketUrl = (import.meta.env.VITE_WS_BASE_URL as string | undefined)?.trim() || '';

export const WS_BASE_URL = rawWebSocketUrl ? rawWebSocketUrl.replace(/\/+$/, '') : '';

if (WS_BASE_URL) {
  try {
    const url = new URL(WS_BASE_URL);
    if (!(url.protocol === 'ws:' || url.protocol === 'wss:')) {
      throw new Error('VITE_WS_BASE_URL must use ws:// or wss://');
    }
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('VITE_WS_BASE_URL must be a valid absolute websocket URL');
    }
    throw error;
  }
}
