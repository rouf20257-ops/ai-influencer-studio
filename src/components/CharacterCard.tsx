import React, { useState } from 'react';
import { MessageSquare, Volume2, VolumeX, Trash2, Sparkles, UserCheck } from 'lucide-react';
import { Character } from '../types/character';

interface CharacterCardProps {
  character: Character;
  onSelect: (character: Character) => void;
  onDelete?: (id: string) => void;
  onSpeakGreeting?: (character: Character) => void;
  isSpeakingThis?: boolean;
}

const CATEGORY_COLORS: Record<string, string> = {
  Fantasy: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Anime: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Friend: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  Mentor: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Funny: 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20',
  'Sci-Fi': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  Custom: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onSelect,
  onDelete,
  onSpeakGreeting,
  isSpeakingThis = false,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fallbackInitial = character.name.charAt(0).toUpperCase();
  const categoryStyle = CATEGORY_COLORS[character.category] || CATEGORY_COLORS.Custom;

  return (
    <div className="group relative bg-[#111b21] hover:bg-[#162229] border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between shadow-lg shadow-black/20 hover:shadow-emerald-500/5">
      {/* Top section: Avatar & Category */}
      <div>
        <div className="flex items-start justify-between gap-3 mb-3.5">
          {/* Avatar with status indicator */}
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-800 border-2 border-slate-700/80 group-hover:border-emerald-500/60 transition-colors flex items-center justify-center shadow-md">
              {!imageError ? (
                <img
                  src={character.avatar}
                  alt={character.name}
                  loading="lazy"
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageError(true)}
                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                    imageLoaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-emerald-700 to-teal-500 flex items-center justify-center text-white font-bold text-xl">
                  {fallbackInitial}
                </div>
              )}
            </div>
            {/* Active status pulse */}
            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-[#111b21] rounded-full" />
          </div>

          {/* Badges */}
          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${categoryStyle}`}>
              {character.category}
            </span>
            {character.isCustom && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Custom
              </span>
            )}
          </div>
        </div>

        {/* Character Info */}
        <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition-colors line-clamp-1">
          {character.name}
        </h3>
        <p className="text-xs text-emerald-400/90 font-medium mt-0.5 line-clamp-1">
          {character.tagline}
        </p>
        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
          {character.description}
        </p>
      </div>

      {/* Bottom Action Controls */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Voice preview greeting button */}
          {onSpeakGreeting && (
            <button
              onClick={() => onSpeakGreeting(character)}
              title={isSpeakingThis ? 'Stop voice preview' : 'Listen to voice greeting'}
              className={`p-2 rounded-xl transition-all cursor-pointer ${
                isSpeakingThis
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse'
                  : 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 hover:text-white'
              }`}
            >
              {isSpeakingThis ? (
                <VolumeX className="w-4 h-4 text-emerald-400" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
          )}

          {/* Delete button for custom character */}
          {character.isCustom && onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (confirm(`Delete custom character "${character.name}"?`)) {
                  onDelete(character.id);
                }
              }}
              title="Delete character"
              className="p-2 rounded-xl bg-slate-800/60 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Primary Chat CTA button */}
        <button
          onClick={() => onSelect(character)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white font-medium text-xs sm:text-sm shadow-sm transition-all hover:shadow-emerald-500/20 active:scale-98 cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 fill-white/20" />
          <span>Chat Now</span>
        </button>
      </div>
    </div>
  );
};
