import { Character, ChatMessage } from '../types/character';
import { PRESET_CHARACTERS } from '../data/presetCharacters';

const CUSTOM_CHARACTERS_KEY = 'persona_custom_characters';
const CHAT_PREFIX = 'persona_chat_';

export const storageService = {
  // Load custom characters
  getCustomCharacters(): Character[] {
    try {
      const data = localStorage.getItem(CUSTOM_CHARACTERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Error reading custom characters from storage', e);
      return [];
    }
  },

  // Save new custom character
  saveCustomCharacter(character: Character): void {
    const list = this.getCustomCharacters();
    const updated = [character, ...list.filter(c => c.id !== character.id)];
    localStorage.setItem(CUSTOM_CHARACTERS_KEY, JSON.stringify(updated));
  },

  // Delete custom character
  deleteCustomCharacter(id: string): void {
    const list = this.getCustomCharacters();
    const updated = list.filter(c => c.id !== id);
    localStorage.setItem(CUSTOM_CHARACTERS_KEY, JSON.stringify(updated));
    localStorage.removeItem(CHAT_PREFIX + id);
  },

  // Get all characters (presets + custom)
  getAllCharacters(): Character[] {
    const custom = this.getCustomCharacters();
    return [...custom, ...PRESET_CHARACTERS];
  },

  // Find character by ID
  getCharacterById(id: string): Character | undefined {
    return this.getAllCharacters().find(c => c.id === id);
  },

  // Get chat history for a character
  getChatHistory(character: Character): ChatMessage[] {
    try {
      const key = CHAT_PREFIX + character.id;
      const data = localStorage.getItem(key);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Error loading chat history', e);
    }

    // Default: initialize with character's greeting
    const initialGreeting: ChatMessage = {
      id: 'greeting-' + character.id,
      role: 'model',
      content: character.greeting,
      timestamp: Date.now(),
      type: 'text',
    };
    this.saveChatHistory(character.id, [initialGreeting]);
    return [initialGreeting];
  },

  // Save chat history
  saveChatHistory(characterId: string, messages: ChatMessage[]): void {
    try {
      localStorage.setItem(CHAT_PREFIX + characterId, JSON.stringify(messages));
    } catch (e) {
      console.error('Error saving chat history', e);
    }
  },

  // Clear chat history
  clearChatHistory(character: Character): ChatMessage[] {
    localStorage.removeItem(CHAT_PREFIX + character.id);
    const greeting: ChatMessage = {
      id: 'greeting-' + character.id + '-' + Date.now(),
      role: 'model',
      content: character.greeting,
      timestamp: Date.now(),
      type: 'text',
    };
    this.saveChatHistory(character.id, [greeting]);
    return [greeting];
  },
};
