import React from 'react';
import { Character, CharacterCategory } from '../types/character';
import { CharacterCard } from './CharacterCard';
import { CATEGORIES } from '../data/presetCharacters';
import { Plus, Sparkles, Wand2, MessageCircle, Mic, Image, ShieldCheck } from 'lucide-react';

interface HomeViewProps {
  characters: Character[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  onSelectCharacter: (character: Character) => void;
  onCreateCharacter: () => void;
  onDeleteCharacter: (id: string) => void;
  onSpeakGreeting: (character: Character) => void;
  speakingMessageId: string | null;
  searchQuery: string;
}

export const HomeView: React.FC<HomeViewProps> = ({
  characters,
  selectedCategory,
  onSelectCategory,
  onSelectCharacter,
  onCreateCharacter,
  onDeleteCharacter,
  onSpeakGreeting,
  speakingMessageId,
  searchQuery,
}) => {
  // Filter characters by search query and category
  const filteredCharacters = characters.filter((c) => {
    const matchesCategory =
      selectedCategory === 'All'
        ? true
        : selectedCategory === 'Custom'
        ? c.isCustom
        : c.category === selectedCategory;

    const matchesSearch =
      !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.category.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#12222b] via-[#0d1b22] to-[#0b141a] border border-emerald-500/20 p-6 sm:p-8 shadow-2xl">
        {/* Ambient glow */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Free AI Character Chat & Roleplay</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Talk with unforgettable personas or <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">craft your own</span>.
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              WhatsApp-style messaging with intelligent characters powered by Gemini 2.5 Flash. Experience live voice replies, microphone input, scene image generation, and full localStorage memory.
            </p>

            {/* Feature Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-300">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <Mic className="w-3.5 h-3.5 text-emerald-400" />
                Voice Read-Aloud & Mic
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <Image className="w-3.5 h-3.5 text-teal-400" />
                AI Scene Generator
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                No Login Required
              </span>
            </div>
          </div>

          <button
            onClick={onCreateCharacter}
            className="group flex-shrink-0 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-xl shadow-emerald-950/40 hover:shadow-emerald-500/25 transition-all transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center group-hover:rotate-90 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <div className="text-left">
              <div className="text-xs text-emerald-200">Got an idea?</div>
              <div className="font-bold">Create Custom Character</div>
            </div>
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
            Browse Categories
          </h2>
          <span className="text-xs text-slate-500">
            {filteredCharacters.length} {filteredCharacters.length === 1 ? 'character' : 'characters'}
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => onSelectCategory(cat.value)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-semibold shadow-md shadow-emerald-950/40'
                    : 'bg-[#111b21] hover:bg-[#1a2730] text-slate-300 border border-slate-800/80'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Characters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
        {/* Quick Create Card */}
        <div
          onClick={onCreateCharacter}
          className="border-2 border-dashed border-slate-800 hover:border-emerald-500/60 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer group bg-[#111b21]/40 hover:bg-[#111b21] transition-all duration-300 min-h-[220px]"
        >
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3 group-hover:scale-110 transition-transform">
            <Wand2 className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-white group-hover:text-emerald-300 transition-colors">
            Create New Persona
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-[200px]">
            Design an anime hero, therapist, mentor, or funny sidekick in seconds.
          </p>
          <span className="mt-4 text-xs font-semibold text-emerald-400 flex items-center gap-1 group-hover:underline">
            Get Started &rarr;
          </span>
        </div>

        {/* Character Cards */}
        {filteredCharacters.map((char) => (
          <CharacterCard
            key={char.id}
            character={char}
            onSelect={onSelectCharacter}
            onDelete={onDeleteCharacter}
            onSpeakGreeting={onSpeakGreeting}
            isSpeakingThis={speakingMessageId === 'card-' + char.id}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredCharacters.length === 0 && (
        <div className="text-center py-12 px-4 rounded-2xl bg-[#111b21] border border-slate-800">
          <div className="w-12 h-12 mx-auto rounded-full bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
            <MessageCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-white text-base">No characters found</h3>
          <p className="text-xs text-slate-400 mt-1">
            No characters match "{searchQuery}" in this category.
          </p>
          <button
            onClick={() => {
              onSelectCategory('All');
            }}
            className="mt-4 px-4 py-1.5 rounded-lg text-xs font-medium bg-emerald-600 text-white hover:bg-emerald-500 cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      )}
    </div>
  );
};
