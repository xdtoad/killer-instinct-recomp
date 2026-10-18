/**
 * Killer Instinct (Windows 10/11 Edition)
 * Game Types & Architecture Definitions
 */

export type FighterId = 
  | 'jago'
  | 'fulgore'
  | 'glacius'
  | 'orchid'
  | 'sabrewulf'
  | 'cinder'
  | 'spinal'
  | 'tjcombo';

export type AttackType = 
  | 'QP' // Quick Punch
  | 'MP' // Medium Punch
  | 'FP' // Fierce Punch
  | 'QK' // Quick Kick
  | 'MK' // Medium Kick
  | 'FK'; // Fierce Kick

export type MoveRole = 
  | 'normal'
  | 'opener'
  | 'autodouble'
  | 'linker'
  | 'ender'
  | 'breaker'
  | 'ultra'
  | 'nomercy';

export interface MoveDefinition {
  id: string;
  name: string;
  command: string; // e.g. "QCF + P", "B, F + K", "F, D, DF + P"
  role: MoveRole;
  damage: number;
  hits: number;
  startupFrames: number;
  activeFrames: number;
  recoveryFrames: number;
  rangeX: number;
  rangeY: number;
  knockback: number;
  knockdown: boolean;
  canComboInto?: MoveRole[];
  soundFx: string;
  description?: string;
}

export interface FighterData {
  id: FighterId;
  name: string;
  alias: string;
  origin: string;
  fightingStyle: string;
  stageName: string;
  themeColor: string;
  accentColor: string;
  portrait: string; // SVG or data representation
  height: number;
  speed: number;
  weight: string;
  moves: MoveDefinition[];
  ultraComboSequence: string[];
  lore: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export type FighterActionState =
  | 'idle'
  | 'walk_fwd'
  | 'walk_back'
  | 'crouch'
  | 'jump_up'
  | 'jump_fwd'
  | 'jump_back'
  | 'block'
  | 'crouch_block'
  | 'attack'
  | 'hit_light'
  | 'hit_heavy'
  | 'knockdown'
  | 'getup'
  | 'dizzy'
  | 'win'
  | 'lose';

export interface ActiveFighter {
  playerIndex: 1 | 2;
  id: FighterId;
  data: FighterData;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: 1 | -1; // 1 = right, -1 = left
  actionState: FighterActionState;
  currentMove: MoveDefinition | null;
  moveFrame: number;
  stateTimer: number;
  
  // Killer Instinct Double Health Bar System:
  // Green bar (100) -> transitions to Red bar (100)
  currentBar: 1 | 2; // 1 = Green, 2 = Red (Danger bar)
  health: number; // 0 to 100 on current bar
  
  // Combo mechanics
  comboHits: number;
  comboDamage: number;
  lastMoveRole: MoveRole | null;
  comboBreakerWindow: boolean;
  isInUltra: boolean;
  ultraHitsRemaining: number;
  
  // Guard & Stun
  isBlocking: boolean;
  isGrounded: boolean;
  hasWon: boolean;
  hasLost: boolean;
}

export type StageId = 
  | 'shrine'
  | 'factory'
  | 'glacier'
  | 'rooftop'
  | 'castle'
  | 'lava';

export interface StageData {
  id: StageId;
  name: string;
  character: FighterId;
  skyGradient: [string, string];
  bgElements: string;
  floorColor: string;
  ambientLight: string;
  musicBpm: number;
  synthStyle: 'rock' | 'industrial' | 'techno' | 'darkwave';
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  qp: boolean; // Quick Punch
  mp: boolean; // Medium Punch
  fp: boolean; // Fierce Punch
  qk: boolean; // Quick Kick
  mk: boolean; // Medium Kick
  fk: boolean; // Fierce Kick
  breaker: boolean; // Macro or counter
}

export interface ParticleEffect {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'smoke' | 'blood' | 'laser' | 'ice' | 'fire';
}

export interface ComboNotification {
  hits: number;
  tierName: string;
  playerIndex: 1 | 2;
  timer: number;
  maxTimer: number;
  isBreaker?: boolean;
  isUltra?: boolean;
}

export type GameMode = 'arcade' | 'versus' | 'practice' | 're_suite';

export interface RomHeaderInfo {
  title: string;
  cartridgeType: string;
  romSize: string;
  ramSize: string;
  country: string;
  developer: string;
  version: string;
  checksum: string;
  checksumComplement: string;
  resetVector: string;
  nmiVector: string;
  irqVector: string;
}
