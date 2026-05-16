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
  metadata?: {
    chunks?: string[];
    chunkDelays?: number[];
    typingDelay?: number;
    emotionalIntensity?: string;
    spontaneous?: boolean;
    chunkGroupId?: string;
    chunkIndex?: number;
    chunkCount?: number;
    delay?: number;
    moodState?: string;
    textingProfile?: {
      emojiFrequency?: string;
      textingEnergy?: string;
      expressiveLevel?: string;
    };
  };
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

export type UploadMode = 'upload' | 'paste' | 'behavioral';
export type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

export interface UploadedKnowledgeFile {
  id: string;
  fileId: string;
  name: string;
  size: number;
  type: string;
  url: string;
  previewUrl?: string;
  previewText?: string;
  progress: number;
  status: UploadStatus;
  error?: string;
}

export interface BehavioralInputState {
  tone: string;
  personalityTags: string[];
  notes: string;
}

export interface ChatSimulationSettings {
  realisticMode: boolean;
  minResponseDelaySeconds: number;
  maxResponseDelaySeconds: number;
  autoScrollToLatest: boolean;
}
