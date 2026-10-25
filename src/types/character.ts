export type CharacterCategory = 'Fantasy' | 'Anime' | 'Friend' | 'Mentor' | 'Funny' | 'Sci-Fi' | 'Custom';

export interface VoiceConfig {
  pitch: number; // 0.5 to 1.5
  rate: number;  // 0.8 to 1.2
  voiceName?: string;
  lang?: string;
}

export interface Character {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: CharacterCategory;
  avatar: string;
  personality: string;
  greeting: string;
  scenario: string;
  voiceConfig?: VoiceConfig;
  promptSuggestions?: string[];
  isCustom?: boolean;
  createdAt?: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  type?: 'text' | 'image';
  imageUrl?: string;
  imagePrompt?: string;
  error?: boolean;
}
