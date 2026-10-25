export type VideoMode = 'text-to-video' | 'image-to-video';
export type VideoAspectRatio = '16:9' | '9:16';
export type VideoDuration = '5s' | '10s';
export type VideoJobStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'failed';
export type VideoProvider = 'huggingface' | 'gemini';

export interface VideoJob {
  id: string;
  mode: VideoMode;
  prompt: string;
  motionPrompt?: string;
  duration: VideoDuration;
  aspectRatio: VideoAspectRatio;
  inputImageUrl?: string;
  videoUrl?: string;
  status: VideoJobStatus;
  progress: number; // 0 - 100
  queuePosition?: number;
  message?: string;
  provider?: VideoProvider;
  createdAt: number;
  error?: string;
  fallbackAvailable?: boolean;
}

export interface VideoHistoryItem {
  id: string;
  prompt: string;
  mode: VideoMode;
  videoUrl: string;
  aspectRatio: VideoAspectRatio;
  duration: VideoDuration;
  createdAt: number;
  provider: VideoProvider;
}
