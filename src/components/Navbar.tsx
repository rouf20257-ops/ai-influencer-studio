import React from 'react';
import { Sparkles, Plus, Search, Compass, Film, MessageSquare, Users } from 'lucide-react';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onCreateClick: () => void;
  onHomeClick: () => void;
  onVideoStudioClick: () => void;
  activeView: 'home' | 'chat' | 'video';
  customCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  searchQuery,
  onSearchChange,
  onCreateClick,
  onHomeClick,
  onVideoStudioClick,
  activeView,
  customCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#111b21]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-4 py-2.5 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <div 
          onClick={onHomeClick}
          className="flex items-center gap-2.5 cursor-pointer group select-none flex-shrink-0"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base sm:text-lg text-white tracking-tight">Persona<span className="text-emerald-400">AI</span></span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hidden sm:inline">Free</span>
            </div>
            <span className="text-[11px] text-slate-400 -mt-1 hidden md:inline">Characters & Video Studio</span>
          </div>
        </div>

        {/* View Switcher Navigation Tabs */}
        <div className="flex items-center gap-1 bg-[#202c33]/80 p-1 rounded-2xl border border-slate-700/60 flex-shrink-0">
          <button
            onClick={onHomeClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              activeView === 'home' || activeView === 'chat'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Characters</span>
          </button>

          <button
            onClick={onVideoStudioClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer relative ${
              activeView === 'video'
                ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/40'
            }`}
          >
            <Film className="w-4 h-4 text-teal-400" />
            <span>Video Studio</span>
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse ml-0.5" />
          </button>
        </div>

        {/* Search Bar (visible on Home view desktop) */}
        {activeView === 'home' && (
          <div className="hidden lg:block flex-1 max-w-xs mx-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search personas..."
              className="w-full bg-[#202c33] border border-slate-700/60 rounded-full pl-9 pr-4 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onCreateClick}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-950/40 hover:shadow-emerald-600/30 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.5]" />
            <span className="hidden sm:inline">New Persona</span>
            <span className="sm:hidden">Create</span>
          </button>
        </div>
      </div>
    </header>
  );
};
