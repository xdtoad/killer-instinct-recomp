/**
 * Killer Instinct Core Combat Engine
 * Implements:
 * - Double Health Bar mechanics (Green -> Red / Danger)
 * - Authentic Killer Instinct Combo System (Opener -> Auto-Double -> Linker -> Ender -> Ultra)
 * - Combo Breaker detection ("C-C-C-COMBO BREAKER!")
 * - Ultra Combo cinematic sequence
 * - Hitboxes, Hurtboxes, Collision & Frame Data
 * - Intelligent CPU Opponent AI with multiple difficulty levels
 */

import { FIGHTERS, getComboTier } from '../constants/fighters';
import { ActiveFighter, ComboNotification, FighterId, InputState, MoveDefinition, MoveRole, ParticleEffect } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

export interface Projectile {
  id: string;
  ownerIndex: 1 | 2;
  x: number;
  y: number;
  vx: number;
  damage: number;
  color: string;
  type: string;
  radius: number;
  life: number;
}

export class CombatEngine {
  public p1: ActiveFighter;
  public p2: ActiveFighter;
  public particles: ParticleEffect[] = [];
  public projectiles: Projectile[] = [];
  public notifications: ComboNotification[] = [];
  public cameraShake: number = 0;
  public flashTimer: number = 0;
  public flashColor: string = 'white';
  public matchTimer: number = 99;
  public isMatchOver: boolean = false;
  public winnerText: string | null = null;
  public isPaused: boolean = false;
  public isCpuOpponent: boolean = true;
  public cpuDifficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
  private frameCount: number = 0;

  constructor(p1Id: FighterId = 'jago', p2Id: FighterId = 'fulgore', isCpu: boolean = true, difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium') {
    this.p1 = this.createFighter(1, p1Id, 220);
    this.p2 = this.createFighter(2, p2Id, 580);
    this.isCpuOpponent = isCpu;
    this.cpuDifficulty = difficulty;
  }

  private createFighter(playerIndex: 1 | 2, id: FighterId, startX: number): ActiveFighter {
    const data = FIGHTERS[id] || FIGHTERS.jago;
    return {
      playerIndex,
      id,
      data,
      x: startX,
      y: 380,
      vx: 0,
      vy: 0,
      facing: playerIndex === 1 ? 1 : -1,
      actionState: 'idle',
      currentMove: null,
      moveFrame: 0,
      stateTimer: 0,
      currentBar: 1, // Green bar first
      health: 100,
      comboHits: 0,
      comboDamage: 0,
      lastMoveRole: null,
      comboBreakerWindow: false,
      isInUltra: false,
      ultraHitsRemaining: 0,
      isBlocking: false,
      isGrounded: true,
      hasWon: false,
      hasLost: false
    };
  }

  public resetMatch(p1Id?: FighterId, p2Id?: FighterId) {
    const id1 = p1Id || this.p1.id;
    const id2 = p2Id || this.p2.id;
    this.p1 = this.createFighter(1, id1, 220);
    this.p2 = this.createFighter(2, id2, 580);
    this.particles = [];
    this.projectiles = [];
    this.notifications = [];
    this.cameraShake = 0;
    this.flashTimer = 0;
    this.matchTimer = 99;
    this.isMatchOver = false;
    this.winnerText = null;
    this.frameCount = 0;
    soundEngine.playAnnouncer('FIGHT ON!');
  }

  public update(p1Input: InputState, p2Input: InputState) {
    if (this.isPaused) return;

    this.frameCount++;
    if (this.frameCount % 60 === 0 && this.matchTimer > 0 && !this.isMatchOver) {
      this.matchTimer--;
      if (this.matchTimer === 10) {
        soundEngine.playAnnouncer('TEN SECONDS REMAINING!');
      }
    }

    if (this.cameraShake > 0) {
      this.cameraShake *= 0.88;
      if (this.cameraShake < 0.2) this.cameraShake = 0;
    }
    if (this.flashTimer > 0) this.flashTimer--;

    // Update notifications
    for (let i = this.notifications.length - 1; i >= 0; i--) {
      this.notifications[i].timer--;
      if (this.notifications[i].timer <= 0) {
        this.notifications.splice(i, 1);
      }
    }

    // Determine CPU inputs if active
    let actualP2Input = p2Input;
    if (this.isCpuOpponent && !this.isMatchOver) {
      actualP2Input = this.calculateCpuInput();
    }

    // Face each other
    if (this.p1.actionState !== 'attack' && this.p1.actionState !== 'hit_light' && this.p1.actionState !== 'hit_heavy' && this.p1.actionState !== 'knockdown') {
      this.p1.facing = this.p1.x <= this.p2.x ? 1 : -1;
    }
    if (this.p2.actionState !== 'attack' && this.p2.actionState !== 'hit_light' && this.p2.actionState !== 'hit_heavy' && this.p2.actionState !== 'knockdown') {
      this.p2.facing = this.p2.x <= this.p1.x ? 1 : -1;
    }

    // Process each fighter
    this.updateFighter(this.p1, this.p2, p1Input);
    this.updateFighter(this.p2, this.p1, actualP2Input);

    // Collision push between fighters
    const dist = Math.abs(this.p1.x - this.p2.x);
    const minSpacing = 48;
    if (dist < minSpacing && Math.abs(this.p1.y - this.p2.y) < 60) {
      const overlap = (minSpacing - dist) / 2;
      if (this.p1.x < this.p2.x) {
        this.p1.x = Math.max(60, this.p1.x - overlap);
        this.p2.x = Math.min(740, this.p2.x + overlap);
      } else {
        this.p1.x = Math.min(740, this.p1.x + overlap);
        this.p2.x = Math.max(60, this.p2.x - overlap);
      }
    }

    // Update Projectiles
    this.updateProjectiles();

    // Update Particles
    this.updateParticles();

    // Check round & match end conditions
    this.checkMatchConditions();
  }

  private updateFighter(f: ActiveFighter, opponent: ActiveFighter, input: InputState) {
    if (f.hasLost) {
      f.actionState = 'lose';
      return;
    }
    if (f.hasWon) {
      f.actionState = 'win';
      return;
    }

    // Apply gravity
    if (f.y < 380) {
      f.vy += 0.85;
      f.y += f.vy;
      f.isGrounded = false;
      if (f.y >= 380) {
        f.y = 380;
        f.vy = 0;
        f.isGrounded = true;
        if (f.actionState === 'jump_up' || f.actionState === 'jump_fwd' || f.actionState === 'jump_back') {
          f.actionState = 'idle';
        }
      }
    }

    // Apply horizontal velocity
    f.x += f.vx;
    f.vx *= 0.82;
    // Arena boundaries
    if (f.x < 60) f.x = 60;
    if (f.x > 740) f.x = 740;

    // Check if in hitstun / knockdown
    if (f.actionState === 'knockdown') {
      f.stateTimer--;
      if (f.stateTimer <= 0) {
        f.actionState = 'getup';
        f.stateTimer = 18;
      }
      return;
    }
    if (f.actionState === 'getup') {
      f.stateTimer--;
      if (f.stateTimer <= 0) {
        f.actionState = 'idle';
      }
      return;
    }
    if (f.actionState === 'hit_light' || f.actionState === 'hit_heavy') {
      // Check for COMBO BREAKER attempt!
      if (opponent.comboHits >= 2 && f.comboBreakerWindow && input.breaker) {
        this.triggerComboBreaker(f, opponent);
        return;
      }

      f.stateTimer--;
      if (f.stateTimer <= 0) {
        f.actionState = 'idle';
        f.comboBreakerWindow = false;
      }
      return;
    }

    // Ultra combo automated barrage
    if (f.isInUltra && f.ultraHitsRemaining > 0) {
      f.moveFrame++;
      if (f.moveFrame % 4 === 0) {
        f.ultraHitsRemaining--;
        this.applyHit(f, opponent, 2, 'heavy', 'ultra');
        this.cameraShake = 5;
        this.flashTimer = 2;
        this.flashColor = '#ef4444';
        if (f.ultraHitsRemaining <= 0) {
          f.isInUltra = false;
          f.actionState = 'idle';
          soundEngine.playAnnouncer('SUPREME VICTORY!');
        }
      }
      return;
    }

    // Attacking state
    if (f.actionState === 'attack' && f.currentMove) {
      f.moveFrame++;
      const m = f.currentMove;
      const totalFrames = m.startupFrames + m.activeFrames + m.recoveryFrames;

      // Active hit frame
      if (f.moveFrame === m.startupFrames) {
        soundEngine.playMoveSfx(m.soundFx);

        // Projectile moves spawn projectile
        if (m.rangeX > 200) {
          this.spawnProjectile(f, m);
        } else {
          // Melee range check
          const hitRange = m.rangeX;
          const hitDistance = Math.abs(f.x - opponent.x);
          const heightDiff = Math.abs(f.y - opponent.y);

          // Check if facing opponent
          const isFacingTarget = (f.facing === 1 && opponent.x > f.x) || (f.facing === -1 && opponent.x < f.x);

          if (isFacingTarget && hitDistance <= hitRange && heightDiff <= m.rangeY) {
            this.handleAttackConnect(f, opponent, m);
          }
        }
      }

      // Combo input buffering while attacking
      this.checkComboBuffering(f, opponent, input);

      if (f.moveFrame >= totalFrames) {
        f.actionState = 'idle';
        f.currentMove = null;
        f.moveFrame = 0;
      }
      return;
    }

    // Blocking logic: moving backwards while opponent is attacking
    const movingBack = (f.facing === 1 && input.left) || (f.facing === -1 && input.right);
    f.isBlocking = movingBack && (opponent.actionState === 'attack' || this.projectiles.some(p => p.ownerIndex !== f.playerIndex));

    // Normal movement & actions
    if (f.isGrounded) {
      if (input.up) {
        f.vy = -14;
        f.y -= 4;
        f.isGrounded = false;
        if (input.left) {
          f.vx = -4.5;
          f.actionState = 'jump_back';
        } else if (input.right) {
          f.vx = 4.5;
          f.actionState = 'jump_fwd';
        } else {
          f.actionState = 'jump_up';
        }
        return;
      }

      if (input.down) {
        f.actionState = 'crouch';
        f.vx = 0;
      } else if (input.right) {
        f.actionState = f.facing === 1 ? 'walk_fwd' : 'walk_back';
        f.vx = f.data.speed;
      } else if (input.left) {
        f.actionState = f.facing === -1 ? 'walk_fwd' : 'walk_back';
        f.vx = -f.data.speed;
      } else {
        f.actionState = 'idle';
        f.vx = 0;
      }

      // Check Normal or Special Attack triggers
      this.checkMoveInputs(f, opponent, input);
    }
  }

  private checkMoveInputs(f: ActiveFighter, opponent: ActiveFighter, input: InputState) {
    // 1. Check Ultra Combo conditions (Red bar / Danger + HP < 30%)
    if (opponent.currentBar === 2 && opponent.health < 30) {
      const ultraMove = f.data.moves.find(m => m.role === 'ultra');
      if (ultraMove && (input.fp && input.fk || input.breaker)) {
        this.triggerUltraCombo(f, opponent, ultraMove);
        return;
      }
    }

    // 2. Check Special Openers & Linkers
    if (input.fp || input.fk || input.mp || input.mk || input.qp || input.qk) {
      // Find matching move
      const moves = f.data.moves;
      let selectedMove: MoveDefinition | null = null;

      if (input.fp) {
        selectedMove = moves.find(m => m.command.includes('Fierce Punch')) ||
                       moves.find(m => m.command.includes('Punch') && m.role === 'opener') ||
                       this.getFallbackNormal(f, 'FP');
      } else if (input.fk) {
        selectedMove = moves.find(m => m.command.includes('Fierce Kick')) ||
                       moves.find(m => m.command.includes('Kick') && m.role === 'opener') ||
                       this.getFallbackNormal(f, 'FK');
      } else if (input.mp) {
        selectedMove = moves.find(m => m.command.includes('Medium Punch')) ||
                       moves.find(m => m.role === 'linker') ||
                       this.getFallbackNormal(f, 'MP');
      } else if (input.mk) {
        selectedMove = moves.find(m => m.command.includes('Medium Kick')) ||
                       moves.find(m => m.role === 'opener') ||
                       this.getFallbackNormal(f, 'MK');
      } else if (input.qp) {
        selectedMove = moves.find(m => m.command.includes('Quick Punch')) ||
                       this.getFallbackNormal(f, 'QP');
      } else if (input.qk) {
        selectedMove = moves.find(m => m.command.includes('Quick Kick')) ||
                       this.getFallbackNormal(f, 'QK');
      }

      if (selectedMove) {
        f.actionState = 'attack';
        f.currentMove = selectedMove;
        f.moveFrame = 0;
      }
    }
  }

  private checkComboBuffering(f: ActiveFighter, opponent: ActiveFighter, input: InputState) {
    // Killer Instinct Rhythm: during recovery of an Opener or Linker, pressing a button triggers Auto-Double or Ender
    if (f.comboHits > 0 && f.moveFrame > (f.currentMove?.startupFrames || 0)) {
      // Auto-Double trigger
      if (input.qp || input.qk || input.mp || input.mk) {
        const autoDouble = f.data.moves.find(m => m.role === 'autodouble');
        if (autoDouble && f.lastMoveRole !== 'autodouble') {
          f.currentMove = autoDouble;
          f.moveFrame = 0;
          return;
        }
      }

      // Ender trigger
      if (input.fp || input.fk) {
        const ender = f.data.moves.find(m => m.role === 'ender');
        if (ender && f.comboHits >= 4) {
          f.currentMove = ender;
          f.moveFrame = 0;
          return;
        }
      }
    }
  }

  private getFallbackNormal(f: ActiveFighter, type: string): MoveDefinition {
    const isKick = type.endsWith('K');
    const isHeavy = type.startsWith('F');
    const isMedium = type.startsWith('M');

    return {
      id: `${f.id}_normal_${type}`,
      name: `${isHeavy ? 'Fierce' : isMedium ? 'Medium' : 'Quick'} ${isKick ? 'Kick' : 'Punch'}`,
      command: type,
      role: 'normal',
      damage: isHeavy ? 14 : isMedium ? 10 : 6,
      hits: 1,
      startupFrames: isHeavy ? 7 : isMedium ? 5 : 3,
      activeFrames: isHeavy ? 8 : isMedium ? 6 : 4,
      recoveryFrames: isHeavy ? 10 : isMedium ? 7 : 5,
      rangeX: isKick ? 85 : 75,
      rangeY: 50,
      knockback: isHeavy ? 8 : 4,
      knockdown: false,
      soundFx: isHeavy ? 'punch_heavy' : isMedium ? 'punch_med' : 'punch_light'
    };
  }

  private handleAttackConnect(attacker: ActiveFighter, defender: ActiveFighter, move: MoveDefinition) {
    // If defender is blocking
    if (defender.isBlocking) {
      defender.health -= Math.max(1, Math.floor(move.damage * 0.12)); // Chip damage
      defender.vx = (attacker.facing === 1 ? 1 : -1) * (move.knockback * 0.6);
      this.spawnSparks(defender.x, defender.y - 40, '#38bdf8', 8);
      soundEngine.playHit('light');
      return;
    }

    // Successful Hit!
    attacker.comboHits += move.hits;
    attacker.comboDamage += move.damage;
    attacker.lastMoveRole = move.role;

    // Apply damage to current health bar
    defender.health -= move.damage;
    defender.vx = (attacker.facing === 1 ? 1 : -1) * move.knockback;

    // Visuals & Audio
    this.cameraShake = Math.min(15, move.knockback * 0.7);
    this.spawnHitEffects(defender.x, defender.y - 45, move.soundFx);

    // If opponent is knocked down
    if (move.knockdown || defender.health <= 0) {
      defender.actionState = 'knockdown';
      defender.stateTimer = 35;
      defender.vy = -7;
      
      // Conclude combo
      this.finishCombo(attacker);
    } else {
      defender.actionState = move.damage > 12 ? 'hit_heavy' : 'hit_light';
      defender.stateTimer = 16;
      // Enable combo breaker window during auto-doubles and linkers
      if (move.role === 'autodouble' || move.role === 'linker') {
        defender.comboBreakerWindow = true;
      }
    }

    // Check combo announcement tier
    if (attacker.comboHits >= 3) {
      const tier = getComboTier(attacker.comboHits);
      if (tier) {
        this.addNotification(attacker.comboHits, tier, attacker.playerIndex);
        if (attacker.comboHits === 5 || attacker.comboHits === 9 || attacker.comboHits === 14 || attacker.comboHits === 20) {
          soundEngine.playAnnouncer(tier);
        }
      }
    }
  }

  private triggerComboBreaker(breakerFighter: ActiveFighter, attackingFighter: ActiveFighter) {
    attackingFighter.actionState = 'knockdown';
    attackingFighter.stateTimer = 40;
    attackingFighter.vy = -9;
    attackingFighter.vx = (breakerFighter.facing === 1 ? 1 : -1) * 16;
    attackingFighter.comboHits = 0;
    attackingFighter.comboDamage = 0;

    breakerFighter.actionState = 'attack';
    breakerFighter.comboBreakerWindow = false;

    // Screen flash and camera shake
    this.cameraShake = 22;
    this.flashTimer = 8;
    this.flashColor = '#facc15'; // Golden electricity
    this.spawnSparks(breakerFighter.x, breakerFighter.y - 40, '#facc15', 30);

    // Announce C-C-C-COMBO BREAKER!
    this.addNotification(0, 'C-C-C-COMBO BREAKER!', breakerFighter.playerIndex, true);
    soundEngine.playAnnouncer('COMBO BREAKER', true);
  }

  private triggerUltraCombo(attacker: ActiveFighter, defender: ActiveFighter, ultraMove: MoveDefinition) {
    attacker.isInUltra = true;
    attacker.ultraHitsRemaining = ultraMove.hits;
    attacker.currentMove = ultraMove;
    attacker.moveFrame = 0;
    attacker.comboHits += 1;

    defender.actionState = 'hit_heavy';
    defender.stateTimer = 200;

    this.cameraShake = 20;
    this.flashTimer = 10;
    this.flashColor = '#ef4444';

    this.addNotification(ultraMove.hits, 'ULTRA COMBO!', attacker.playerIndex, false, true);
    soundEngine.playAnnouncer('ULTRA COMBO', false, true);
  }

  private finishCombo(attacker: ActiveFighter) {
    if (attacker.comboHits >= 3) {
      const tier = getComboTier(attacker.comboHits);
      if (tier) {
        soundEngine.playAnnouncer(tier);
      }
    }
    attacker.comboHits = 0;
    attacker.comboDamage = 0;
    attacker.lastMoveRole = null;
  }

  private spawnProjectile(f: ActiveFighter, m: MoveDefinition) {
    this.projectiles.push({
      id: `${f.id}_proj_${Date.now()}`,
      ownerIndex: f.playerIndex,
      x: f.x + (f.facing * 35),
      y: f.y - 45,
      vx: f.facing * 9.5,
      damage: m.damage,
      color: f.data.themeColor,
      type: m.soundFx,
      radius: 18,
      life: 90
    });
  }

  private updateProjectiles() {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx;
      p.life--;

      // Spawn projectile trail
      this.particles.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        color: p.color,
        size: Math.random() * 5 + 3,
        life: 14,
        maxLife: 14,
        type: 'laser'
      });

      // Collision with opponent
      const target = p.ownerIndex === 1 ? this.p2 : this.p1;
      const dist = Math.hypot(p.x - target.x, p.y - (target.y - 45));

      if (dist < p.radius + 30) {
        if (target.isBlocking) {
          target.health -= Math.max(1, Math.floor(p.damage * 0.15));
          this.spawnSparks(p.x, p.y, '#38bdf8', 12);
        } else {
          target.health -= p.damage;
          target.actionState = 'hit_heavy';
          target.stateTimer = 18;
          target.vx = (p.vx > 0 ? 1 : -1) * 8;
          this.spawnHitEffects(p.x, p.y, p.type);
          this.cameraShake = 8;
        }
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.x < 30 || p.x > 770 || p.life <= 0) {
        this.projectiles.splice(i, 1);
      }
    }
  }

  private applyHit(attacker: ActiveFighter, defender: ActiveFighter, damage: number, strength: 'light' | 'medium' | 'heavy', type: string) {
    defender.health -= damage;
    defender.actionState = 'hit_heavy';
    defender.stateTimer = 14;
    attacker.comboHits++;
    attacker.comboDamage += damage;
    this.spawnHitEffects(defender.x, defender.y - 45, type);
    soundEngine.playHit(strength);
  }

  private spawnHitEffects(x: number, y: number, soundType: string) {
    let color = '#fbbf24';
    if (soundType === 'slash') color = '#f43f5e';
    if (soundType === 'ice') color = '#22d3ee';
    if (soundType === 'laser') color = '#38bdf8';
    if (soundType === 'fire') color = '#f97316';

    this.spawnSparks(x, y, color, 16);
  }

  private spawnSparks(x: number, y: number, color: string, count: number = 12) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: Math.random() * 4 + 2,
        life: 20,
        maxLife: 20,
        type: 'spark'
      });
    }
  }

  private updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private checkMatchConditions() {
    if (this.isMatchOver) return;

    // Check P1 Health Bar transition / loss
    if (this.p1.health <= 0) {
      if (this.p1.currentBar === 1) {
        // Drop to Red (Danger) Bar
        this.p1.currentBar = 2;
        this.p1.health = 100;
        this.p1.actionState = 'knockdown';
        this.p1.stateTimer = 45;
        this.cameraShake = 12;
        this.addNotification(0, 'DANGER!', 1);
        soundEngine.playAnnouncer('DANGER!');
      } else {
        // Complete Defeat!
        this.p1.health = 0;
        this.p1.hasLost = true;
        this.p2.hasWon = true;
        this.isMatchOver = true;
        const supreme = this.p2.currentBar === 1;
        this.winnerText = `${this.p2.data.name} WINS! ${supreme ? 'SUPREME VICTORY!' : ''}`;
        soundEngine.playAnnouncer(supreme ? 'SUPREME VICTORY!' : 'VICTORY!');
      }
    }

    // Check P2 Health Bar transition / loss
    if (this.p2.health <= 0) {
      if (this.p2.currentBar === 1) {
        this.p2.currentBar = 2;
        this.p2.health = 100;
        this.p2.actionState = 'knockdown';
        this.p2.stateTimer = 45;
        this.cameraShake = 12;
        this.addNotification(0, 'DANGER!', 2);
        soundEngine.playAnnouncer('DANGER!');
      } else {
        this.p2.health = 0;
        this.p2.hasLost = true;
        this.p1.hasWon = true;
        this.isMatchOver = true;
        const supreme = this.p1.currentBar === 1;
        this.winnerText = `${this.p1.data.name} WINS! ${supreme ? 'SUPREME VICTORY!' : ''}`;
        soundEngine.playAnnouncer(supreme ? 'SUPREME VICTORY!' : 'VICTORY!');
      }
    }

    // Timeout
    if (this.matchTimer <= 0) {
      this.isMatchOver = true;
      const p1Total = (2 - this.p1.currentBar) * 100 + this.p1.health;
      const p2Total = (2 - this.p2.currentBar) * 100 + this.p2.health;
      if (p1Total >= p2Total) {
        this.p1.hasWon = true;
        this.p2.hasLost = true;
        this.winnerText = `${this.p1.data.name} WINS BY TIMEOUT!`;
      } else {
        this.p2.hasWon = true;
        this.p1.hasLost = true;
        this.winnerText = `${this.p2.data.name} WINS BY TIMEOUT!`;
      }
      soundEngine.playAnnouncer('TIME OVER!');
    }
  }

  private addNotification(hits: number, tierName: string, playerIndex: 1 | 2, isBreaker: boolean = false, isUltra: boolean = false) {
    this.notifications.push({
      hits,
      tierName,
      playerIndex,
      timer: 80,
      maxTimer: 80,
      isBreaker,
      isUltra
    });
  }

  // AI CPU Opponent
  private calculateCpuInput(): InputState {
    const input: InputState = {
      up: false, down: false, left: false, right: false,
      qp: false, mp: false, fp: false,
      qk: false, mk: false, fk: false,
      breaker: false
    };

    const dist = Math.abs(this.p2.x - this.p1.x);
    const facingP1 = this.p2.x < this.p1.x; // true if P1 is to the right

    // Breaker chance if in combo on Hard/Medium
    if (this.p2.comboBreakerWindow) {
      const breakerRoll = Math.random();
      if ((this.cpuDifficulty === 'Hard' && breakerRoll < 0.6) || (this.cpuDifficulty === 'Medium' && breakerRoll < 0.25)) {
        input.breaker = true;
        return input;
      }
    }

    // Reaction if P1 is attacking and CPU is within range -> Block!
    if (this.p1.actionState === 'attack' && dist < 120 && Math.random() < (this.cpuDifficulty === 'Hard' ? 0.75 : 0.4)) {
      if (facingP1) input.left = true;
      else input.right = true;
      return input;
    }

    // Neutral positioning
    if (dist > 180) {
      // Approach or throw projectile
      if (Math.random() < 0.25) {
        input.fp = true; // Projectile opener
      } else {
        if (facingP1) input.right = true;
        else input.left = true;
      }
    } else if (dist < 80) {
      // Close quarters: Execute combo opener or normal
      const rand = Math.random();
      if (rand < 0.3) {
        input.mp = true;
      } else if (rand < 0.5) {
        input.fk = true;
      } else if (rand < 0.7) {
        input.qp = true;
      } else if (rand < 0.85) {
        input.down = true;
        input.mk = true;
      }
    } else {
      // Mid-range: Jump attack or dash
      if (Math.random() < 0.08) {
        input.up = true;
        if (facingP1) input.right = true;
        else input.left = true;
      } else if (Math.random() < 0.3) {
        input.fp = true;
      }
    }

    return input;
  }
}
