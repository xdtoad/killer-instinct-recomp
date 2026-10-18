/**
 * Killer Instinct (USA) (Rev 1) - Windows 10/11 Recompilation Suite
 * Main Application
 */

import React, { useState, useMemo } from 'react';
import { HeaderBar, ActiveAppView } from './components/HeaderBar';
import { SnesRecompPlayer } from './components/SnesRecompPlayer';
import { StaticRecompilerStudio } from './components/StaticRecompilerStudio';
import { RomInspector } from './components/RomInspector';
import { FighterSelect } from './components/FighterSelect';
import { CombatArena } from './components/CombatArena';
import { MoveListModal } from './components/MoveListModal';
import { WindowsSettingsModal } from './components/WindowsSettingsModal';
import { CombatEngine } from './engine/combatEngine';
import { soundEngine } from './audio/soundEngine';
import { FighterId, GameMode, StageId } from './types/game';
import { MonitorCheck, Gamepad2, Terminal, Cpu, PlayCircle } from 'lucide-react';

export default function App() {
  // Default directly to the Recomp Player where user runs the original ROM!
  const [currentView, setCurrentView] = useState<ActiveAppView>('recomp_player');
  const [p1Id, setP1Id] = useState<FighterId>('jago');
  const [p2Id, setP2Id] = useState<FighterId>('fulgore');
  const [stageId, setStageId] = useState<StageId>('shrine');
  const [gameMode, setGameMode] = useState<GameMode>('arcade');

  // Modals & Display Options
  const [isMoveListOpen, setIsMoveListOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [crtFilter, setCrtFilter] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<'4:3' | '16:9'>('4:3');
  const [cpuDifficulty, setCpuDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium');
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getIsMuted());

  // CombatEngine instance
  const engine = useMemo(() => {
    return new CombatEngine(p1Id, p2Id, gameMode !== 'versus', cpuDifficulty);
  }, []);

  const handleStartFight = (selectedP1: FighterId, selectedP2: FighterId, selectedStage: StageId, mode: GameMode) => {
    setP1Id(selectedP1);
    setP2Id(selectedP2);
    setStageId(selectedStage);
    setGameMode(mode);

    engine.isCpuOpponent = mode !== 'versus';
    engine.cpuDifficulty = cpuDifficulty;
    engine.resetMatch(selectedP1, selectedP2);

    setCurrentView('arcade_engine');
  };

  const handleToggleMute = () => {
    const next = soundEngine.toggleMute();
    setIsMuted(next);
  };

  return (
    <div className="min-h-screen bg-[#06070a] text-neutral-100 flex flex-col justify-between selection:bg-amber-500 selection:text-black">
      {/* Top Header Navigation */}
      <HeaderBar
        currentView={currentView}
        onChangeView={setCurrentView}
        onOpenMoves={() => setIsMoveListOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 flex flex-col justify-center">
        {/* 1. SNES Recomp Player (Runs the actual Killer Instinct (USA) (Rev 1).sfc file) */}
        {currentView === 'recomp_player' && (
          <SnesRecompPlayer
            crtFilter={crtFilter}
            onToggleCrt={() => setCrtFilter(!crtFilter)}
          />
        )}

        {/* 2. Static Recompiler Studio (Generates C source code project for Windows 10/11) */}
        {currentView === 'recomp_studio' && (
          <StaticRecompilerStudio />
        )}

        {/* 3. ROM Binary & REA Lab */}
        {currentView === 're_lab' && (
          <RomInspector />
        )}

        {/* 4. Fighter Select */}
        {currentView === 'fighter_select' && (
          <FighterSelect
            onStartFight={handleStartFight}
            initialP1={p1Id}
            initialP2={p2Id}
            initialStage={stageId}
          />
        )}

        {/* 5. Arcade Engine Mode */}
        {currentView === 'arcade_engine' && (
          <CombatArena
            engine={engine}
            stageId={stageId}
            crtFilter={crtFilter}
            aspectRatio={aspectRatio}
            gameMode={gameMode}
            onSelectFighters={() => setCurrentView('fighter_select')}
            onOpenMoves={() => setIsMoveListOpen(true)}
          />
        )}
      </main>

      {/* Footer Compatibility Information */}
      <footer className="w-full bg-neutral-950/90 border-t border-neutral-800 py-3 px-4 text-xs text-neutral-400">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <MonitorCheck className="w-4 h-4 text-emerald-400" />
            <span className="font-mono">
              Killer Instinct (USA) (Rev 1) &middot; Windows 10/11 Static Recompilation Architecture
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setCurrentView('recomp_player')}
              className={`flex items-center gap-1 transition ${
                currentView === 'recomp_player' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <PlayCircle className="w-3.5 h-3.5" />
              Executar ROM
            </button>
            <span className="text-neutral-700">&bull;</span>
            <button
              onClick={() => setCurrentView('recomp_studio')}
              className={`flex items-center gap-1 transition ${
                currentView === 'recomp_studio' ? 'text-amber-400 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-amber-400" />
              Fonte C (Win 10/11)
            </button>
            <span className="text-neutral-700">&bull;</span>
            <button
              onClick={() => setCurrentView('re_lab')}
              className={`flex items-center gap-1 transition ${
                currentView === 're_lab' ? 'text-sky-400 font-bold' : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              morluto/rea Bridge
            </button>
            <span className="text-neutral-700">&bull;</span>
            <span className="flex items-center gap-1 text-neutral-400">
              <Gamepad2 className="w-3.5 h-3.5 text-emerald-400" />
              XInput
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <MoveListModal
        isOpen={isMoveListOpen}
        onClose={() => setIsMoveListOpen(false)}
        defaultFighter={p1Id}
      />

      <WindowsSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        crtFilter={crtFilter}
        onToggleCrt={() => setCrtFilter(!crtFilter)}
        aspectRatio={aspectRatio}
        onChangeAspectRatio={setAspectRatio}
        cpuDifficulty={cpuDifficulty}
        onChangeDifficulty={(diff) => {
          setCpuDifficulty(diff);
          engine.cpuDifficulty = diff;
        }}
      />
    </div>
  );
}
