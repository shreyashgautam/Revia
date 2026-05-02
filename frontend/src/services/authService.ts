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
    name: string;
    username: string;
    gender: string;
    age: number;
    bio: string;
    avatar: string;
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
    name: string;
    username: string;
    gender: string;
    age: number;
    bio: string;
    avatar: string;
    createdAt: string | null;
  };
}

interface UpdateProfilePayload {
  name: string;
  username: string;
  gender: string;
  age: number;
  bio: string;
  avatar: string;
}

export async function signup(
  email: string,
  password: string,
  profile: {
    name: string;
    username: string;
    gender: string;
    age: number;
    bio?: string;
  }
) {
  return apiFetch<SignupResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, ...profile }),
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

export async function updateProfile(profile: UpdateProfilePayload) {
  return apiFetch<MeResponse & { message: string }>('/users/me', {
    method: 'PUT',
    auth: true,
    body: JSON.stringify(profile),
  });
}

export function logout() {
  clearStoredToken();
}

export function getToken() {
  return getStoredToken();
}
