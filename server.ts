import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { Client } from '@gradio/client';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '50mb' }));

// Helper to get GoogleGenAI client with required User-Agent
const getAIClient = (overrideApiKey?: string) => {
  const apiKey = overrideApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not set. Please set your Gemini API key in the Settings > Secrets panel or provide your custom key.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// Character Chat API endpoint
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { character, history = [], message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message text is required.' });
    }

    if (!character || !character.name) {
      return res.status(400).json({ error: 'Character data is required.' });
    }

    let ai: GoogleGenAI;
    try {
      ai = getAIClient();
    } catch (keyErr: any) {
      return res.status(401).json({
        error: keyErr.message || 'API key missing',
        details: 'Please ensure your Gemini API key is configured in Settings > Secrets.',
      });
    }

    // Build strong system instructions tailored for immersive roleplay
    const systemInstruction = `You are roleplaying as "${character.name}".
Stay completely in character at all times. Never say "I am an AI assistant" or break the fourth wall unless your persona explicitly calls for it.

CHARACTER PROFILE:
- Name: ${character.name}
- Tagline / Concept: ${character.tagline || character.description || 'A fascinating companion'}
- Core Personality: ${character.personality || 'Engaging, thoughtful, and expressive'}
- Scenario & Background: ${character.scenario || 'You are chatting casually with a close companion in your world.'}

CONVERSATION & ROLEPLAY GUIDELINES:
1. Speak in a conversational, messaging-style format suitable for a mobile chat app like WhatsApp.
2. Maintain your distinctive tone, vocabulary, quirks, catchphrases, and emotional presence throughout.
3. You can use subtle roleplay actions wrapped in asterisks when natural (e.g. *chuckles softly*, *takes a sip of tea*, *adjusts glasses*).
4. Keep replies natural in length: usually 1 to 3 vivid paragraphs. Avoid overly long robotic walls of text.
5. Emulate deep memory of previous messages in this conversation.
6. Safety & Etiquette: Keep all dialogue PG-13, engaging, constructive, safe, and strictly non-explicit. Never produce abusive, sexually explicit, hateful, or harmful content.`;

    // Format chat contents according to @google/genai guidelines
    const contents: any[] = [];

    // Filter and add prior history (up to last 20 messages for context)
    const recentHistory = history.slice(-20);
    for (const item of recentHistory) {
      if (item && item.content && (item.role === 'user' || item.role === 'model')) {
        contents.push({
          role: item.role === 'user' ? 'user' : 'model',
          parts: [{ text: item.content }],
        });
      }
    }

    // Add current user prompt
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Use gemini-2.5-flash as specified by user
    let replyText = '';
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.85,
          topP: 0.95,
        },
      });

      replyText = response.text || '';
    } catch (primaryErr: any) {
      console.warn('Primary model error, attempting fallback to gemini-3.8-flash:', primaryErr.message);
      // Fallback to gemini-3.8-flash if gemini-2.5-flash is temporarily unavailable
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
          temperature: 0.85,
        },
      });
      replyText = fallbackResponse.text || '';
    }

    if (!replyText) {
      replyText = `*${character.name} smiles and listens carefully.* "I hear you, my friend. Tell me more."`;
    }

    return res.json({ reply: replyText });
  } catch (err: any) {
    console.error('Chat API Error:', err);
    let errorMessage = err.message || 'Failed to generate character response.';
    let status = 500;

    if (errorMessage.includes('API_KEY') || errorMessage.includes('403') || errorMessage.includes('PERMISSION_DENIED')) {
      status = 403;
      errorMessage = 'Gemini API key is invalid or lacks permission. Please verify your API key in Settings > Secrets.';
    } else if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
      status = 429;
      errorMessage = 'Rate limit reached or quota exceeded. Please wait a moment and try again.';
    }

    return res.status(status).json({ error: errorMessage });
  }
});

// Scene & Avatar Image Generation API endpoint
app.post('/api/gemini/image', async (req, res) => {
  try {
    const { prompt, characterName, style = 'cinematic digital art' } = req.body;

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'Image prompt description is required.' });
    }

    let ai: GoogleGenAI;
    try {
      ai = getAIClient();
    } catch (keyErr: any) {
      return res.status(401).json({
        error: keyErr.message || 'API key missing',
        details: 'Please ensure your Gemini API key is configured in Settings > Secrets.',
      });
    }

    // Enhance prompt for character scenes
    const fullPrompt = characterName 
      ? `A highly detailed, beautiful ${style} scene featuring ${characterName}: ${prompt}. Masterpiece quality, vibrant lighting, expressive character composition, safe for all audiences.`
      : `A highly detailed, beautiful ${style} scene: ${prompt}. Masterpiece quality, rich colors, atmospheric lighting, safe for all audiences.`;

    let imageUrl = '';

    // Attempt 1: gemini-3.1-flash-lite-image
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [{ text: fullPrompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: '1:1',
          },
        },
      });

      const parts = response.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          const mime = part.inlineData.mimeType || 'image/png';
          imageUrl = `data:${mime};base64,${part.inlineData.data}`;
          break;
        }
      }
    } catch (geminiImgErr: any) {
      console.warn('gemini-3.1-flash-lite-image failed, attempting imagen-3.0-generate-002:', geminiImgErr.message);

      // Attempt 2: imagen-3.0-generate-002
      try {
        const imagenResponse = await ai.models.generateImages({
          model: 'imagen-3.0-generate-002',
          prompt: fullPrompt,
          config: {
            numberOfImages: 1,
            outputMimeType: 'image/jpeg',
            aspectRatio: '1:1',
          },
        });

        const base64Data = imagenResponse.generatedImages?.[0]?.image?.imageBytes;
        if (base64Data) {
          imageUrl = `data:image/jpeg;base64,${base64Data}`;
        }
      } catch (fallbackImgErr: any) {
        throw new Error(fallbackImgErr.message || geminiImgErr.message || 'Image generation failed');
      }
    }

    if (!imageUrl) {
      return res.status(500).json({ error: 'No image was returned from the AI model. Please try a different scene description.' });
    }

    return res.json({ imageUrl, prompt: fullPrompt });
  } catch (err: any) {
    console.error('Image Generation Error:', err);
    let errorMessage = err.message || 'Failed to generate image.';
    let status = 500;

    if (errorMessage.includes('API_KEY') || errorMessage.includes('403')) {
      status = 403;
      errorMessage = 'Gemini API key is invalid or lacks image generation permissions. Check Settings > Secrets.';
    } else if (errorMessage.includes('RESOURCE_EXHAUSTED') || errorMessage.includes('429')) {
      status = 429;
      errorMessage = 'Image generation quota limit reached. Please wait a moment or try again later.';
    }

    return res.status(status).json({ error: errorMessage });
  }
});

// ==========================================
// VIDEO STUDIO BACKEND LOGIC
// ==========================================

interface VideoJobInternal {
  id: string;
  mode: 'text-to-video' | 'image-to-video';
  prompt: string;
  motionPrompt?: string;
  duration: '5s' | '10s';
  aspectRatio: '16:9' | '9:16';
  imageBase64?: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  queuePosition?: number;
  message: string;
  videoUrl?: string;
  provider?: 'huggingface' | 'gemini';
  error?: string;
  fallbackAvailable?: boolean;
  createdAt: number;
}

// In-memory jobs storage (retains recent jobs)
const videoJobs = new Map<string, VideoJobInternal>();

// Clean old jobs periodically (older than 1 hour)
setInterval(() => {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  for (const [id, job] of videoJobs.entries()) {
    if (job.createdAt < oneHourAgo) {
      videoJobs.delete(id);
    }
  }
}, 15 * 60 * 1000);

// Content safety check helper
const isUnsafeContent = (text: string): boolean => {
  if (!text) return false;
  const lower = text.toLowerCase();
  const prohibited = [
    'nude', 'naked', 'undress', 'nsfw', 'porn', 'erotic', 'nudity', 
    'sexual', 'vagina', 'penis', 'boobs', 'breasts', 'stripper', 
    'deepfake', 'gore', 'decapitat', 'suicide', 'kill yourself',
  ];
  return prohibited.some(term => lower.includes(term));
};

// Background worker to process video jobs with HuggingFace -> Gemini fallback
async function processVideoJob(jobId: string, customApiKey?: string) {
  const job = videoJobs.get(jobId);
  if (!job) return;

  // 1. Content Safety Check
  if (isUnsafeContent(job.prompt) || (job.motionPrompt && isUnsafeContent(job.motionPrompt))) {
    job.status = 'failed';
    job.error = 'Prompt violates content safety policy. Only safe, PG-13, creative prompts are permitted.';
    job.message = 'Content safety check failed.';
    return;
  }

  job.status = 'processing';
  job.progress = 10;
  job.message = 'Checking free Hugging Face Space video model...';

  let huggingFaceSuccess = false;

  // Attempt 1: Hugging Face Space via @gradio/client with quick timeout
  try {
    job.provider = 'huggingface';
    job.message = 'Connecting to Hugging Face Space...';

    // Race connection with timeout so the user is never stuck
    const connectPromise = Client.connect('damo-vilab/modelscope-text-to-video-synthesis');
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Hugging Face Space connection timed out (busy/queue exceeded).')), 18000)
    );

    const client = await Promise.race([connectPromise, timeoutPromise]);

    job.message = 'Submitting prompt to Hugging Face queue...';
    job.progress = 25;

    const gradioJob: any = client.submit('/predict', [job.prompt]);

    // Track status if supported
    if (gradioJob && typeof gradioJob.on === 'function') {
      gradioJob.on('status', (status: any) => {
        if (status.stage === 'pending') {
          job.queuePosition = status.position ?? 1;
          job.message = `In queue at position #${job.queuePosition}...`;
          job.progress = Math.min(45, 20 + (status.position ? 5 : 15));
        } else if (status.stage === 'generating') {
          job.queuePosition = 0;
          job.message = 'Hugging Face model is synthesizing video frames...';
          job.progress = 65;
        }
      });
    }

    // Wait up to 60s for free space result
    const resultTimeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Hugging Face generation taking too long or queue busy.')), 60000)
    );

    const result: any = await Promise.race([gradioJob, resultTimeoutPromise]);

    if (result && result.data && result.data[0]) {
      const outputVideo = result.data[0];
      const videoSrc = typeof outputVideo === 'string' ? outputVideo : outputVideo.video || outputVideo.url;
      if (videoSrc) {
        job.videoUrl = videoSrc;
        job.status = 'completed';
        job.progress = 100;
        job.message = 'Video successfully generated with Hugging Face Space!';
        huggingFaceSuccess = true;
        return;
      }
    }
  } catch (hfErr: any) {
    console.warn(`Hugging Face Space attempt failed for job ${jobId}:`, hfErr.message);
  }

  // Attempt 2: Fallback to Gemini Omni Flash (gemini-omni-1.1-flash)
  if (!huggingFaceSuccess) {
    const effectiveKey = customApiKey || process.env.GEMINI_API_KEY;

    if (!effectiveKey) {
      job.status = 'failed';
      job.fallbackAvailable = true;
      job.error = 'The free Hugging Face Space model is currently busy or queued. Please provide your Gemini API key in the Video Studio settings to generate immediately using Gemini Omni Flash.';
      job.message = 'Hugging Face busy. Gemini API key required for fallback.';
      return;
    }

    job.provider = 'gemini';
    job.message = 'Hugging Face busy. Switched to Gemini Omni Flash (gemini-omni-1.1-flash)...';
    job.progress = 30;

    try {
      const ai = getAIClient(effectiveKey);

      let interaction: any;

      if (job.mode === 'image-to-video' && job.imageBase64) {
        // Parse data URI
        let mimeType = 'image/png';
        let rawBase64 = job.imageBase64;
        const match = job.imageBase64.match(/^data:([^;]+);base64,(.+)$/);
        if (match) {
          mimeType = match[1];
          rawBase64 = match[2];
        }

        job.message = 'Animating image with Gemini Omni Flash...';
        job.progress = 40;

        interaction = await ai.interactions.create({
          model: 'gemini-omni-1.1-flash',
          input: [
            {
              type: 'image',
              mime_type: mimeType,
              data: rawBase64,
            },
            {
              type: 'text',
              text: job.motionPrompt || job.prompt || 'Bring this scene to life with smooth, high quality cinematic animation.',
            },
          ],
          background: true,
          store: false,
          response_format: {
            type: 'video',
            aspect_ratio: job.aspectRatio,
          },
        });
      } else {
        // Text-to-Video
        job.message = 'Synthesizing video with Gemini Omni Flash...';
        job.progress = 40;

        interaction = await ai.interactions.create({
          model: 'gemini-omni-1.1-flash',
          input: job.prompt,
          background: true,
          store: false,
          response_format: {
            type: 'video',
            aspect_ratio: job.aspectRatio,
            duration: job.duration,
          },
        });
      }

      // Poll background interaction until completed
      let attempts = 0;
      const maxAttempts = 50; // ~3.5 minutes max
      while (attempts < maxAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 4000));
        attempts++;

        const current = await ai.interactions.get(interaction.id);

        job.progress = Math.min(94, 40 + Math.floor(attempts * 1.8));
        job.message = `Rendering video frames with Gemini (${job.progress}%)...`;

        if (current.status === 'completed') {
          const videoPart = current.output_video;
          if (videoPart && videoPart.data) {
            const mime = videoPart.mime_type || 'video/mp4';
            job.videoUrl = `data:${mime};base64,${videoPart.data}`;
            job.status = 'completed';
            job.progress = 100;
            job.message = 'Video generated successfully with Gemini Omni Flash!';
            return;
          } else if (videoPart && videoPart.uri) {
            job.videoUrl = videoPart.uri;
            job.status = 'completed';
            job.progress = 100;
            job.message = 'Video generated successfully with Gemini Omni Flash!';
            return;
          } else {
            throw new Error('Gemini Omni Flash returned completed status without video data.');
          }
        } else if (current.status === 'failed' || current.status === 'cancelled') {
          throw new Error(`Gemini video generation ended with status: ${current.status}`);
        }
      }

      throw new Error('Video generation timed out while polling.');
    } catch (geminiErr: any) {
      console.error('Gemini video generation error:', geminiErr);
      job.status = 'failed';
      job.fallbackAvailable = true;

      let msg = geminiErr.message || 'Gemini video generation failed.';
      if (msg.includes('API_KEY') || msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
        msg = 'Invalid Gemini API key or missing permissions for gemini-omni-1.1-flash. Please check your key.';
      } else if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
        msg = 'Gemini video rate limit exceeded. Please try again in a few moments.';
      }

      job.error = msg;
      job.message = 'Video generation failed.';
    }
  }
}

// POST /api/video/generate
app.post('/api/video/generate', async (req, res) => {
  try {
    const {
      mode = 'text-to-video',
      prompt,
      motionPrompt,
      duration = '5s',
      aspectRatio = '16:9',
      imageBase64,
      geminiApiKey,
    } = req.body;

    if (mode === 'text-to-video' && (!prompt || typeof prompt !== 'string' || !prompt.trim())) {
      return res.status(400).json({ error: 'Text prompt is required for Text-to-Video.' });
    }

    if (mode === 'image-to-video' && !imageBase64) {
      return res.status(400).json({ error: 'Source image is required for Image-to-Video.' });
    }

    // Early safety check
    if (isUnsafeContent(prompt || '') || isUnsafeContent(motionPrompt || '')) {
      return res.status(400).json({
        error: 'Content safety policy violation. Only safe, PG-13, creative prompts are permitted.',
      });
    }

    const jobId = 'vjob-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);

    const newJob: VideoJobInternal = {
      id: jobId,
      mode,
      prompt: prompt ? prompt.trim() : 'Bring image to life',
      motionPrompt: motionPrompt ? motionPrompt.trim() : undefined,
      duration: duration === '10s' ? '10s' : '5s',
      aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9',
      imageBase64,
      status: 'queued',
      progress: 0,
      message: 'Job queued...',
      createdAt: Date.now(),
    };

    videoJobs.set(jobId, newJob);

    // Fire background execution
    const customKey = geminiApiKey || (req.headers['x-gemini-api-key'] as string) || undefined;
    processVideoJob(jobId, customKey);

    return res.json({
      jobId,
      status: newJob.status,
      message: newJob.message,
    });
  } catch (err: any) {
    console.error('Error initiating video job:', err);
    return res.status(500).json({ error: err.message || 'Failed to start video generation.' });
  }
});

// GET /api/video/status/:jobId
app.get('/api/video/status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = videoJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Video job not found or expired.' });
  }

  return res.json({
    id: job.id,
    mode: job.mode,
    prompt: job.prompt,
    status: job.status,
    progress: job.progress,
    queuePosition: job.queuePosition,
    message: job.message,
    videoUrl: job.videoUrl,
    provider: job.provider,
    error: job.error,
    fallbackAvailable: job.fallbackAvailable,
    createdAt: job.createdAt,
  });
});

// Setup Vite middleware in dev or static serving in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`PersonaAI server running on http://0.0.0.0:${port} [mode: ${isProduction ? 'production' : 'development'}]`);
  });
}

startServer();
