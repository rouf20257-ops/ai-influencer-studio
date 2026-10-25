import React, { useState } from 'react';
import { Character } from '../types/character';
import { X, Sparkles, Image as ImageIcon, Loader2, Wand2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface GenerateImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onImageGenerated: (imageUrl: string, prompt: string) => void;
}

const STYLES = [
  'Cinematic Digital Art',
  'Vibrant Anime Illustration',
  'Epic Fantasy Oil Painting',
  'Cyberpunk Neon Noir',
  'Cozy Watercolor Storybook',
];

export const GenerateImageModal: React.FC<GenerateImageModalProps> = ({
  isOpen,
  onClose,
  character,
  onImageGenerated,
}) => {
  const [prompt, setPrompt] = useState(
    character.promptSuggestions?.[0] || `${character.name} in a scenic atmospheric setting`
  );
  const [selectedStyle, setSelectedStyle] = useState(STYLES[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const result = await geminiService.generateImage({
        prompt: prompt.trim(),
        characterName: character.name,
        style: selectedStyle,
      });

      onImageGenerated(result.imageUrl, prompt.trim());
      onClose();
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || 'Failed to generate image. Please try a different scene description.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-[#111b21] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#162229]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Generate Scene Image</h2>
              <p className="text-xs text-slate-400">Illustrate a scene with {character.name}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleGenerate} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {/* Quick suggestions */}
          {character.promptSuggestions && character.promptSuggestions.length > 0 && (
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-400 mb-2">
                Suggested Scenes:
              </label>
              <div className="space-y-1.5">
                {character.promptSuggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setPrompt(sug)}
                    className="w-full text-left text-xs px-3 py-2 rounded-xl bg-[#202c33] hover:bg-[#2a3942] text-slate-300 hover:text-white border border-slate-700/60 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <Wand2 className="w-3.5 h-3.5 text-teal-400 flex-shrink-0" />
                    <span className="line-clamp-1">{sug}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Prompt input */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Scene Description <span className="text-emerald-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={`Describe what ${character.name} is doing, wearing, or the environment around them...`}
              className="w-full bg-[#202c33] border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 resize-none"
            />
          </div>

          {/* Style Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Visual Art Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setSelectedStyle(style)}
                  className={`text-xs px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedStyle === style
                      ? 'bg-teal-600/30 text-teal-300 border-teal-500 font-semibold'
                      : 'bg-[#202c33] text-slate-400 border-slate-700/60 hover:text-slate-200'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 disabled:opacity-50 text-white font-semibold text-sm shadow-lg shadow-teal-950/40 transition-all active:scale-95 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Scene...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4" />
                  <span>Create Scene</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
