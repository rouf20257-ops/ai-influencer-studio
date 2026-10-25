import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Sparkles,
  Upload,
  Play,
  Pause,
  Download,
  Trash2,
  Settings,
  Key,
  Clock,
  Layers,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Maximize2,
  RefreshCw,
  Copy,
  Check,
  Wand2,
} from 'lucide-react';
import {
  VideoJob,
  VideoHistoryItem,
  VideoMode,
  VideoAspectRatio,
  VideoDuration,
} from '../types/video';
import { videoService } from '../services/videoService';

const TEXT_PROMPT_SUGGESTIONS = [
  'A neon cybernetic owl perched on a rain-drenched rooftop in Tokyo with glowing reflections',
  'Celestial nebula blooming into a cosmic lotus flower in deep space with starlight',
  'Majestic silver dragon soaring across storm clouds with vibrant lightning crackles',
  'Cozy steampunk coffee shop with brass gears, steam rising from antique cups, and rain on window',
  'Whimsical watercolor village under starry skies with floating lanterns drifting up',
];

const MOTION_SUGGESTIONS = [
  'Gentle camera push-in with soft atmospheric dust particles floating in golden light',
  'Slow, cinematic panning shot with wind rippling softly across the scenery',
  'Subtle natural breathing movement with shimmering reflections in water',
  'Dynamic slow-motion camera orbit with dramatic lighting transitions',
];

export const VideoStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<VideoMode>('text-to-video');

  // Text-to-video inputs
  const [prompt, setPrompt] = useState(TEXT_PROMPT_SUGGESTIONS[0]);
  const [duration, setDuration] = useState<VideoDuration>('5s');
  const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');

  // Image-to-video inputs
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [motionPrompt, setMotionPrompt] = useState(MOTION_SUGGESTIONS[0]);

  // Generation state
  const [currentJob, setCurrentJob] = useState<VideoJob | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);

  // Settings & API Key modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [showKeyText, setShowKeyText] = useState(false);

  // Active Video Player state
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [activeVideoPrompt, setActiveVideoPrompt] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // History Gallery
  const [history, setHistory] = useState<VideoHistoryItem[]>(() =>
    videoService.getVideoHistory()
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load custom key on mount
  useEffect(() => {
    const existingKey = videoService.getCustomGeminiKey();
    if (existingKey) {
      setCustomKeyInput(existingKey);
      setHasSavedKey(true);
    }
    // Preload history
    const saved = videoService.getVideoHistory();
    setHistory(saved);
    if (saved.length > 0) {
      setActiveVideoUrl(saved[0].videoUrl);
      setActiveVideoPrompt(saved[0].prompt);
    }
  }, []);

  // Poll current job if running
  useEffect(() => {
    if (!currentJob || !isGenerating) return;

    const interval = setInterval(async () => {
      try {
        const updated = await videoService.checkJobStatus(currentJob.id);
        setCurrentJob(updated);

        if (updated.status === 'completed') {
          setIsGenerating(false);
          if (updated.videoUrl) {
            setActiveVideoUrl(updated.videoUrl);
            setActiveVideoPrompt(updated.prompt);

            // Add to history
            const historyItem: VideoHistoryItem = {
              id: 'hist-' + Date.now(),
              prompt: updated.prompt,
              mode: updated.mode,
              videoUrl: updated.videoUrl,
              aspectRatio: updated.aspectRatio || '16:9',
              duration: updated.duration || '5s',
              createdAt: Date.now(),
              provider: updated.provider || 'gemini',
            };
            const newHistory = videoService.saveToHistory(historyItem);
            setHistory(newHistory);
          }
        } else if (updated.status === 'failed') {
          setIsGenerating(false);
          setErrorBanner(updated.error || 'Video generation failed.');
        }
      } catch (err: any) {
        console.error('Polling error:', err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [currentJob, isGenerating]);

  // Handle Image File Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorBanner('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorBanner('Image must be under 8MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImagePreview(event.target.result as string);
        setErrorBanner(null);
      }
    };
    reader.readAsDataURL(file);
  };

  // Launch Video Generation
  const handleGenerate = async () => {
    setErrorBanner(null);

    if (activeTab === 'text-to-video' && !prompt.trim()) {
      setErrorBanner('Please enter a description for the video.');
      return;
    }

    if (activeTab === 'image-to-video' && !imagePreview) {
      setErrorBanner('Please upload an image to animate.');
      return;
    }

    setIsGenerating(true);

    try {
      const response = await videoService.startGeneration({
        mode: activeTab,
        prompt: activeTab === 'text-to-video' ? prompt.trim() : (motionPrompt.trim() || 'Bring image to life with subtle animation'),
        motionPrompt: activeTab === 'image-to-video' ? motionPrompt.trim() : undefined,
        duration,
        aspectRatio,
        imageBase64: activeTab === 'image-to-video' ? imagePreview || undefined : undefined,
      });

      const initialJob: VideoJob = {
        id: response.jobId,
        mode: activeTab,
        prompt: activeTab === 'text-to-video' ? prompt.trim() : motionPrompt.trim(),
        motionPrompt: activeTab === 'image-to-video' ? motionPrompt.trim() : undefined,
        duration,
        aspectRatio,
        status: 'queued',
        progress: 10,
        message: 'Connecting to free Hugging Face Space model...',
        createdAt: Date.now(),
      };

      setCurrentJob(initialJob);
    } catch (err: any) {
      console.error('Start generation error:', err);
      setIsGenerating(false);
      setErrorBanner(err.message || 'Failed to start video generation.');
    }
  };

  // Save custom key
  const handleSaveKey = () => {
    if (!customKeyInput.trim()) {
      videoService.clearCustomGeminiKey();
      setHasSavedKey(false);
      setIsSettingsOpen(false);
      return;
    }

    videoService.setCustomGeminiKey(customKeyInput.trim());
    setHasSavedKey(true);
    setIsSettingsOpen(false);
    setErrorBanner(null);
  };

  // Toggle video playback
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Copy prompt
  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Delete history item
  const handleDeleteHistory = (id: string) => {
    const updated = videoService.deleteFromHistory(id);
    setHistory(updated);
    if (activeVideoUrl && history.find(h => h.id === id)?.videoUrl === activeVideoUrl) {
      if (updated.length > 0) {
        setActiveVideoUrl(updated[0].videoUrl);
        setActiveVideoPrompt(updated[0].prompt);
      } else {
        setActiveVideoUrl(null);
        setActiveVideoPrompt('');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 flex items-center justify-center shadow-lg shadow-teal-500/20">
            <Film className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                Video Studio
              </h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase tracking-wider">
                AI Motion
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Generate cinematic clips from text or animate still images
            </p>
          </div>
        </div>

        {/* Settings button */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
            hasSavedKey
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20'
              : 'bg-[#202c33] text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700/60'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>API & Model Settings</span>
          {hasSavedKey && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          )}
        </button>
      </div>

      {/* Error alert banner */}
      {errorBanner && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs sm:text-sm flex items-start justify-between gap-3 shadow-lg">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-rose-300">Generation Notice</div>
              <p className="text-xs text-rose-200/90 leading-relaxed">{errorBanner}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {errorBanner.includes('Gemini API key') && (
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-xs font-semibold cursor-pointer"
              >
                Open Settings
              </button>
            )}
            <button
              onClick={() => setErrorBanner(null)}
              className="p-1 text-rose-400 hover:text-white font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Workspace: Left Controls, Right Preview Player */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Generator Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Tabs */}
          <div className="p-1 bg-[#111b21] rounded-2xl border border-slate-800 flex gap-1">
            <button
              onClick={() => {
                setActiveTab('text-to-video');
                setErrorBanner(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'text-to-video'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>Text to Video</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('image-to-video');
                setErrorBanner(null);
              }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                activeTab === 'image-to-video'
                  ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-md shadow-emerald-950/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              }`}
            >
              <Film className="w-4 h-4" />
              <span>Image to Video</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="bg-[#111b21] border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-5 shadow-xl">
            {activeTab === 'text-to-video' ? (
              /* Text to Video Tab */
              <div className="space-y-4">
                {/* Prompt Suggestions */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase text-slate-400 flex items-center gap-1.5">
                      <Wand2 className="w-3.5 h-3.5 text-teal-400" />
                      <span>Inspiration Prompts:</span>
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {TEXT_PROMPT_SUGGESTIONS.map((sug, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setPrompt(sug)}
                        className="w-full text-left text-xs px-3 py-2 rounded-xl bg-[#202c33]/70 hover:bg-[#202c33] text-slate-300 hover:text-teal-300 border border-slate-800 hover:border-teal-500/40 transition-colors line-clamp-1 cursor-pointer"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Textarea */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                    Prompt Description <span className="text-emerald-400">*</span>
                  </label>
                  <textarea
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe motion, camera movement, scene lighting, characters, and atmosphere..."
                    className="w-full bg-[#202c33] border border-slate-700/80 rounded-2xl p-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none transition-all"
                  />
                </div>
              </div>
            ) : (
              /* Image to Video Tab */
              <div className="space-y-4">
                {/* Image Upload Area */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                    Source Image <span className="text-emerald-400">*</span>
                  </label>

                  {imagePreview ? (
                    <div className="relative rounded-2xl overflow-hidden border-2 border-teal-500/60 max-h-64 bg-slate-900 group">
                      <img
                        src={imagePreview}
                        alt="Source to animate"
                        className="w-full h-48 sm:h-56 object-contain mx-auto"
                      />
                      <button
                        onClick={() => setImagePreview(null)}
                        className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                        title="Remove image"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-slate-700 hover:border-teal-500/60 rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer bg-[#202c33]/40 hover:bg-[#202c33]/70 transition-all group">
                      <div className="w-12 h-12 rounded-2xl bg-teal-500/10 group-hover:bg-teal-500/20 text-teal-400 flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="text-sm font-semibold text-white">
                        Click or drag image to upload
                      </span>
                      <span className="text-xs text-slate-400 mt-1">
                        Supports PNG, JPG, WebP up to 8MB
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Motion Prompt */}
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                    Motion Prompt (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={motionPrompt}
                    onChange={(e) => setMotionPrompt(e.target.value)}
                    placeholder="e.g. Gentle camera push-in, leaves blowing in wind..."
                    className="w-full bg-[#202c33] border border-slate-700/80 rounded-2xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none transition-all"
                  />
                  {/* Motion shortcuts */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {MOTION_SUGGESTIONS.map((mot, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setMotionPrompt(mot)}
                        className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-teal-300 border border-slate-700/60 cursor-pointer"
                      >
                        {mot.slice(0, 32)}...
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Video Parameters: Aspect Ratio & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800/80">
              {/* Aspect Ratio */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                  <span>Aspect Ratio</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAspectRatio('16:9')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      aspectRatio === '16:9'
                        ? 'bg-teal-600/30 text-teal-300 border-teal-500'
                        : 'bg-[#202c33] text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-4 h-2.5 border border-current rounded-xs inline-block" />
                    <span>16:9 (Landscape)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAspectRatio('9:16')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      aspectRatio === '9:16'
                        ? 'bg-teal-600/30 text-teal-300 border-teal-500'
                        : 'bg-[#202c33] text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <span className="w-2.5 h-4 border border-current rounded-xs inline-block" />
                    <span>9:16 (Portrait)</span>
                  </button>
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1.5 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-teal-400" />
                  <span>Clip Duration</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setDuration('5s')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      duration === '5s'
                        ? 'bg-teal-600/30 text-teal-300 border-teal-500'
                        : 'bg-[#202c33] text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    5 Seconds (Fast)
                  </button>

                  <button
                    type="button"
                    onClick={() => setDuration('10s')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer ${
                      duration === '10s'
                        ? 'bg-teal-600/30 text-teal-300 border-teal-500'
                        : 'bg-[#202c33] text-slate-400 border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    10 Seconds
                  </button>
                </div>
              </div>
            </div>

            {/* Model Architecture Info note */}
            <div className="p-3 bg-[#202c33]/50 rounded-2xl border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-400 flex-shrink-0" />
                <span>
                  Free Hugging Face Space model &rarr; Gemini Omni Flash fallback
                </span>
              </div>
              <span className="text-[10px] text-teal-400/90 font-mono">
                {hasSavedKey ? 'Custom Key Active' : 'Auto Fallback'}
              </span>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-500 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-teal-950/40 hover:shadow-teal-500/20 transition-all flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Synthesizing Video...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Generate AI Video</span>
                </>
              )}
            </button>
          </div>

          {/* Real-time Progress Card */}
          {isGenerating && currentJob && (
            <div className="p-5 rounded-3xl bg-[#111b21] border border-teal-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-ping" />
                  <span className="font-semibold text-white">
                    {currentJob.provider === 'gemini'
                      ? 'Gemini Omni Flash Model'
                      : 'Hugging Face Space Model'}
                  </span>
                </div>
                <span className="text-teal-400 font-mono font-bold">
                  {currentJob.progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-500 ease-out rounded-full"
                  style={{ width: `${currentJob.progress}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="text-slate-300 font-medium">
                  {currentJob.message}
                </span>
                {currentJob.queuePosition !== undefined && currentJob.queuePosition > 0 && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Queue #{currentJob.queuePosition}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Video Preview Player & Gallery (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Active Preview Player Card */}
          <div className="bg-[#111b21] border border-slate-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Play className="w-4 h-4 text-teal-400 fill-teal-400" />
                <span>Video Player</span>
              </h2>

              {activeVideoUrl && (
                <a
                  href={activeVideoUrl}
                  download="persona-ai-video.mp4"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-semibold transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download MP4</span>
                </a>
              )}
            </div>

            {/* Video Canvas */}
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center border border-slate-800 group">
              {activeVideoUrl ? (
                <>
                  <video
                    ref={videoRef}
                    src={activeVideoUrl}
                    loop
                    playsInline
                    className="w-full h-full object-contain"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    controls
                  />
                </>
              ) : (
                <div className="text-center p-6 space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-800 flex items-center justify-center text-slate-500">
                    <Film className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-semibold text-slate-400">
                    No video generated yet
                  </div>
                  <p className="text-[11px] text-slate-500 max-w-[200px] mx-auto">
                    Type a prompt or upload an image and click Generate to watch your creation here.
                  </p>
                </div>
              )}
            </div>

            {/* Active video caption */}
            {activeVideoPrompt && (
              <div className="p-3 rounded-2xl bg-[#202c33]/60 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-semibold text-teal-400">Active Clip Prompt:</span>
                  <button
                    onClick={() => handleCopyPrompt(activeVideoPrompt, 'active-prompt')}
                    className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === 'active-prompt' ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{copiedId === 'active-prompt' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <p className="line-clamp-2 leading-relaxed">{activeVideoPrompt}</p>
              </div>
            )}
          </div>

          {/* History Gallery */}
          <div className="bg-[#111b21] border border-slate-800 rounded-3xl p-5 space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Generated Video Gallery ({history.length})
                </h3>
              </div>

              {history.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Clear all saved video history?')) {
                      videoService.clearHistory();
                      setHistory([]);
                    }
                  }}
                  className="text-[11px] text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                >
                  Clear History
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                Previously rendered clips will be saved in your browser gallery.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {history.map((item) => {
                  const isCurrent = activeVideoUrl === item.videoUrl;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setActiveVideoUrl(item.videoUrl);
                        setActiveVideoPrompt(item.prompt);
                      }}
                      className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between gap-3 cursor-pointer group ${
                        isCurrent
                          ? 'bg-[#202c33] border-teal-500 shadow-md shadow-teal-950/30'
                          : 'bg-[#182329]/60 hover:bg-[#202c33]/60 border-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700 overflow-hidden flex-shrink-0 flex items-center justify-center">
                          <Play className="w-4 h-4 text-teal-400 fill-teal-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-white font-medium truncate">
                            {item.prompt}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                            <span>{item.aspectRatio}</span>
                            <span>•</span>
                            <span>{item.duration}</span>
                            <span>•</span>
                            <span className="text-teal-400">{item.provider}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <a
                          href={item.videoUrl}
                          download="persona-video.mp4"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/60 transition-colors"
                          title="Download"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteHistory(item.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-700/60 transition-colors"
                          title="Delete from history"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Settings & Custom Gemini Key Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#111b21] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#162229]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Video Studio Settings</h3>
                  <p className="text-[11px] text-slate-400">Manage fallback & API keys</p>
                </div>
              </div>
              <button
                onClick={() => setIsSettingsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-[#202c33]/70 rounded-2xl border border-slate-800 text-xs text-slate-300 space-y-1.5">
                <div className="font-semibold text-teal-300">How video generation works:</div>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  1. The app first tries a free Hugging Face Space model without needing any key.
                </p>
                <p className="text-[11px] leading-relaxed text-slate-400">
                  2. If Hugging Face is busy or queued, it falls back to Google's <span className="text-teal-400 font-mono">gemini-omni-1.1-flash</span> model.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                  Use My Own Gemini API Key (Optional)
                </label>
                <div className="relative">
                  <input
                    type={showKeyText ? 'text' : 'password'}
                    value={customKeyInput}
                    onChange={(e) => setCustomKeyInput(e.target.value)}
                    placeholder="AIzaSy..."
                    className="w-full bg-[#202c33] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKeyText(!showKeyText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
                  >
                    {showKeyText ? 'Hide' : 'Show'}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 mt-1.5">
                  🔒 Stored strictly in your browser's <code className="text-teal-400">localStorage</code>. Never sent anywhere except directly for Gemini video generation.
                </p>
              </div>

              {hasSavedKey && (
                <div className="flex items-center justify-between p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Custom API key is currently saved
                  </span>
                  <button
                    onClick={() => {
                      videoService.clearCustomGeminiKey();
                      setCustomKeyInput('');
                      setHasSavedKey(false);
                    }}
                    className="text-[11px] text-rose-400 hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveKey}
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
