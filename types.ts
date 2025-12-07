export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export enum ModelType {
  FLASH = 'gemini-2.5-flash',
  FLASH_IMAGE = 'gemini-2.5-flash-image'
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  timestamp: number;
  isThinking?: boolean;
  thinkingDuration?: number; // Simulated or tracked time
  groundingSources?: GroundingSource[];
  images?: string[]; // base64 (User uploaded or Model generated)
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastModified: number;
}

export interface AppSettings {
  useDeepThinking: boolean;
  useWebGrounding: boolean;
  generateImage: boolean;
  thinkingBudget: number;
}