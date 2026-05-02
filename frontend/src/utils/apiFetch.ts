import { API_BASE_URL } from '@/src/config/api';

const TOKEN_KEY = 'token';

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

type ApiFetchOptions = RequestInit & {
  auth?: boolean;
};

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  const { auth = false, headers, ...rest } = options;
  const token = auth ? getStoredToken() : null;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (typeof data === 'object' &&
        data !== null &&
        'message' in data &&
        typeof data.message === 'string' &&
        data.message) ||
      `Request failed with status ${response.status}`;

    if (response.status === 401) {
      clearStoredToken();
    }

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}
