import React, { useState } from 'react';
import { Character, CharacterCategory } from '../types/character';
import { AVATAR_PRESETS } from '../data/presetCharacters';
import { X, Upload, Sparkles, Check, Image as ImageIcon, Wand2 } from 'lucide-react';

interface CreateCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (character: Character) => void;
}

const CATEGORIES: CharacterCategory[] = ['Fantasy', 'Anime', 'Friend', 'Mentor', 'Funny', 'Sci-Fi'];

const STARTER_TEMPLATES = [
  {
    label: 'Tsundere Anime Friend',
    category: 'Anime' as CharacterCategory,
    personality: 'Feisty, sharp-tongued, easily embarrassed, secretly cares deeply for the user. Uses playful denials like "It\'s not like I wanted to talk to you or anything, b-baka!"',
    greeting: 'H-hey! Why are you looking at me like that?! I just happened to be passing by, okay? Don\'t go getting the wrong idea!',
    scenario: 'Walking home together along the cherry blossom riverbank after high school class.',
    tagline: 'Feisty anime companion with a hidden warm heart',
  },
  {
    label: 'Cyberpunk Netrunner',
    category: 'Sci-Fi' as CharacterCategory,
    personality: 'Cynical, street-smart, technical genius, speaks in neon noir slang. Loyal to those in their trusted circle.',
    greeting: 'Line is encrypted. Sit down and keep your head low. What data are we extracting from the Megacorp tonight, runner?',
    scenario: 'Hunched inside a rain-soaked neon hacker den in Neo-Shinjuku, surrounded by holographic code terminals.',
    tagline: 'Elite rogue hacker navigating high-tech neon underworlds',
  },
  {
    label: 'Ancient Arcane Sensei',
    category: 'Fantasy' as CharacterCategory,
    personality: 'Serene, enigmatic, playful, master of elemental arts. Teaches through riddles, tea ceremonies, and mindfulness.',
    greeting: 'The mountain wind welcomes your breath. Pour yourself a bowl of jasmine tea, young one. What art do you wish to master today?',
    scenario: 'Sitting beside a bamboo pond in a mist-shrouded monastery high in the clouds.',
    tagline: 'Wise elemental master guiding your hidden potential',
  },
  {
    label: 'Empathetic Life Coach',
    category: 'Mentor' as CharacterCategory,
    personality: 'Warm, compassionate, active listener, practical, encouraging. Helps clarify thoughts, manage anxiety, and plan steps.',
    greeting: 'Hi there! I am so glad we connected today. Take a deep breath. Whatever has been on your mind, this is your safe, judgment-free space. How are you really feeling?',
    scenario: 'A cozy sunlit study with plants, soft ambient music, and a warm cup of herbal tea.',
    tagline: 'Compassionate mentor for mindset, clarity, and daily peace',
  },
  {
    label: 'Witty Stand-up Comedian',
    category: 'Funny' as CharacterCategory,
    personality: 'Sarcastic, observational, full of snappy one-liners and relatable self-deprecating humor. Turns any situation into a laugh.',
    greeting: 'Look who finally decided to grace us with their presence! What\'s happening, chief? Did you come for life advice or are you ready for roasted reality?',
    scenario: 'Backstage green room of an underground comedy club with a brick wall and a microphone.',
    tagline: 'Sharp-tongued comic ready to roast or cheer you up',
  },
];

export const CreateCharacterModal: React.FC<CreateCharacterModalProps> = ({
  isOpen,
  onClose,
  onSave,
}) => {
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState<CharacterCategory>('Fantasy');
  const [avatar, setAvatar] = useState(AVATAR_PRESETS[0]);
  const [personality, setPersonality] = useState('');
  const [greeting, setGreeting] = useState('');
  const [scenario, setScenario] = useState('');
  const [pitch, setPitch] = useState(1.0);
  const [rate, setRate] = useState(1.0);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    if (file.size > 4 * 1024 * 1024) {
      setError('Image must be under 4MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setAvatar(event.target.result as string);
        setError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const applyTemplate = (tmpl: typeof STARTER_TEMPLATES[0]) => {
    setName(tmpl.label);
    setTagline(tmpl.tagline);
    setCategory(tmpl.category);
    setPersonality(tmpl.personality);
    setGreeting(tmpl.greeting);
    setScenario(tmpl.scenario);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Character name is required.');
      return;
    }

    if (!personality.trim()) {
      setError('Please define the character\'s personality / prompt.');
      return;
    }

    if (!greeting.trim()) {
      setError('Please provide a starting greeting message.');
      return;
    }

    const newChar: Character = {
      id: 'custom-' + Date.now(),
      name: name.trim(),
      tagline: tagline.trim() || 'Custom AI Companion',
      description: tagline.trim() || `${name} is a custom ${category} persona created by you.`,
      category,
      avatar,
      personality: personality.trim(),
      greeting: greeting.trim(),
      scenario: scenario.trim() || 'A relaxed personal conversation with the user.',
      voiceConfig: {
        pitch,
        rate,
      },
      promptSuggestions: [
        `${name} in their signature environment`,
        `A dramatic cinematic portrait of ${name}`,
        `${name} smiling warmly at sunset`,
      ],
      isCustom: true,
      createdAt: Date.now(),
    };

    onSave(newChar);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-2xl bg-[#111b21] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-[#162229]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">Create Your Character</h2>
              <p className="text-xs text-slate-400">Build an AI persona with custom lore, voice, and greetings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick starter templates */}
        <div className="px-6 pt-4 pb-2 border-b border-slate-800/60 bg-[#0d151a]">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 mb-2">
            <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Quick Start Templates (Optional):</span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {STARTER_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.label}
                type="button"
                onClick={() => applyTemplate(tmpl)}
                className="px-3 py-1 rounded-full text-xs bg-slate-800/80 hover:bg-emerald-600 hover:text-white text-slate-300 border border-slate-700 transition-colors whitespace-nowrap cursor-pointer"
              >
                {tmpl.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          {/* Name & Tagline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                Character Name <span className="text-emerald-400">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kaiden Storm, Lady Guinevere"
                className="w-full bg-[#202c33] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                Short Tagline / Concept
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Rebellious space mechanic with a golden heart"
                className="w-full bg-[#202c33] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Category
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-[#202c33] text-slate-300 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Avatar Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Avatar (Upload or Select)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3 bg-[#202c33]/70 rounded-2xl border border-slate-700/80">
              {/* Preview */}
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-emerald-500 flex-shrink-0 shadow-md">
                <img src={avatar} alt="Avatar preview" className="w-full h-full object-cover" />
              </div>

              {/* Upload button */}
              <div className="flex-1 space-y-2">
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer border border-slate-600 transition-colors">
                  <Upload className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Upload custom image file</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <div className="text-[11px] text-slate-400">
                  Or select a preset portrait:
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {AVATAR_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAvatar(preset)}
                      className={`w-9 h-9 rounded-xl overflow-hidden border-2 transition-transform flex-shrink-0 cursor-pointer ${
                        avatar === preset ? 'border-emerald-400 scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                    >
                      <img src={preset} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Personality / System Prompt */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase text-slate-300">
                Personality & Tone <span className="text-emerald-400">*</span>
              </label>
              <span className="text-[11px] text-slate-400">Guides how the AI roleplays</span>
            </div>
            <textarea
              required
              rows={3}
              value={personality}
              onChange={(e) => setPersonality(e.target.value)}
              placeholder="e.g. Sarcastic yet fiercely protective archer. Speaks with medieval flair, uses witty dry humor, and values honor above all."
              className="w-full bg-[#202c33] border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Greeting message */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase text-slate-300">
                Opening Greeting Message <span className="text-emerald-400">*</span>
              </label>
              <span className="text-[11px] text-slate-400">First message sent when chat opens</span>
            </div>
            <textarea
              required
              rows={2}
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="e.g. *leans against the tavern wall and nods* Well, well. Look who decided to venture into the shadow district..."
              className="w-full bg-[#202c33] border border-slate-700 rounded-xl p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Scenario & Context */}
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
              Scenario & Setting Context
            </label>
            <input
              type="text"
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="e.g. Resting beside a campfire under twin moons after a perilous dungeon raid."
              className="w-full bg-[#202c33] border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Voice Tuning */}
          <div className="p-3 bg-[#202c33]/40 rounded-2xl border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-300">
              Voice Synthesis Settings
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Pitch</span>
                  <span>{pitch.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.6"
                  max="1.4"
                  step="0.05"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Speed / Rate</span>
                  <span>{rate.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min="0.75"
                  max="1.3"
                  step="0.05"
                  value={rate}
                  onChange={(e) => setRate(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-950/40 transition-all active:scale-95 cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Create Character</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
