// Mouse and touch. A tap on a drawn button presses the key it stands for, so the game's logic
// stays the keyboard's; a hold anywhere else is a position (the dungeon walks toward it).
// Buttons are registered while a frame draws, and a tap is checked against the last frame's.
import { W, H, canvas } from './screen';
import { hit } from './input';
import { startAudio } from './audio';
import type { Loose } from './game/types';

/** A tappable area in game coordinates (the 1280 x 720 canvas). */
interface Region { x: number; y: number; w: number; h: number; on: () => void }
let regions: Region[] = [];
let redraw: () => void = () => { /* set by the game */ };

/** What draws the current frame: a tap redraws first, so it lands on what the game shows now. */
export function onTapRedraw(fn: () => void): void { redraw = fn; }

/**
 * Where the pointer is in game coordinates, whether it is held down (and not on a button),
 * and whether the player is using it: true after a click or a tap, false after any key, so the
 * on-screen buttons that only a mouse or a finger needs show only then.
 */
export const pointer = { x: 0, y: 0, held: false, active: false, id: -1 };

/** Forgets the last frame's buttons; the frame being drawn registers its own. */
export function clearRegions(): void { regions = []; }

/** Registers a tappable area for the frame being drawn. Later ones sit on top of earlier ones. */
export function region(x: number, y: number, w: number, h: number, on: () => void): void {
  regions.push({ x, y, w, h, on });
}

/** A tap handler that presses one key for one step. */
export const press = (code: string) => (): void => { hit.add(code); };

function toGame(e: PointerEvent): [number, number] {
  const r = canvas.getBoundingClientRect();
  return [(e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H];
}

/** On a phone: fullscreen and landscape where the browser allows it (Android); nothing where it does not. */
function goFullscreen(): void {
  const root = document.documentElement as Loose;
  if (document.fullscreenElement || !root.requestFullscreen) return;
  root.requestFullscreen({ navigationUI: 'hide' })
    .then(() => (screen.orientation as Loose)?.lock?.('landscape'))
    .catch(() => { /* refused or unsupported: play on as it is */ });
}

canvas.addEventListener('pointerdown', e => {
  e.preventDefault();
  startAudio();
  pointer.active = true;
  if (e.pointerType === 'touch') goFullscreen();
  const [x, y] = toGame(e);
  pointer.x = x; pointer.y = y;
  redraw();
  for (let i = regions.length - 1; i >= 0; i--) {
    const g = regions[i];
    if (x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h) { g.on(); return; }
  }
  pointer.held = true; pointer.id = e.pointerId;
  try { canvas.setPointerCapture(e.pointerId); } catch { /* the pointer is gone already */ }
});
canvas.addEventListener('pointermove', e => {
  if (!pointer.held || e.pointerId !== pointer.id) return;
  [pointer.x, pointer.y] = toGame(e);
});
const release = (e: PointerEvent): void => { if (e.pointerId === pointer.id) pointer.held = false; };
canvas.addEventListener('pointerup', release);
canvas.addEventListener('pointercancel', release);
canvas.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('keydown', () => { pointer.active = false; });
addEventListener('blur', () => { pointer.held = false; });
