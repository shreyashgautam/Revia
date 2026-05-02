import {
  apiFetch,
  clearStoredToken,
  getStoredToken,
  setStoredToken,
} from '@/src/utils/apiFetch';

interface SignupResponse {
  message: string;
  user: {
    userId: string;
    email: string;
    createdAt: string;
  };
}

interface LoginResponse {
  message: string;
  tokens: {
    accessToken: string;
    idToken?: string;
    refreshToken?: string;
    expiresIn: number;
    tokenType: string;
  };
}

interface MeResponse {
  user: {
    userId: string;
    email: string;
    createdAt: string | null;
  };
}

export async function signup(email: string, password: string) {
  return apiFetch<SignupResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function login(email: string, password: string) {
  const response = await apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  setStoredToken(response.tokens.accessToken);
  return response;
}

export async function getMe() {
  return apiFetch<MeResponse>('/auth/me', {
    method: 'GET',
    auth: true,
  });
}

export function logout() {
  clearStoredToken();
}

export function getToken() {
  return getStoredToken();
}
