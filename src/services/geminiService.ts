import { Character, ChatMessage } from '../types/character';

export interface SendMessageParams {
  character: Character;
  history: ChatMessage[];
  message: string;
}

export interface GenerateImageParams {
  prompt: string;
  characterName?: string;
  style?: string;
}

export const geminiService = {
  async sendMessage({ character, history, message }: SendMessageParams): Promise<string> {
    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          character,
          history: history.map(m => ({
            role: m.role,
            content: m.content,
          })),
          message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to communicate with AI character.');
      }

      return data.reply;
    } catch (err: any) {
      console.error('geminiService.sendMessage error:', err);
      throw new Error(err.message || 'Unable to connect to character. Please try again.');
    }
  },

  async generateImage({ prompt, characterName, style }: GenerateImageParams): Promise<{ imageUrl: string; prompt: string }> {
    try {
      const response = await fetch('/api/gemini/image', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          characterName,
          style,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate scene image.');
      }

      return {
        imageUrl: data.imageUrl,
        prompt: data.prompt || prompt,
      };
    } catch (err: any) {
      console.error('geminiService.generateImage error:', err);
      throw new Error(err.message || 'Image generation failed. Please try a different scene description.');
    }
  },
};
