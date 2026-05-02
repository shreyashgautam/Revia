export type Gender = 'male' | 'female' | 'non-binary';

export interface Agent {
  id: string;
  name: string;
  gender: Gender | 'Boy' | 'Girl';
  personality: string;
  avatar: string;
  tagline: string;
  description?: string;
  lastMessage?: string;
  status: 'online' | 'busy' | 'sleeping' | 'offline' | 'ready' | 'SYNTHESIZING';
  age?: number;
  language?: string;
  conversationStyle?: string[];
  lastSeen?: string;
  responseSpeed?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  theme: {
    primary: string;
    secondary: string;
    gradient: string;
    vibe: string;
  };
}

export interface Message {
  id: string;
  agentId?: string;
  spaceId?: string;
  text: string;
  sender: 'user' | 'agent' | 'system';
  timestamp: Date;
}

export interface User {
  userId?: string;
  name: string;
  username: string;
  email: string;
  gender: Gender;
  age: number;
  avatar: string;
  bio?: string;
  createdAt?: string | null;
}

export interface Space {
  id: string;
  name: string;
  description: string;
  theme: {
    primary: string;
    secondary: string;
    gradient: string;
  };
  memberCount: number;
  isActive: boolean;
  agents: string[];
}
