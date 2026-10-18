/**
 * Killer Instinct Move List & Combo Guide Modal
 * Displays complete frame data, commands, Openers, Linkers, Enders, and Ultra Combos
 */

import React, { useState } from 'react';
import { FIGHTERS } from '../constants/fighters';
import { FighterId, MoveRole } from '../types/game';
import { X, Flame, ShieldAlert, Sparkles, BookOpen } from 'lucide-react';

interface MoveListModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultFighter?: FighterId;
}

export const MoveListModal: React.FC<MoveListModalProps> = ({
  isOpen,
  onClose,
  defaultFighter = 'jago'
}) => {
  const [selectedId, setSelectedId] = useState<FighterId>(defaultFighter);

  if (!isOpen) return null;

  const fighter = FIGHTERS[selectedId];
  const fighterKeys = Object.keys(FIGHTERS) as FighterId[];

  const getRoleBadge = (role: MoveRole) => {
    switch (role) {
      case 'opener':
        return <span className="bg-sky-500/20 text-sky-400 border border-sky-500/40 px-2 py-0.5 rounded text-[10px] font-bold">OPENER</span>;
      case 'autodouble':
        return <span className="bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded text-[10px] font-bold">AUTO-DOUBLE</span>;
      case 'linker':
        return <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded text-[10px] font-bold">LINKER</span>;
      case 'ender':
        return <span className="bg-rose-500/20 text-rose-400 border border-rose-500/40 px-2 py-0.5 rounded text-[10px] font-bold">ENDER</span>;
      case 'ultra':
        return <span className="bg-gradient-to-r from-red-600 to-amber-500 text-white font-black px-2.5 py-0.5 rounded text-[10px] shadow-sm animate-pulse">ULTRA COMBO</span>;
      default:
        return <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded text-[10px]">NORMAL</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800 bg-neutral-900/50">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h2 className="font-ki text-xl text-white font-bold tracking-wide">
              FIGHTER COMMAND LIST & COMBO MECHANICS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Character Tabs */}
        <div className="flex overflow-x-auto gap-2 p-3 bg-neutral-900 border-b border-neutral-800 scrollbar-none">
          {fighterKeys.map((key) => {
            const f = FIGHTERS[key];
            const isActive = selectedId === key;
            return (
              <button
                key={key}
                onClick={() => setSelectedId(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition border ${
                  isActive
                    ? 'bg-amber-500 text-black border-amber-400 shadow-md font-black'
                    : 'bg-neutral-950 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white'
                }`}
              >
                {f.name}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Fighter Overview Banner */}
          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-neutral-900/60 border border-neutral-800">
            <div
              className="w-16 h-16 rounded-xl flex items-center justify-center text-2xl font-black border"
              style={{
                backgroundColor: `${fighter.themeColor}22`,
                borderColor: fighter.themeColor,
                color: fighter.themeColor
              }}
            >
              {fighter.name.substring(0, 2)}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-ki text-2xl text-white font-bold">{fighter.name}</h3>
              <p className="text-xs text-amber-400 font-semibold">{fighter.alias} &middot; {fighter.fightingStyle}</p>
              <p className="text-xs text-neutral-400 mt-1">{fighter.lore}</p>
            </div>
          </div>

          {/* KI Combo System Rules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-sky-950/20 border border-sky-800/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 mb-1">
                <Sparkles className="w-3.5 h-3.5" />
                1. OPENERS & AUTO-DOUBLES
              </div>
              <p className="text-[11px] text-neutral-300">
                Hit with an <strong>Opener</strong> special move, then immediately press a normal Punch or Kick to trigger a rapid 2-hit Auto-Double!
              </p>
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                <Flame className="w-3.5 h-3.5" />
                2. LINKERS & ENDERS
              </div>
              <p className="text-[11px] text-neutral-300">
                Extend with a <strong>Linker</strong> for more Auto-Doubles, then finish with an <strong>Ender</strong> to cash out huge damage!
              </p>
            </div>

            <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-800/40">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                3. COMBO BREAKER!
              </div>
              <p className="text-[11px] text-neutral-300">
                Being comboed? Press <strong>Space / Gamepad Trigger</strong> during opponent Auto-Double to shatter their combo with a shockwave!
              </p>
            </div>
          </div>

          {/* Move Table */}
          <div className="space-y-3">
            <h4 className="font-ki text-sm text-neutral-200 tracking-wider">
              {fighter.name} COMBAT MATRIX
            </h4>

            <div className="grid grid-cols-1 gap-2.5">
              {fighter.moves.map((move) => (
                <div
                  key={move.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-neutral-900/40 border border-neutral-800/80 hover:border-neutral-700 transition"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{move.name}</span>
                      {getRoleBadge(move.role)}
                    </div>
                    {move.description && (
                      <p className="text-[11px] text-neutral-400 mt-1">{move.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-amber-300 bg-neutral-950 px-2.5 py-1 rounded border border-neutral-800 block">
                        {move.command}
                      </span>
                    </div>

                    <div className="text-right text-[11px] font-mono text-neutral-400 min-w-[70px]">
                      <div>{move.hits} Hit{move.hits > 1 ? 's' : ''}</div>
                      <div className="text-rose-400 font-bold">{move.damage} Dmg</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ultra Combo Note */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-red-950/40 via-amber-950/20 to-neutral-950 border border-red-800/50">
            <h4 className="font-ki text-sm text-red-400 font-bold flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500 fill-current" />
              HOW TO UNLEASH AN ULTRA COMBO
            </h4>
            <p className="text-xs text-neutral-300 mt-1">
              When your opponent's second life bar is in the flashing <strong>RED (DANGER)</strong> zone (below 30% HP), execute an Opener into your Ultra finisher command! The game will automatically unleash a 28 to 34-hit cinematic destruction sequence accompanied by the iconic KI announcer.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-semibold text-xs transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
