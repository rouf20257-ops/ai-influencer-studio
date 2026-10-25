import React from 'react';
import { Character } from '../types/character';
import { X, Trash2, Sparkles, BookOpen, User, Volume2 } from 'lucide-react';

interface CharacterProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onClearChat: () => void;
}

export const CharacterProfileModal: React.FC<CharacterProfileModalProps> = ({
  isOpen,
  onClose,
  character,
  onClearChat,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="relative w-full max-w-lg bg-[#111b21] border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden">
        {/* Banner with Avatar */}
        <div className="relative bg-gradient-to-r from-emerald-900/50 via-slate-900 to-teal-900/50 px-6 pt-6 pb-4 border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-400 shadow-xl bg-slate-800 flex-shrink-0">
              <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-1">
                {character.category}
              </div>
              <h2 className="text-xl font-bold text-white">{character.name}</h2>
              <p className="text-xs text-emerald-400 font-medium">{character.tagline}</p>
            </div>
          </div>
        </div>

        {/* Content details */}
        <div className="p-6 space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Lore / Description */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400 mb-1">
              <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
              <span>Background & Lore</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#202c33]/40 p-3 rounded-xl border border-slate-800">
              {character.description}
            </p>
          </div>

          {/* Personality Traits */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Persona & System Directive</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#202c33]/40 p-3 rounded-xl border border-slate-800">
              {character.personality}
            </p>
          </div>

          {/* Scenario */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400 mb-1">
              <User className="w-3.5 h-3.5 text-emerald-400" />
              <span>Active Scenario Context</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-[#202c33]/40 p-3 rounded-xl border border-slate-800">
              {character.scenario || 'Casual conversation in personal quarters.'}
            </p>
          </div>

          {/* Danger zone / clear history */}
          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Clear conversation history with {character.name}?
            </div>
            <button
              onClick={() => {
                if (confirm(`Reset conversation history with ${character.name}?`)) {
                  onClearChat();
                  onClose();
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-medium transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Chat</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
