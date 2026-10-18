/**
 * Killer Instinct Arcade & Recomp Header Bar
 */

import React from 'react';
import { Swords, BookOpen, Binary, Sliders, Volume2, VolumeX, Maximize2, Users, Cpu, PlayCircle } from 'lucide-react';

export type ActiveAppView = 'recomp_player' | 'recomp_studio' | 're_lab' | 'arcade_engine' | 'fighter_select';

interface HeaderBarProps {
  currentView: ActiveAppView;
  onChangeView: (view: ActiveAppView) => void;
  onOpenMoves: () => void;
  onOpenSettings: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  currentView,
  onChangeView,
  onOpenMoves,
  onOpenSettings,
  isMuted,
  onToggleMute
}) => {
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  return (
    <header className="w-full bg-neutral-950/95 border-b border-neutral-800 backdrop-blur-md sticky top-0 z-40 px-4 py-2.5">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onChangeView('recomp_player')}>
            <span className="font-ki text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-600 font-black tracking-wider arcade-glow">
              KILLER INSTINCT
            </span>
            <span className="text-[10px] font-mono uppercase bg-red-950/80 border border-red-600/60 text-red-300 px-2 py-0.5 rounded font-black tracking-wider">
              RECOMP WIN 10/11
            </span>
          </div>

          <span className="hidden sm:inline-block text-neutral-600">|</span>
          <span className="hidden sm:inline-block text-xs font-mono text-neutral-400">
            {currentView === 'recomp_player' && 'SNES NATIVE ROM RECOMP RUNNER'}
            {currentView === 'recomp_studio' && 'STATIC RECOMPILER C/C++ SOURCE'}
            {currentView === 're_lab' && 'ROM & REA DISASSEMBLY LAB'}
            {currentView === 'arcade_engine' && 'ARCADE ENGINE COMBO LAB'}
            {currentView === 'fighter_select' && 'ROSTER SELECT'}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap justify-center text-xs font-bold">
          <button
            onClick={() => onChangeView('recomp_player')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition border ${
              currentView === 'recomp_player'
                ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black'
                : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            Executar Jogo (ROM Recomp)
          </button>

          <button
            onClick={() => onChangeView('recomp_studio')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition border ${
              currentView === 'recomp_studio'
                ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black'
                : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-amber-400" />
            Recompiler C (Windows 10/11)
          </button>

          <button
            onClick={() => onChangeView('re_lab')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition border ${
              currentView === 're_lab'
                ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black'
                : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
            }`}
          >
            <Binary className="w-3.5 h-3.5 text-sky-400" />
            ROM & REA Lab
          </button>

          <button
            onClick={() => onChangeView('arcade_engine')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition border ${
              currentView === 'arcade_engine' || currentView === 'fighter_select'
                ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black'
                : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5 text-orange-400" />
            Motor Arcade
          </button>

          <button
            onClick={onOpenMoves}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            Golpes
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white transition"
            title="Windows 10/11 Settings"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            Controles
          </button>

          <button
            onClick={onToggleMute}
            className="p-1.5 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white transition"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-neutral-900 text-neutral-300 border border-neutral-800 hover:border-neutral-700 hover:text-white transition"
            title="Toggle Fullscreen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
