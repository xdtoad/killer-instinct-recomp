/**
 * Killer Instinct Sound & Music Engine
 * Built on Web Audio API and Speech Synthesis for authentic 90s arcade audio:
 * - Iconic announcer ("C-C-C-COMBO BREAKER!", "ULTRA COMBO!", "SUPREME VICTORY!")
 * - 16-bit arcade combat sound FX (plasma, lasers, sword slashes, bone crunches)
 * - Heavy industrial synthesizer rock soundtrack
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private musicGainNode: GainNode | null = null;
  private sfxGainNode: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private musicInterval: any = null;
  private currentStageBpm: number = 132;
  private currentStageStyle: 'rock' | 'industrial' | 'techno' | 'darkwave' = 'rock';

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.musicGainNode = this.ctx.createGain();
        this.sfxGainNode = this.ctx.createGain();
        this.musicGainNode.gain.value = 0.22;
        this.sfxGainNode.gain.value = 0.45;
        this.musicGainNode.connect(this.ctx.destination);
        this.sfxGainNode.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.musicGainNode) {
      this.musicGainNode.gain.value = this.isMuted ? 0 : 0.22;
    }
    if (this.sfxGainNode) {
      this.sfxGainNode.gain.value = this.isMuted ? 0 : 0.45;
    }
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  // Speak with iconic Killer Instinct announcer voice
  public playAnnouncer(phrase: string, isComboBreaker: boolean = false, isUltra: boolean = false) {
    if (this.isMuted) return;
    this.initContext();

    // Voice synthesize if speech available
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel(); // cancel previous phrase
        
        let spokenText = phrase;
        if (isComboBreaker) {
          spokenText = "C... C... C... COMBO BREAKER!";
          this.playComboBreakerSfx();
        } else if (isUltra) {
          spokenText = "U L T R A... COMBO!";
          this.playUltraIntroSfx();
        }

        const utterance = new SpeechSynthesisUtterance(spokenText);
        utterance.rate = isComboBreaker ? 1.05 : (isUltra ? 0.85 : 0.95);
        utterance.pitch = isUltra ? 0.6 : 0.75; // deep gravelly arcade announcer
        utterance.volume = 1.0;
        
        // Try to pick deep male voice
        const voices = window.speechSynthesis.getVoices();
        const deepVoice = voices.find(v => 
          v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Mark'))
        ) || voices.find(v => v.lang.startsWith('en'));
        
        if (deepVoice) {
          utterance.voice = deepVoice;
        }

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn('Speech synthesis error', e);
      }
    }

    // Also trigger sound layer for arcade punch
    this.playAnnouncerChime(phrase);
  }

  private playAnnouncerChime(phrase: string) {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  public playComboBreakerSfx() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Electric scream / screech
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.5);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now);
    filter.Q.value = 8;

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGainNode || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);

    // Sub rumble
    this.playExplosion();
  }

  public playUltraIntroSfx() {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(120 + i * 40, now + i * 0.1);
      osc.frequency.exponentialRampToValueAtTime(60, now + i * 0.1 + 0.4);

      gain.gain.setValueAtTime(0.4, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);

      osc.connect(gain);
      gain.connect(this.sfxGainNode || this.ctx.destination);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.4);
    }
  }

  // Combat SFX
  public playHit(strength: 'light' | 'medium' | 'heavy') {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Noise buffer for punch thud
    const bufferSize = this.ctx.sampleRate * (strength === 'heavy' ? 0.25 : (strength === 'medium' ? 0.16 : 0.09));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(strength === 'heavy' ? 350 : (strength === 'medium' ? 600 : 900), now);

    const gain = this.ctx.createGain();
    const volume = strength === 'heavy' ? 0.9 : (strength === 'medium' ? 0.6 : 0.35);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + bufferSize / this.ctx.sampleRate);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGainNode || this.ctx.destination);

    noise.start(now);

    // Punch body thud sub-oscillator
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(strength === 'heavy' ? 90 : 130, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.15);
    subGain.gain.setValueAtTime(volume * 0.7, now);
    subGain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    sub.connect(subGain);
    subGain.connect(this.sfxGainNode || this.ctx.destination);
    sub.start(now);
    sub.stop(now + 0.15);
  }

  public playSlash() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(300, now + 0.18);

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, now);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGainNode || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.18);
  }

  public playLaser() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1600, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.22);
  }

  public playIce() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2200, now);
    osc.frequency.linearRampToValueAtTime(1800, now + 0.1);
    osc.frequency.linearRampToValueAtTime(900, now + 0.28);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

    osc.connect(gain);
    gain.connect(this.sfxGainNode || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.28);
  }

  public playFire() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGainNode || this.ctx.destination);

    noise.start(now);
  }

  public playExplosion() {
    this.initContext();
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.55;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(280, now);
    filter.frequency.linearRampToValueAtTime(50, now + 0.55);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.85, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.55);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGainNode || this.ctx.destination);

    noise.start(now);
  }

  public playMoveSfx(type: string) {
    switch (type) {
      case 'slash':
        this.playSlash();
        break;
      case 'laser':
        this.playLaser();
        break;
      case 'ice':
        this.playIce();
        break;
      case 'fire':
        this.playFire();
        break;
      case 'explosion':
        this.playExplosion();
        break;
      case 'punch_heavy':
        this.playHit('heavy');
        break;
      case 'punch_med':
        this.playHit('medium');
        break;
      case 'ultra':
        this.playUltraIntroSfx();
        break;
      default:
        this.playHit('light');
        break;
    }
  }

  // Heavy Industrial Synth Rock Soundtrack Generator
  public startStageMusic(bpm: number = 132, style: 'rock' | 'industrial' | 'techno' | 'darkwave' = 'rock') {
    this.initContext();
    this.stopStageMusic();
    this.currentStageBpm = bpm;
    this.currentStageStyle = style;
    this.isMusicPlaying = true;

    let step = 0;
    const stepDuration = (60 / bpm) / 4; // 16th notes

    // Iconic Killer Instinct bass groove patterns (root, octave, flat 5, minor 7th)
    const bassNotesRock = [55, 55, 110, 55, 65, 65, 130, 65, 73, 73, 146, 73, 65, 55, 110, 165]; // Hz
    const bassNotesIndustrial = [45, 45, 90, 45, 50, 50, 100, 50, 60, 60, 120, 60, 50, 45, 90, 135];
    const notes = style === 'industrial' ? bassNotesIndustrial : bassNotesRock;

    this.musicInterval = setInterval(() => {
      if (!this.ctx || this.isMuted || !this.isMusicPlaying) return;
      const now = this.ctx.currentTime;
      const current16th = step % 16;
      step++;

      // 1. Bassline synth
      const noteFreq = notes[current16th];
      const bassOsc = this.ctx.createOscillator();
      const bassFilter = this.ctx.createBiquadFilter();
      const bassGain = this.ctx.createGain();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(noteFreq, now);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(style === 'industrial' ? 380 : 550, now);
      bassFilter.Q.value = 5;

      bassGain.gain.setValueAtTime(0.18, now);
      bassGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.9);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.musicGainNode || this.ctx.destination);

      bassOsc.start(now);
      bassOsc.stop(now + stepDuration * 0.95);

      // 2. Heavy Kick on beats 0, 4, 8, 12
      if (current16th % 4 === 0) {
        const kickOsc = this.ctx.createOscillator();
        const kickGain = this.ctx.createGain();
        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, now);
        kickOsc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

        kickGain.gain.setValueAtTime(0.4, now);
        kickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        kickOsc.connect(kickGain);
        kickGain.connect(this.musicGainNode || this.ctx.destination);
        kickOsc.start(now);
        kickOsc.stop(now + 0.12);
      }

      // 3. Gated Snare on beats 4 and 12
      if (current16th === 4 || current16th === 12) {
        const snareSize = this.ctx.sampleRate * 0.14;
        const snareBuffer = this.ctx.createBuffer(1, snareSize, this.ctx.sampleRate);
        const sData = snareBuffer.getChannelData(0);
        for (let i = 0; i < snareSize; i++) {
          sData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (snareSize * 0.4));
        }
        const snareNoise = this.ctx.createBufferSource();
        snareNoise.buffer = snareBuffer;

        const snareFilter = this.ctx.createBiquadFilter();
        snareFilter.type = 'highpass';
        snareFilter.frequency.setValueAtTime(400, now);

        const snareGain = this.ctx.createGain();
        snareGain.gain.setValueAtTime(0.28, now);
        snareGain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);

        snareNoise.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(this.musicGainNode || this.ctx.destination);
        snareNoise.start(now);
      }

      // 4. Hi-Hat ticking on every 8th note
      if (current16th % 2 === 0) {
        const hatSize = this.ctx.sampleRate * 0.03;
        const hatBuffer = this.ctx.createBuffer(1, hatSize, this.ctx.sampleRate);
        const hData = hatBuffer.getChannelData(0);
        for (let i = 0; i < hatSize; i++) {
          hData[i] = (Math.random() * 2 - 1);
        }
        const hatNoise = this.ctx.createBufferSource();
        hatNoise.buffer = hatBuffer;

        const hatFilter = this.ctx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7000, now);

        const hatGain = this.ctx.createGain();
        hatGain.gain.setValueAtTime(0.06, now);
        hatGain.gain.exponentialRampToValueAtTime(0.005, now + 0.03);

        hatNoise.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.musicGainNode || this.ctx.destination);
        hatNoise.start(now);
      }

      // 5. Synth Lead Arpeggio on accent steps
      if (current16th === 2 || current16th === 6 || current16th === 10 || current16th === 14) {
        const leadOsc = this.ctx.createOscillator();
        const leadGain = this.ctx.createGain();
        leadOsc.type = 'square';
        leadOsc.frequency.setValueAtTime(noteFreq * 4, now);
        leadGain.gain.setValueAtTime(0.08, now);
        leadGain.gain.exponentialRampToValueAtTime(0.01, now + stepDuration * 0.6);

        leadOsc.connect(leadGain);
        leadGain.connect(this.musicGainNode || this.ctx.destination);
        leadOsc.start(now);
        leadOsc.stop(now + stepDuration * 0.6);
      }
    }, stepDuration * 1000);
  }

  public stopStageMusic() {
    this.isMusicPlaying = false;
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }
}

export const soundEngine = new SoundEngine();
