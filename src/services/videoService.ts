import { VideoJob, VideoHistoryItem, VideoMode, VideoAspectRatio, VideoDuration } from '../types/video';

const GEMINI_KEY_STORAGE = 'persona_custom_gemini_key';
const VIDEO_HISTORY_STORAGE = 'persona_video_history';

export interface GenerateVideoParams {
  mode: VideoMode;
  prompt: string;
  motionPrompt?: string;
  duration?: VideoDuration;
  aspectRatio?: VideoAspectRatio;
  imageBase64?: string;
}

export const videoService = {
  // Custom user Gemini API key in localStorage
  getCustomGeminiKey(): string {
    try {
      return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
    } catch {
      return '';
    }
  },

  setCustomGeminiKey(key: string): void {
    try {
      localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
    } catch (e) {
      console.error('Error saving Gemini key to localStorage', e);
    }
  },

  clearCustomGeminiKey(): void {
    try {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
    } catch (e) {
      console.error('Error clearing Gemini key', e);
    }
  },

  // Start generation job
  async startGeneration(params: GenerateVideoParams): Promise<{ jobId: string; status: string; message: string }> {
    const customKey = this.getCustomGeminiKey();

    const response = await fetch('/api/video/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(customKey ? { 'x-gemini-api-key': customKey } : {}),
      },
      body: JSON.stringify({
        ...params,
        geminiApiKey: customKey || undefined,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to initialize video generation job.');
    }

    return data;
  },

  // Check job status
  async checkJobStatus(jobId: string): Promise<VideoJob> {
    const response = await fetch(`/api/video/status/${jobId}`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch video generation status.');
    }

    return data;
  },

  // History management
  getVideoHistory(): VideoHistoryItem[] {
    try {
      const stored = localStorage.getItem(VIDEO_HISTORY_STORAGE);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      console.error('Error reading video history', e);
      return [];
    }
  },

  saveToHistory(item: VideoHistoryItem): VideoHistoryItem[] {
    try {
      const current = this.getVideoHistory();
      // Keep up to 25 items
      const updated = [item, ...current.filter((v) => v.id !== item.id)].slice(0, 25);
      localStorage.setItem(VIDEO_HISTORY_STORAGE, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error saving video to history', e);
      return this.getVideoHistory();
    }
  },

  deleteFromHistory(id: string): VideoHistoryItem[] {
    try {
      const current = this.getVideoHistory();
      const updated = current.filter((v) => v.id !== id);
      localStorage.setItem(VIDEO_HISTORY_STORAGE, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Error deleting video from history', e);
      return this.getVideoHistory();
    }
  },

  clearHistory(): void {
    try {
      localStorage.removeItem(VIDEO_HISTORY_STORAGE);
    } catch (e) {
      console.error('Error clearing video history', e);
    }
  },
};
