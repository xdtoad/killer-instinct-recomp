/**
 * Killer Instinct Arcade Canvas Renderer
 * High-performance 60 FPS HTML5 Canvas rendering engine:
 * - Parallax animated stages with atmospheric weather FX (lightning, embers, snow)
 * - Authentic Killer Instinct fighters with motion animation and weapon trails
 * - Double health bars (Green -> Red Danger), combo counter notifications
 * - CRT scanline effects, camera shake, and flash filters
 */

import React, { useEffect, useRef } from 'react';
import { CombatEngine } from '../engine/combatEngine';
import { STAGES } from '../constants/fighters';
import { ActiveFighter, StageId } from '../types/game';

interface ArcadeCanvasProps {
  engine: CombatEngine;
  stageId: StageId;
  crtFilter: boolean;
  aspectRatio: '4:3' | '16:9';
  showHitboxes?: boolean;
}

export const ArcadeCanvas: React.FC<ArcadeCanvasProps> = ({
  engine,
  stageId,
  crtFilter,
  aspectRatio,
  showHitboxes = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stage = STAGES[stageId] || STAGES.shrine;

  useEffect(() => {
    let animationId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 0.03;
      const width = canvas.width;
      const height = canvas.height;

      ctx.save();

      // Camera Shake
      if (engine.cameraShake > 0) {
        const shakeX = (Math.random() - 0.5) * engine.cameraShake * 2;
        const shakeY = (Math.random() - 0.5) * engine.cameraShake * 2;
        ctx.translate(shakeX, shakeY);
      }

      // 1. Draw Background Stage
      drawStage(ctx, width, height, time, stage);

      // 2. Draw Fighter Shadows
      drawFighterShadow(ctx, engine.p1);
      drawFighterShadow(ctx, engine.p2);

      // 3. Draw Projectiles
      drawProjectiles(ctx, engine);

      // 4. Draw Fighters
      drawFighter(ctx, engine.p1, time);
      drawFighter(ctx, engine.p2, time);

      // 5. Draw Particle Sparks
      drawParticles(ctx, engine);

      // 6. Draw Killer Instinct HUD (Double Health Bars, Portraits, Timer)
      drawHUD(ctx, width, height, engine);

      // 7. Draw Combo Notifications
      drawComboNotifications(ctx, width, height, engine);

      // 8. Screen Flash (Breakers / Ultras)
      if (engine.flashTimer > 0) {
        ctx.fillStyle = engine.flashColor === 'white' 
          ? 'rgba(255, 255, 255, 0.45)' 
          : engine.flashColor === '#facc15'
          ? 'rgba(250, 204, 21, 0.45)'
          : 'rgba(239, 68, 68, 0.45)';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    animationId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [engine, stageId]);

  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-xl border border-neutral-800 bg-black shadow-2xl ${aspectRatio === '4:3' ? 'aspect-[4/3] max-w-[840px]' : 'aspect-[16/9] max-w-[980px]'} w-full mx-auto`}>
      <canvas
        ref={canvasRef}
        width={800}
        height={450}
        className="w-full h-full object-contain"
      />
      {crtFilter && <div className="crt-overlay absolute inset-0 rounded-xl pointer-events-none" />}
    </div>
  );
};

// Stage Drawing Helper
function drawStage(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, stage: any) {
  // Sky Gradient
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, stage.skyGradient[0]);
  grad.addColorStop(0.7, stage.skyGradient[1]);
  grad.addColorStop(1, '#05070a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // Parallax background mountain/structures
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.beginPath();
  ctx.moveTo(0, 280);
  for (let x = 0; x <= width; x += 40) {
    const y = 240 + Math.sin(x * 0.01 + time * 0.1) * 35;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.fill();

  // Stage Specific Theme Elements
  if (stage.id === 'shrine') {
    // Stone Pillars & Mystic Lanterns
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(70, 140, 44, 240);
    ctx.fillRect(680, 140, 44, 240);

    // Glowing Tiger Runes
    ctx.fillStyle = `rgba(56, 189, 248, ${0.4 + Math.sin(time * 3) * 0.2})`;
    ctx.beginPath();
    ctx.arc(92, 190, 12, 0, Math.PI * 2);
    ctx.arc(702, 190, 12, 0, Math.PI * 2);
    ctx.fill();
  } else if (stage.id === 'factory') {
    // Cybernetic pipes & red warning beacon
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(120, 180, 80, 40);
    ctx.strokeRect(600, 180, 80, 40);
    ctx.fillStyle = `rgba(239, 68, 68, ${0.3 + Math.sin(time * 4) * 0.25})`;
    ctx.beginPath();
    ctx.arc(400, 120, 16, 0, Math.PI * 2);
    ctx.fill();
  } else if (stage.id === 'glacier') {
    // Ice crystals
    ctx.fillStyle = 'rgba(34, 211, 238, 0.35)';
    ctx.beginPath();
    ctx.moveTo(100, 380);
    ctx.lineTo(130, 240);
    ctx.lineTo(160, 380);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(640, 380);
    ctx.lineTo(670, 220);
    ctx.lineTo(700, 380);
    ctx.fill();
  } else if (stage.id === 'lava') {
    // Magma pool glow
    ctx.fillStyle = `rgba(249, 115, 22, ${0.3 + Math.sin(time * 2.5) * 0.15})`;
    ctx.fillRect(0, 370, width, 20);
  }

  // Floor Grid & Platform
  ctx.fillStyle = stage.floorColor;
  ctx.fillRect(0, 380, width, height - 380);

  // Floor Perspective Lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 2;
  for (let x = 0; x <= width; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 380);
    ctx.lineTo(x + (x - width / 2) * 0.4, height);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFighterShadow(ctx: CanvasRenderingContext2D, f: ActiveFighter) {
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
  ctx.beginPath();
  const shadowWidth = f.actionState === 'crouch' ? 36 : 28;
  ctx.ellipse(f.x, 382, shadowWidth, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawProjectiles(ctx: CanvasRenderingContext2D, engine: CombatEngine) {
  for (const p of engine.projectiles) {
    ctx.save();
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 18;

    const grad = ctx.createRadialGradient(p.x, p.y, 2, p.x, p.y, p.radius);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.4, p.color);
    grad.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, engine: CombatEngine) {
  for (const p of engine.particles) {
    ctx.save();
    const alpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.globalAlpha = alpha;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// Draw Fighter Sprites & Animations
function drawFighter(ctx: CanvasRenderingContext2D, f: ActiveFighter, time: number) {
  ctx.save();
  ctx.translate(f.x, f.y);
  ctx.scale(f.facing, 1);

  const isAttacking = f.actionState === 'attack';
  const isHit = f.actionState === 'hit_light' || f.actionState === 'hit_heavy';
  const isKnockedDown = f.actionState === 'knockdown';
  const isCrouching = f.actionState === 'crouch';
  const isJumping = !f.isGrounded;

  // Stance Breathing Idle Bounce
  const idleBounce = (!isAttacking && !isHit && !isKnockedDown && f.isGrounded) 
    ? Math.sin(time * 6 + (f.playerIndex === 1 ? 0 : 1.5)) * 2 
    : 0;

  // Colors based on character
  const mainColor = f.data.themeColor;
  const accentColor = f.data.accentColor;

  if (isKnockedDown) {
    // Fallen posture
    ctx.rotate(-Math.PI / 2);
    ctx.translate(20, -10);
  } else if (isCrouching) {
    ctx.translate(0, 16);
  }

  // Draw Specific Fighter Visual Silhouette & Details
  switch (f.id) {
    case 'jago':
      drawJago(ctx, isAttacking, isHit, f.moveFrame, idleBounce);
      break;
    case 'fulgore':
      drawFulgore(ctx, isAttacking, isHit, f.moveFrame, idleBounce);
      break;
    case 'glacius':
      drawGlacius(ctx, isAttacking, isHit, f.moveFrame, idleBounce);
      break;
    case 'orchid':
      drawOrchid(ctx, isAttacking, isHit, f.moveFrame, idleBounce);
      break;
    case 'sabrewulf':
      drawSabrewulf(ctx, isAttacking, isHit, f.moveFrame, idleBounce);
      break;
    case 'cinder':
      drawCinder(ctx, isAttacking, isHit, f.moveFrame, idleBounce, time);
      break;
    case 'spinal':
      drawSpinal(ctx, isAttacking, isHit, f.moveFrame, idleBounce);
      break;
    case 'tjcombo':
      drawTJCombo(ctx, isAttacking, isHit, f.moveFrame, idleBounce);
      break;
    default:
      drawJago(ctx, isAttacking, isHit, f.moveFrame, idleBounce);
  }

  ctx.restore();
}

// 1. Jago: Monk trousers, tiger mask, headband, laser sword
function drawJago(ctx: CanvasRenderingContext2D, isAtk: boolean, isHit: boolean, moveFrame: number, bounce: number) {
  // Legs / Hakama Trousers
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(-14, -38, 11, 38);
  ctx.fillRect(3, -38, 11, 38);
  // Shin guards
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(-15, -16, 13, 16);
  ctx.fillRect(2, -16, 13, 16);

  // Torso / Muscular Chest
  ctx.fillStyle = isHit ? '#f87171' : '#fcd34d';
  ctx.fillRect(-12, -72 + bounce, 24, 34);
  // Tiger Spirit Tattoos
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-6, -65 + bounce);
  ctx.lineTo(6, -55 + bounce);
  ctx.stroke();

  // Head & Ninja Mask
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(-9, -92 + bounce, 18, 20);
  // Eye slit
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, -84 + bounce, 7, 3);
  // Fluttering Headband
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-9, -82 + bounce);
  ctx.quadraticCurveTo(-24, -80 + bounce, -28, -70 + bounce);
  ctx.stroke();

  // Katana / Laser Blade Arms
  if (isAtk) {
    const ext = Math.min(38, moveFrame * 6);
    ctx.fillStyle = '#38bdf8';
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    // Sword slash trail
    ctx.fillRect(8, -65 + bounce, ext + 35, 6);
    ctx.beginPath();
    ctx.arc(8 + ext + 35, -62 + bounce, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  } else {
    // Ready Guard
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(6, -68 + bounce, 10, 24);
  }
}

// 2. Fulgore: Cyber metallic armour, predator red optics, plasma blades
function drawFulgore(ctx: CanvasRenderingContext2D, isAtk: boolean, isHit: boolean, moveFrame: number, bounce: number) {
  // Mechanical Legs
  ctx.fillStyle = isHit ? '#f87171' : '#334155';
  ctx.fillRect(-16, -42, 13, 42);
  ctx.fillRect(3, -42, 13, 42);
  // Knee exhausts
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(14, -26, 4, 8);

  // Chrome Torso with Chest Reactor
  ctx.fillStyle = isHit ? '#f87171' : '#64748b';
  ctx.fillRect(-15, -78 + bounce, 30, 36);
  // Glowing Reactor Core
  ctx.fillStyle = '#ef4444';
  ctx.shadowColor = '#ef4444';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(0, -60 + bounce, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  // Cybernetic Helmet & Predator Plumes
  ctx.fillStyle = '#475569';
  ctx.fillRect(-11, -100 + bounce, 22, 22);
  // Red Optical Visor
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(2, -92 + bounce, 9, 4);

  // Plasma Claw Blades
  if (isAtk) {
    const ext = Math.min(42, moveFrame * 7);
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 16;
    // Twin Forearm Plasma Blades
    ctx.fillRect(10, -68 + bounce, ext + 40, 4);
    ctx.fillRect(10, -58 + bounce, ext + 40, 4);
    ctx.shadowBlur = 0;
  } else {
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(8, -65 + bounce, 18, 5);
  }
}

// 3. Glacius: Crystalline translucent sub-zero alien
function drawGlacius(ctx: CanvasRenderingContext2D, isAtk: boolean, isHit: boolean, moveFrame: number, bounce: number) {
  // Translucent Cryo Legs
  ctx.fillStyle = isHit ? '#f87171' : 'rgba(34, 211, 238, 0.85)';
  ctx.fillRect(-14, -40, 12, 40);
  ctx.fillRect(2, -40, 12, 40);

  // Crystalline Torso
  ctx.fillStyle = isHit ? '#f87171' : 'rgba(6, 182, 212, 0.9)';
  ctx.beginPath();
  ctx.moveTo(-16, -40);
  ctx.lineTo(-18, -75 + bounce);
  ctx.lineTo(18, -75 + bounce);
  ctx.lineTo(16, -40);
  ctx.fill();

  // Ice Spikes on Shoulders
  ctx.fillStyle = '#cffafe';
  ctx.beginPath();
  ctx.moveTo(-18, -75 + bounce);
  ctx.lineTo(-26, -90 + bounce);
  ctx.lineTo(-14, -75 + bounce);
  ctx.fill();

  // Elongated Cryo Head
  ctx.fillStyle = 'rgba(34, 211, 238, 0.95)';
  ctx.beginPath();
  ctx.ellipse(0, -92 + bounce, 9, 15, Math.PI / 12, 0, Math.PI * 2);
  ctx.fill();

  // Ice Lance Attack
  if (isAtk) {
    const ext = Math.min(50, moveFrame * 8);
    ctx.fillStyle = '#67e8f9';
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.moveTo(10, -68 + bounce);
    ctx.lineTo(10 + ext + 45, -60 + bounce);
    ctx.lineTo(10, -52 + bounce);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
}

// 4. Orchid: Secret agent in green suit with glowing tonfas
function drawOrchid(ctx: CanvasRenderingContext2D, isAtk: boolean, isHit: boolean, moveFrame: number, bounce: number) {
  // Boots & Legs
  ctx.fillStyle = '#065f46';
  ctx.fillRect(-12, -38, 10, 38);
  ctx.fillRect(2, -38, 10, 38);

  // Emerald Leotard & Belt
  ctx.fillStyle = isHit ? '#f87171' : '#10b981';
  ctx.fillRect(-11, -70 + bounce, 22, 32);
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(-12, -44 + bounce, 24, 5);

  // Head & Long Hair
  ctx.fillStyle = '#fde047';
  ctx.fillRect(-8, -88 + bounce, 16, 18);
  // Flowing Dark Hair
  ctx.fillStyle = '#1e1b4b';
  ctx.fillRect(-14, -88 + bounce, 8, 26);

  // Glowing Tonfas
  ctx.fillStyle = '#ec4899';
  ctx.shadowColor = '#ec4899';
  ctx.shadowBlur = 10;
  if (isAtk) {
    const ext = Math.min(36, moveFrame * 6);
    ctx.fillRect(8, -65 + bounce, ext + 30, 7);
  } else {
    ctx.fillRect(6, -65 + bounce, 16, 6);
  }
  ctx.shadowBlur = 0;
}

// 5. Sabrewulf: Feral were-wolf, blue-grey fur, sharp claws
function drawSabrewulf(ctx: CanvasRenderingContext2D, isAtk: boolean, isHit: boolean, moveFrame: number, bounce: number) {
  // Digigrade Wolf Legs
  ctx.fillStyle = isHit ? '#f87171' : '#475569';
  ctx.fillRect(-16, -36, 12, 36);
  ctx.fillRect(4, -36, 12, 36);

  // Hunched Wolf Torso
  ctx.fillStyle = isHit ? '#f87171' : '#334155';
  ctx.beginPath();
  ctx.ellipse(-2, -64 + bounce, 18, 28, Math.PI / 10, 0, Math.PI * 2);
  ctx.fill();

  // Feral Wolf Head with Open Snout & Teeth
  ctx.fillStyle = '#475569';
  ctx.beginPath();
  ctx.moveTo(-10, -90 + bounce);
  ctx.lineTo(14, -84 + bounce);
  ctx.lineTo(8, -72 + bounce);
  ctx.fill();
  // Glowing Eyes
  ctx.fillStyle = '#fbbf24';
  ctx.fillRect(2, -88 + bounce, 4, 3);

  // Claws Swipe
  if (isAtk) {
    const ext = Math.min(42, moveFrame * 7);
    ctx.strokeStyle = '#facc15';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(10 + ext, -65 + bounce, 24, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();
  }
}

// 6. Cinder: Liquid burning magma humanoid
function drawCinder(ctx: CanvasRenderingContext2D, isAtk: boolean, isHit: boolean, moveFrame: number, bounce: number, time: number) {
  const flameGlow = Math.sin(time * 12) * 4;
  ctx.shadowColor = '#f97316';
  ctx.shadowBlur = 18;

  // Legs
  ctx.fillStyle = '#ea580c';
  ctx.fillRect(-13, -38, 11, 38);
  ctx.fillRect(2, -38, 11, 38);

  // Molten Torso
  ctx.fillStyle = isHit ? '#ffffff' : '#f97316';
  ctx.fillRect(-14, -72 + bounce, 28, 34);

  // Magma Core Head
  ctx.fillStyle = '#fde047';
  ctx.beginPath();
  ctx.arc(0, -86 + bounce, 10 + flameGlow * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Trailblazer / Inferno arm
  if (isAtk) {
    const ext = Math.min(45, moveFrame * 7);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(10 + ext + 20, -60 + bounce, 16, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

// 7. Spinal: Skeletal warrior with cutlass & shield
function drawSpinal(ctx: CanvasRenderingContext2D, isAtk: boolean, isHit: boolean, moveFrame: number, bounce: number) {
  // Skeleton Legs (Bones)
  ctx.strokeStyle = isHit ? '#f87171' : '#e2e8f0';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-10, -40);
  ctx.lineTo(-10, 0);
  ctx.moveTo(8, -40);
  ctx.lineTo(8, 0);
  ctx.stroke();

  // Ribcage & Spine
  ctx.strokeStyle = isHit ? '#f87171' : '#e2e8f0';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, -40);
  ctx.lineTo(0, -75 + bounce);
  for (let i = -70; i <= -45; i += 7) {
    ctx.moveTo(-12, i + bounce);
    ctx.lineTo(12, i + bounce);
  }
  ctx.stroke();

  // Skull with glowing green eyes
  ctx.fillStyle = '#e2e8f0';
  ctx.beginPath();
  ctx.arc(0, -88 + bounce, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#10b981';
  ctx.fillRect(2, -90 + bounce, 4, 3);

  // Spiked Round Shield & Cutlass
  ctx.fillStyle = '#ca8a04';
  ctx.beginPath();
  ctx.arc(-14, -60 + bounce, 14, 0, Math.PI * 2);
  ctx.fill();

  if (isAtk) {
    const ext = Math.min(40, moveFrame * 7);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(6, -60 + bounce);
    ctx.lineTo(6 + ext + 35, -75 + bounce);
    ctx.stroke();
  }
}

// 8. TJ Combo: Boxer with titanium cyber arms
function drawTJCombo(ctx: CanvasRenderingContext2D, isAtk: boolean, isHit: boolean, moveFrame: number, bounce: number) {
  // Boxing Trunks & Legs
  ctx.fillStyle = '#3b82f6';
  ctx.fillRect(-15, -42, 13, 42);
  ctx.fillRect(2, -42, 13, 42);
  ctx.fillStyle = '#ef4444';
  ctx.fillRect(-15, -42, 30, 7);

  // Heavyweight Muscular Torso
  ctx.fillStyle = isHit ? '#f87171' : '#78350f';
  ctx.fillRect(-16, -78 + bounce, 32, 36);

  // Head with Flat Top Hair
  ctx.fillStyle = '#78350f';
  ctx.fillRect(-10, -96 + bounce, 20, 18);
  ctx.fillStyle = '#172554';
  ctx.fillRect(-11, -100 + bounce, 22, 6);

  // Titanium Arm & Heavy Red Glove
  ctx.fillStyle = '#94a3b8'; // Titanium cyber arm
  ctx.fillRect(4, -66 + bounce, 14, 8);
  ctx.fillStyle = '#dc2626'; // Boxing glove
  if (isAtk) {
    const ext = Math.min(46, moveFrame * 8);
    ctx.beginPath();
    ctx.arc(10 + ext + 20, -62 + bounce, 14, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(14, -62 + bounce, 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Killer Instinct Double Life Bar HUD
function drawHUD(ctx: CanvasRenderingContext2D, width: number, height: number, engine: CombatEngine) {
  ctx.save();

  // P1 Bar Top Left
  drawHealthBar(ctx, 30, 24, 280, 18, engine.p1, 'left');

  // P2 Bar Top Right
  drawHealthBar(ctx, width - 310, 24, 280, 18, engine.p2, 'right');

  // Match Timer in Middle
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(width / 2 - 28, 16, 56, 36);
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.strokeRect(width / 2 - 28, 16, 56, 36);

  ctx.font = '22px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = engine.matchTimer <= 10 ? '#ef4444' : '#facc15';
  ctx.fillText(String(engine.matchTimer).padStart(2, '0'), width / 2, 42);

  // Match Over Banner
  if (engine.isMatchOver && engine.winnerText) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(0, height / 2 - 45, width, 90);
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, height / 2 - 45, width, 90);

    ctx.font = '24px "Cinzel", serif';
    ctx.fillStyle = '#fde047';
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 16;
    ctx.fillText(engine.winnerText, width / 2, height / 2 + 8);
  }

  ctx.restore();
}

function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  f: ActiveFighter,
  align: 'left' | 'right'
) {
  // Border Box
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(x - 2, y - 2, w + 4, h * 2 + 8);
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - 2, y - 2, w + 4, h * 2 + 8);

  // 1. Primary Bar (Green Bar)
  const isBar1 = f.currentBar === 1;
  const bar1Percent = isBar1 ? Math.max(0, f.health / 100) : 0;
  const bar1FillW = w * bar1Percent;

  ctx.fillStyle = '#14532d'; // Dark green background
  ctx.fillRect(x, y, w, h);

  if (bar1Percent > 0) {
    const greenGrad = ctx.createLinearGradient(x, y, x + w, y);
    greenGrad.addColorStop(0, '#22c55e');
    greenGrad.addColorStop(1, '#86efac');
    ctx.fillStyle = greenGrad;
    const barX = align === 'left' ? x : x + (w - bar1FillW);
    ctx.fillRect(barX, y, bar1FillW, h);
  }

  // 2. Secondary Bar (Red / Danger Bar)
  const isBar2 = f.currentBar === 2;
  const bar2Percent = isBar2 ? Math.max(0, f.health / 100) : 1;
  const bar2FillW = w * bar2Percent;

  ctx.fillStyle = '#7f1d1d'; // Dark red background
  ctx.fillRect(x, y + h + 2, w, h);

  const redGrad = ctx.createLinearGradient(x, y + h + 2, x + w, y + h + 2);
  redGrad.addColorStop(0, '#ef4444');
  redGrad.addColorStop(1, '#fbbf24');
  ctx.fillStyle = redGrad;
  const barX2 = align === 'left' ? x : x + (w - bar2FillW);
  ctx.fillRect(barX2, y + h + 2, bar2FillW, h);

  // Name Tag
  ctx.font = '12px "Press Start 2P", monospace';
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = align;
  const nameX = align === 'left' ? x : x + w;
  ctx.fillText(f.data.name, nameX, y - 6);
}

// Combo Banners
function drawComboNotifications(ctx: CanvasRenderingContext2D, width: number, height: number, engine: CombatEngine) {
  for (const notif of engine.notifications) {
    ctx.save();
    const progress = notif.timer / notif.maxTimer;
    ctx.globalAlpha = Math.min(1, progress * 1.5);

    const isLeft = notif.playerIndex === 1;
    const posX = isLeft ? 160 : width - 160;
    const posY = 130;

    if (notif.isBreaker) {
      // COMBO BREAKER banner
      ctx.font = '22px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#facc15';
      ctx.shadowColor = '#eab308';
      ctx.shadowBlur = 20;
      ctx.fillText('C-C-C-COMBO BREAKER!', width / 2, posY);
    } else if (notif.isUltra) {
      // ULTRA COMBO banner
      ctx.font = '28px "Cinzel", serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#dc2626';
      ctx.shadowBlur = 24;
      ctx.fillText(`${notif.hits} HITS - ULTRA COMBO!`, width / 2, posY);
    } else {
      // Standard Combo Tier
      ctx.font = '16px "Press Start 2P", monospace';
      ctx.textAlign = isLeft ? 'left' : 'right';
      ctx.fillStyle = '#fbbf24';
      ctx.shadowColor = '#ea580c';
      ctx.shadowBlur = 12;
      ctx.fillText(`${notif.hits} HITS`, posX, posY);
      ctx.font = '13px "Rajdhani", sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(notif.tierName, posX, posY + 20);
    }

    ctx.restore();
  }
}
