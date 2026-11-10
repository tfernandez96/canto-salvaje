// Sound: Web Audio tones, started on the first input, muted on M.

import { tune } from './game/tuning';
import { audioContext } from './hook';

export let audio: { ac: AudioContext; out: GainNode } | null = null, muted = false;
export function startAudio() {
  if (!audio) {
    const ac = audioContext(); // a check may inject one
    const out = ac.createGain(); out.gain.value = muted ? 0 : tune.volume;
    out.connect(ac.destination); audio = { ac, out };
  }
  if (audio.ac.state === 'suspended') audio.ac.resume();
}
export function setMuted(m: boolean) { muted = m; if (audio) audio.out.gain.value = m ? 0 : tune.volume; }
addEventListener('tune', () => setMuted(muted));
export function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.3, delay = 0, slide = 0) {
  if (!audio || muted) return;
  const t = audio.ac.currentTime + delay, o = audio.ac.createOscillator(), g = audio.ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t);
  if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(audio.out); o.start(t); o.stop(t + dur + 0.02);
}
export function seq(notes: number[], type: OscillatorType = 'triangle', vol = 0.22, gap = 0.1, dur = 0.16) {
  notes.forEach((f, i) => tone(f, dur, type, vol, i * gap));
}
export function sfx(n: string) {
  switch (n) {
    case 'select': tone(660, 0.05, 'triangle', 0.15); break;
    case 'deny': tone(150, 0.14, 'square', 0.15); break;
    case 'confirm': tone(880, 0.07, 'triangle', 0.18); tone(1320, 0.08, 'triangle', 0.12, 0.05); break;
    case 'encounter': seq([392, 523, 392, 659], 'square', 0.12, 0.07, 0.09); break;
    case 'perfect': tone(988, 0.1, 'square', 0.18); tone(1480, 0.18, 'triangle', 0.2, 0.03); break;
    case 'good': tone(587, 0.1, 'square', 0.16); break;
    case 'weak': tone(220, 0.12, 'sawtooth', 0.12, 0, 0.7); break;
    case 'parry': tone(1568, 0.2, 'triangle', 0.25); tone(2349, 0.14, 'sine', 0.18, 0.02); tone(784, 0.1, 'square', 0.1); break;
    case 'block': tone(330, 0.12, 'square', 0.18); tone(165, 0.1, 'triangle', 0.15); break;
    case 'hurt': tone(160, 0.22, 'sawtooth', 0.22, 0, 0.5); break;
    case 'faint': seq([440, 349, 262, 196], 'triangle', 0.2, 0.09, 0.14); break;
    case 'fanfare': seq([523, 659, 784, 1047, 784, 1047], 'square', 0.12, 0.11, 0.18); break;
    case 'level': seq([523, 659, 784, 1047, 1319], 'triangle', 0.18, 0.06, 0.12); break;
    case 'join': seq([659, 784, 988, 1319, 988, 1319, 1568], 'triangle', 0.2, 0.09, 0.2); break;
    case 'heal': seq([523, 659, 880, 1047], 'sine', 0.2, 0.07, 0.2); break;
    case 'guard': tone(392, 0.3, 'sine', 0.2, 0, 1.5); break;
    case 'door': seq([196, 262, 330], 'triangle', 0.18, 0.08, 0.2); break;
    case 'warn': tone(110, 0.3, 'sawtooth', 0.2); tone(110, 0.3, 'sawtooth', 0.2, 0.35); break;
    case 'evolve': for (let i = 0; i < 12; i++) tone(330 + i * 60, 0.12, 'triangle', 0.12, i * 0.2); break;
    case 'flee': seq([392, 330, 262], 'sine', 0.15, 0.12, 0.2); break;
    case 'lose': seq([392, 370, 349, 262], 'triangle', 0.2, 0.25, 0.4); break;
  }
}

