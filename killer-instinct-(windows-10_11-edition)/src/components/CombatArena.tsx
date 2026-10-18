/**
 * Killer Instinct Combat Arena Screen
 * Connects ArcadeCanvas, game loop, and on-screen controls
 */

import React, { useEffect, useState } from 'react';
import { ArcadeCanvas } from './ArcadeCanvas';
import { CombatEngine } from '../engine/combatEngine';
import { inputManager } from '../engine/inputManager';
import { soundEngine } from '../audio/soundEngine';
import { FighterId, GameMode, StageId } from '../types/game';
import { STAGES } from '../constants/fighters';
import { RotateCcw, Pause, Play, Users, BookOpen, ShieldAlert, Zap, Flame } from 'lucide-react';

interface CombatArenaProps {
  engine: CombatEngine;
  stageId: StageId;
  crtFilter: boolean;
  aspectRatio: '4:3' | '16:9';
  gameMode: GameMode;
  onSelectFighters: () => void;
  onOpenMoves: () => void;
}

export const CombatArena: React.FC<CombatArenaProps> = ({
  engine,
  stageId,
  crtFilter,
  aspectRatio,
  gameMode,
  onSelectFighters,
  onOpenMoves
}) => {
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [p1ComboHits, setP1ComboHits] = useState<number>(0);
  const [p2ComboHits, setP2ComboHits] = useState<number>(0);

  useEffect(() => {
    // Start stage music on arena enter
    const stage = STAGES[stageId] || STAGES.shrine;
    soundEngine.startStageMusic(stage.musicBpm, stage.synthStyle);

    let animId: number;

    const gameLoop = () => {
      if (!isPaused) {
        const p1Input = inputManager.getPlayer1Input();
        const p2Input = inputManager.getPlayer2Input();
        engine.update(p1Input, p2Input);

        setP1ComboHits(engine.p1.comboHits);
        setP2ComboHits(engine.p2.comboHits);
      }
      animId = requestAnimationFrame(gameLoop);
    };

    animId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animId);
      soundEngine.stopStageMusic();
    };
  }, [engine, stageId, isPaused]);

  const handleTogglePause = () => {
    const next = !isPaused;
    setIsPaused(next);
    engine.isPaused = next;
  };

  const handleRematch = () => {
    engine.resetMatch();
    const stage = STAGES[stageId] || STAGES.shrine;
    soundEngine.startStageMusic(stage.musicBpm, stage.synthStyle);
  };

  return (
    <div className="w-full flex flex-col items-center gap-4">
      {/* Canvas Viewport */}
      <ArcadeCanvas
        engine={engine}
        stageId={stageId}
        crtFilter={crtFilter}
        aspectRatio={aspectRatio}
      />

      {/* Control & Stat Console Bar */}
      <div className="w-full max-w-5xl bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* P1 Combo Meter */}
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-sky-400">1P COMBO:</span>
          <span className="font-arcade text-amber-400 text-sm">
            {p1ComboHits > 0 ? `${p1ComboHits} HITS` : 'IDLE'}
          </span>
          {engine.p1.comboBreakerWindow && (
            <span className="bg-amber-500 text-black px-2 py-0.5 rounded text-[10px] font-black animate-bounce">
              BREAKER READY!
            </span>
          )}
        </div>

        {/* Center Quick Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold transition"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            {isPaused ? 'Resume' : 'Pause'}
          </button>

          <button
            onClick={handleRematch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Rematch
          </button>

          <button
            onClick={onSelectFighters}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold transition"
          >
            <Users className="w-3.5 h-3.5" />
            Change Fighter
          </button>

          <button
            onClick={onOpenMoves}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-white font-bold transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            Move List
          </button>
        </div>

        {/* P2 Combo Meter */}
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-rose-400">2P COMBO:</span>
          <span className="font-arcade text-amber-400 text-sm">
            {p2ComboHits > 0 ? `${p2ComboHits} HITS` : 'IDLE'}
          </span>
          {engine.p2.comboBreakerWindow && (
            <span className="bg-amber-500 text-black px-2 py-0.5 rounded text-[10px] font-black animate-bounce">
              BREAKER READY!
            </span>
          )}
        </div>
      </div>

      {/* On-Screen Touch / Mouse Arcade Fight Buttons */}
      <div className="w-full max-w-5xl bg-neutral-950/60 border border-neutral-800/80 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="text-[11px] text-neutral-400 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          <span>Quick Arcade Controls (Click or Press Keys):</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Punches */}
          <button
            onMouseDown={() => { (inputManager as any).p1Keys['KeyU'] = true; }}
            onMouseUp={() => { (inputManager as any).p1Keys['KeyU'] = false; }}
            className="px-2.5 py-1 rounded bg-sky-950 border border-sky-700 hover:bg-sky-900 text-sky-300 font-mono font-bold"
          >
            QP (U)
          </button>
          <button
            onMouseDown={() => { (inputManager as any).p1Keys['KeyI'] = true; }}
            onMouseUp={() => { (inputManager as any).p1Keys['KeyI'] = false; }}
            className="px-2.5 py-1 rounded bg-sky-950 border border-sky-700 hover:bg-sky-900 text-sky-300 font-mono font-bold"
          >
            MP (I)
          </button>
          <button
            onMouseDown={() => { (inputManager as any).p1Keys['KeyO'] = true; }}
            onMouseUp={() => { (inputManager as any).p1Keys['KeyO'] = false; }}
            className="px-2.5 py-1 rounded bg-sky-950 border border-sky-700 hover:bg-sky-900 text-sky-300 font-mono font-bold"
          >
            FP (O)
          </button>

          <span className="text-neutral-600">|</span>

          {/* Kicks */}
          <button
            onMouseDown={() => { (inputManager as any).p1Keys['KeyJ'] = true; }}
            onMouseUp={() => { (inputManager as any).p1Keys['KeyJ'] = false; }}
            className="px-2.5 py-1 rounded bg-orange-950 border border-orange-700 hover:bg-orange-900 text-orange-300 font-mono font-bold"
          >
            QK (J)
          </button>
          <button
            onMouseDown={() => { (inputManager as any).p1Keys['KeyK'] = true; }}
            onMouseUp={() => { (inputManager as any).p1Keys['KeyK'] = false; }}
            className="px-2.5 py-1 rounded bg-orange-950 border border-orange-700 hover:bg-orange-900 text-orange-300 font-mono font-bold"
          >
            MK (K)
          </button>
          <button
            onMouseDown={() => { (inputManager as any).p1Keys['KeyL'] = true; }}
            onMouseUp={() => { (inputManager as any).p1Keys['KeyL'] = false; }}
            className="px-2.5 py-1 rounded bg-orange-950 border border-orange-700 hover:bg-orange-900 text-orange-300 font-mono font-bold"
          >
            FK (L)
          </button>

          <span className="text-neutral-600">|</span>

          {/* Combo Breaker / Ultra Trigger Button */}
          <button
            onMouseDown={() => { (inputManager as any).p1Keys['Space'] = true; }}
            onMouseUp={() => { (inputManager as any).p1Keys['Space'] = false; }}
            className="flex items-center gap-1 px-3 py-1 rounded bg-gradient-to-r from-red-600 to-amber-500 text-black font-black hover:brightness-110 shadow-sm"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            BREAKER / ULTRA (Space)
          </button>
        </div>
      </div>
    </div>
  );
};
