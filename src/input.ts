// Input: keys by position (event.code), OS key repeat ignored.

import { startAudio } from './audio';

export const down = new Set<string>(), hit = new Set<string>();
export const pressed = (code: string): boolean => hit.has(code); // true for one step after the key goes down
addEventListener('keydown', e => {
  startAudio();
  if (!e.repeat) { down.add(e.code); hit.add(e.code); }
  if (e.code === 'Space' || e.code.startsWith('Arrow') || e.code === 'Backspace') e.preventDefault();
});
addEventListener('keyup', e => down.delete(e.code));
addEventListener('pointerdown', () => startAudio());
addEventListener('blur', () => down.clear());
export const KEYS: Record<string, string[]> = {
  up: ['ArrowUp', 'KeyW'], down: ['ArrowDown', 'KeyS'], left: ['ArrowLeft', 'KeyA'], right: ['ArrowRight', 'KeyD'],
  ok: ['Enter', 'NumpadEnter', 'Space'], enter: ['Enter', 'NumpadEnter'], back: ['Backspace', 'Escape'],
};
export const tap = (name: string): boolean => KEYS[name].some(pressed);
export const held = (name: string): boolean => KEYS[name].some(c => down.has(c));
export function digit() { for (let i = 1; i <= 4; i++) if (pressed('Digit' + i) || pressed('Numpad' + i)) return i - 1; return -1; }

