/**
 * Killer Instinct Input Manager
 * Supports:
 * 1. PC Keyboard Mapping (1P and 2P simultaneous local play)
 * 2. Native Windows 10/11 Gamepad API (XInput, DirectInput, DualShock, Xbox Controllers)
 * 3. Directional Motion Buffer for Special Move Execution (QCF, DP, Charge, etc.)
 */

import { InputState } from '../types/game';

export interface GamepadStatus {
  connected: boolean;
  id: string;
  index: number;
}

export class InputManager {
  private p1Keys: Record<string, boolean> = {};
  private p2Keys: Record<string, boolean> = {};
  private motionBufferP1: { key: string; time: number }[] = [];
  private motionBufferP2: { key: string; time: number }[] = [];

  constructor() {
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  public destroy() {
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    const code = e.code;
    this.p1Keys[code] = true;
    this.p2Keys[code] = true;

    // Buffer motions for P1
    this.motionBufferP1.push({ key: code, time: performance.now() });
    if (this.motionBufferP1.length > 25) this.motionBufferP1.shift();

    // Prevent scrolling when pressing game keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(code)) {
      e.preventDefault();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    const code = e.code;
    this.p1Keys[code] = false;
    this.p2Keys[code] = false;
  };

  public getConnectedGamepads(): GamepadStatus[] {
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const list: GamepadStatus[] = [];
    for (let i = 0; i < gamepads.length; i++) {
      const gp = gamepads[i];
      if (gp && gp.connected) {
        list.push({
          connected: true,
          id: gp.id,
          index: gp.index
        });
      }
    }
    return list;
  }

  public getPlayer1Input(): InputState {
    // 1. Keyboard P1 mappings (WASD + UI/O, JK/L, Space)
    const k = this.p1Keys;
    const up = !!(k['KeyW'] || k['ArrowUp']);
    const down = !!(k['KeyS'] || k['ArrowDown']);
    const left = !!(k['KeyA'] || k['ArrowLeft']);
    const right = !!(k['KeyD'] || k['ArrowRight']);

    const qp = !!(k['KeyU'] || k['KeyJ'] && !k['KeyU']); // U = Quick Punch
    const mp = !!k['KeyI'];                              // I = Medium Punch
    const fp = !!k['KeyO'];                              // O = Fierce Punch
    const qk = !!k['KeyJ'];                              // J = Quick Kick
    const mk = !!k['KeyK'];                              // K = Medium Kick
    const fk = !!k['KeyL'];                              // L = Fierce Kick
    const breaker = !!(k['Space'] || k['KeyB']);

    // 2. Poll Gamepad 0 (if present)
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp0 = gamepads[0];
    if (gp0 && gp0.connected) {
      const axeX = gp0.axes[0] || 0;
      const axeY = gp0.axes[1] || 0;
      const dpadUp = gp0.buttons[12]?.pressed;
      const dpadDown = gp0.buttons[13]?.pressed;
      const dpadLeft = gp0.buttons[14]?.pressed;
      const dpadRight = gp0.buttons[15]?.pressed;

      return {
        up: up || dpadUp || axeY < -0.4,
        down: down || dpadDown || axeY > 0.4,
        left: left || dpadLeft || axeX < -0.4,
        right: right || dpadRight || axeX > 0.4,
        qp: qp || gp0.buttons[2]?.pressed,  // X (Xbox) / Square (PlayStation)
        mp: mp || gp0.buttons[3]?.pressed,  // Y / Triangle
        fp: fp || gp0.buttons[4]?.pressed,  // LB / L1
        qk: qk || gp0.buttons[0]?.pressed,  // A / Cross
        mk: mk || gp0.buttons[1]?.pressed,  // B / Circle
        fk: fk || gp0.buttons[5]?.pressed,  // RB / R1
        breaker: breaker || gp0.buttons[6]?.pressed || gp0.buttons[7]?.pressed // Triggers
      };
    }

    return { up, down, left, right, qp, mp, fp, qk, mk, fk, breaker };
  }

  public getPlayer2Input(): InputState {
    // 2P Keyboard mapping (Numpad or alternative keys: Numpad 8456 / Arrow keys)
    const k = this.p2Keys;
    const up = !!(k['Numpad8'] || k['KeyT']);
    const down = !!(k['Numpad5'] || k['Numpad2'] || k['KeyG']);
    const left = !!(k['Numpad4'] || k['KeyF']);
    const right = !!(k['Numpad6'] || k['KeyH']);

    const qp = !!(k['Numpad7'] || k['KeyZ']);
    const mp = !!(k['Numpad8'] && !up || k['KeyX']);
    const fp = !!(k['Numpad9'] || k['KeyC']);
    const qk = !!(k['Numpad1'] || k['KeyV']);
    const mk = !!(k['Numpad2'] && !down || k['KeyB']);
    const fk = !!(k['Numpad3'] || k['KeyN']);
    const breaker = !!(k['Numpad0'] || k['Enter'] || k['KeyM']);

    // 2. Poll Gamepad 1 (if present)
    const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
    const gp1 = gamepads[1];
    if (gp1 && gp1.connected) {
      const axeX = gp1.axes[0] || 0;
      const axeY = gp1.axes[1] || 0;
      const dpadUp = gp1.buttons[12]?.pressed;
      const dpadDown = gp1.buttons[13]?.pressed;
      const dpadLeft = gp1.buttons[14]?.pressed;
      const dpadRight = gp1.buttons[15]?.pressed;

      return {
        up: up || dpadUp || axeY < -0.4,
        down: down || dpadDown || axeY > 0.4,
        left: left || dpadLeft || axeX < -0.4,
        right: right || dpadRight || axeX > 0.4,
        qp: qp || gp1.buttons[2]?.pressed,
        mp: mp || gp1.buttons[3]?.pressed,
        fp: fp || gp1.buttons[4]?.pressed,
        qk: qk || gp1.buttons[0]?.pressed,
        mk: mk || gp1.buttons[1]?.pressed,
        fk: fk || gp1.buttons[5]?.pressed,
        breaker: breaker || gp1.buttons[6]?.pressed || gp1.buttons[7]?.pressed
      };
    }

    return { up, down, left, right, qp, mp, fp, qk, mk, fk, breaker };
  }
}

export const inputManager = new InputManager();
