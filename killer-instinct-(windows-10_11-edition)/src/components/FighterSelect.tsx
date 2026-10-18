/**
 * Killer Instinct Fighter Select Screen
 * Features:
 * - Iconic character selection grid with golden spiked frames
 * - Announcer callouts when choosing fighters
 * - Character stats, fighting styles, lore & stage selector
 * - 1P vs CPU, 2P Local Versus, and Practice Lab selection
 */

import React, { useState } from 'react';
import { FIGHTERS, STAGES } from '../constants/fighters';
import { FighterId, GameMode, StageId } from '../types/game';
import { soundEngine } from '../audio/soundEngine';
import { Swords, Bot, User, Flame, Zap, Shield, Play } from 'lucide-react';

interface FighterSelectProps {
  onStartFight: (p1: FighterId, p2: FighterId, stage: StageId, mode: GameMode) => void;
  initialP1?: FighterId;
  initialP2?: FighterId;
  initialStage?: StageId;
}

export const FighterSelect: React.FC<FighterSelectProps> = ({
  onStartFight,
  initialP1 = 'jago',
  initialP2 = 'fulgore',
  initialStage = 'shrine'
}) => {
  const [selectedP1, setSelectedP1] = useState<FighterId>(initialP1);
  const [selectedP2, setSelectedP2] = useState<FighterId>(initialP2);
  const [selectedStage, setSelectedStage] = useState<StageId>(initialStage);
  const [gameMode, setGameMode] = useState<GameMode>('arcade');
  const [selectingFor, setSelectingFor] = useState<'p1' | 'p2'>('p1');

  const fighterKeys = Object.keys(FIGHTERS) as FighterId[];
  const stageKeys = Object.keys(STAGES) as StageId[];

  const p1Data = FIGHTERS[selectedP1];
  const p2Data = FIGHTERS[selectedP2];

  const handleSelectFighter = (id: FighterId) => {
    soundEngine.playMoveSfx('punch_med');
    soundEngine.playAnnouncer(FIGHTERS[id].name);

    if (selectingFor === 'p1') {
      setSelectedP1(id);
      if (gameMode === 'versus') {
        setSelectingFor('p2');
      }
    } else {
      setSelectedP2(id);
    }
  };

  const handleStart = () => {
    soundEngine.playAnnouncer('FIGHT ON!');
    onStartFight(selectedP1, selectedP2, selectedStage, gameMode);
  };

  return (
    <div className="relative min-h-[620px] w-full max-w-5xl mx-auto rounded-2xl bg-gradient-to-b from-neutral-950 via-neutral-900 to-black p-6 border border-neutral-800 shadow-2xl flex flex-col justify-between">
      {/* Top Banner & Mode Toggle */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h1 className="font-ki text-3xl md:text-4xl text-amber-400 arcade-glow tracking-wider">
            KILLER INSTINCT
          </h1>
          <p className="text-xs uppercase tracking-widest text-neutral-400">
            Windows 10/11 Arcade Port &middot; Select Your Warriors
          </p>
        </div>

        {/* Game Mode Selector */}
        <div className="flex items-center gap-2 bg-neutral-950 p-1.5 rounded-lg border border-neutral-800">
          <button
            onClick={() => { setGameMode('arcade'); setSelectingFor('p1'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
              gameMode === 'arcade'
                ? 'bg-amber-500 text-black shadow-lg font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            1P vs CPU
          </button>
          <button
            onClick={() => setGameMode('versus')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
              gameMode === 'versus'
                ? 'bg-amber-500 text-black shadow-lg font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            2P Versus
          </button>
          <button
            onClick={() => { setGameMode('practice'); setSelectingFor('p1'); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition ${
              gameMode === 'practice'
                ? 'bg-amber-500 text-black shadow-lg font-bold'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Practice Lab
          </button>
        </div>
      </div>

      {/* Main Selection Area: P1 Preview, Grid, P2 Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 my-6 items-center">
        {/* P1 Card */}
        <div className="lg:col-span-3 bg-neutral-950/80 rounded-xl p-4 border-2 border-sky-500/60 shadow-lg shadow-sky-500/10 flex flex-col items-center text-center">
          <span className="text-xs font-mono font-bold text-sky-400 tracking-wider mb-2">
            PLAYER 1 (YOU)
          </span>
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black mb-3 border-2"
            style={{ backgroundColor: `${p1Data.themeColor}22`, borderColor: p1Data.themeColor, color: p1Data.themeColor }}
          >
            {p1Data.name.charAt(0)}
          </div>
          <h3 className="font-ki text-xl text-white font-bold">{p1Data.name}</h3>
          <p className="text-xs text-sky-400 mb-3">{p1Data.alias}</p>

          <div className="w-full text-left space-y-1.5 text-xs text-neutral-400 border-t border-neutral-800 pt-3">
            <div className="flex justify-between">
              <span>Origin:</span>
              <span className="text-white font-medium">{p1Data.origin}</span>
            </div>
            <div className="flex justify-between">
              <span>Speed:</span>
              <span className="text-amber-400 font-bold">{p1Data.speed}x</span>
            </div>
            <div className="flex justify-between">
              <span>Weight:</span>
              <span className="text-white">{p1Data.weight}</span>
            </div>
            <div className="flex justify-between">
              <span>Difficulty:</span>
              <span className="text-emerald-400 font-semibold">{p1Data.difficulty}</span>
            </div>
          </div>
        </div>

        {/* Center: Character Grid */}
        <div className="lg:col-span-6 flex flex-col items-center">
          <div className="flex items-center gap-3 mb-3 text-xs">
            <button
              onClick={() => setSelectingFor('p1')}
              className={`px-3 py-1 rounded-full font-bold transition ${
                selectingFor === 'p1' ? 'bg-sky-500 text-black' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              Choosing for: P1
            </button>
            {gameMode === 'versus' && (
              <button
                onClick={() => setSelectingFor('p2')}
                className={`px-3 py-1 rounded-full font-bold transition ${
                  selectingFor === 'p2' ? 'bg-rose-500 text-black' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                Choosing for: P2
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-3 w-full">
            {fighterKeys.map((key) => {
              const f = FIGHTERS[key];
              const isP1 = selectedP1 === key;
              const isP2 = selectedP2 === key;

              return (
                <button
                  key={key}
                  onClick={() => handleSelectFighter(key)}
                  className={`relative group aspect-square rounded-xl p-2 flex flex-col items-center justify-between border-2 transition-all transform hover:scale-105 active:scale-95 ${
                    isP1
                      ? 'border-sky-400 bg-sky-950/40 shadow-lg shadow-sky-500/30'
                      : isP2
                      ? 'border-rose-500 bg-rose-950/40 shadow-lg shadow-rose-500/30'
                      : 'border-neutral-800 bg-neutral-900/60 hover:border-neutral-600'
                  }`}
                >
                  {/* Badges */}
                  <div className="w-full flex justify-between items-center text-[10px] font-mono">
                    {isP1 && <span className="bg-sky-500 text-black px-1.5 py-0.5 rounded font-black">1P</span>}
                    {isP2 && <span className="bg-rose-500 text-black px-1.5 py-0.5 rounded font-black ml-auto">2P</span>}
                  </div>

                  {/* Character Monogram / Icon */}
                  <div
                    className="w-12 h-12 rounded-lg flex items-center justify-center font-black text-xl border"
                    style={{
                      backgroundColor: `${f.themeColor}18`,
                      borderColor: f.themeColor,
                      color: f.themeColor
                    }}
                  >
                    {f.name.substring(0, 2)}
                  </div>

                  <span className="font-ki text-[11px] text-white tracking-wide truncate max-w-full">
                    {f.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Stage Selector */}
          <div className="w-full mt-6 bg-neutral-950 p-3 rounded-xl border border-neutral-800">
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 block mb-2 text-center">
              Combat Arena: {STAGES[selectedStage]?.name}
            </span>
            <div className="flex gap-2 overflow-x-auto pb-1 justify-center">
              {stageKeys.map((sKey) => {
                const s = STAGES[sKey];
                const active = selectedStage === sKey;
                return (
                  <button
                    key={sKey}
                    onClick={() => {
                      soundEngine.playMoveSfx('punch_light');
                      setSelectedStage(sKey);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition border ${
                      active
                        ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                        : 'border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {s.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* P2 / CPU Card */}
        <div className="lg:col-span-3 bg-neutral-950/80 rounded-xl p-4 border-2 border-rose-500/60 shadow-lg shadow-rose-500/10 flex flex-col items-center text-center">
          <span className="text-xs font-mono font-bold text-rose-400 tracking-wider mb-2">
            {gameMode === 'arcade' ? 'CPU OPPONENT' : (gameMode === 'practice' ? 'TRAINING DUMMY' : 'PLAYER 2')}
          </span>
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-black mb-3 border-2"
            style={{ backgroundColor: `${p2Data.themeColor}22`, borderColor: p2Data.themeColor, color: p2Data.themeColor }}
          >
            {p2Data.name.charAt(0)}
          </div>
          <h3 className="font-ki text-xl text-white font-bold">{p2Data.name}</h3>
          <p className="text-xs text-rose-400 mb-3">{p2Data.alias}</p>

          <div className="w-full text-left space-y-1.5 text-xs text-neutral-400 border-t border-neutral-800 pt-3">
            <div className="flex justify-between">
              <span>Origin:</span>
              <span className="text-white font-medium">{p2Data.origin}</span>
            </div>
            <div className="flex justify-between">
              <span>Speed:</span>
              <span className="text-amber-400 font-bold">{p2Data.speed}x</span>
            </div>
            <div className="flex justify-between">
              <span>Weight:</span>
              <span className="text-white">{p2Data.weight}</span>
            </div>
            <div className="flex justify-between">
              <span>Difficulty:</span>
              <span className="text-rose-400 font-semibold">{p2Data.difficulty}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Start Fight CTA */}
      <div className="border-t border-neutral-800 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-neutral-400 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Double Lifebar System Active &middot; Full Combo Breakers & Ultras Enabled</span>
        </div>

        <button
          onClick={handleStart}
          className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-black font-ki font-black text-lg tracking-wider shadow-xl shadow-orange-500/25 hover:brightness-110 active:scale-95 transition cursor-pointer"
        >
          <Play className="w-5 h-5 fill-current" />
          FIGHT ON!
        </button>
      </div>
    </div>
  );
};
