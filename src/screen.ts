// The screen and the drawing kit: the canvas, text, and the shapes every figure and panel is drawn with.

import { KEYCAPS, TYPES } from './game/data';
import { TAU } from './game/rules';

export const W = 1280, H = 720;        // logical size
export const PIXEL = false;
export const FONT = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';
export const INK = '#1b1426', GOLD = '#f2c14e', CRIM = '#e0315b', CYAN = '#5ff2ff';

export const canvas = document.getElementById('game') as HTMLCanvasElement;
export const mainCtx = canvas.getContext('2d')!;
export let ctx: CanvasRenderingContext2D = mainCtx; // swapped to an offscreen context to draw silhouettes
export function setCtx(c: CanvasRenderingContext2D): void { ctx = c; }
export function fit() { // fills the window at any size and pixel ratio
  const k = Math.min(innerWidth / W, innerHeight / H);
  const s = PIXEL ? Math.max(1, Math.floor(k)) : k;
  const r = PIXEL ? 1 : s * (devicePixelRatio || 1);
  canvas.width = Math.round(W * r); canvas.height = Math.round(H * r);
  canvas.style.width = Math.round(W * s) + 'px'; canvas.style.height = Math.round(H * s) + 'px';
  canvas.style.marginTop = Math.max(0, Math.floor((innerHeight - H * s) / 2)) + 'px';
  canvas.style.imageRendering = PIXEL ? 'pixelated' : 'auto';
  mainCtx.setTransform(r, 0, 0, r, 0, 0); mainCtx.imageSmoothingEnabled = !PIXEL;
}
addEventListener('resize', fit); fit();
export function clear(c: string) { ctx.fillStyle = c; ctx.fillRect(0, 0, W, H); }
export function text(s: string, x: number, y: number, size: number, c: string, align: CanvasTextAlign = 'center') { txt(s, x, y, size, c, align); }
export function txt(s: string, x: number, y: number, size: number, c: string, align: CanvasTextAlign = 'center', bold = false, stroke = true) {
  ctx.font = `${bold ? '700 ' : ''}${size}px ${FONT}`; ctx.textAlign = align; ctx.textBaseline = 'middle';
  if (stroke) { ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size / 5); ctx.strokeStyle = 'rgba(10,8,22,0.9)'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = c; ctx.fillText(s, x, y);
}

export function B() { ctx.beginPath(); }
export function fs(fill: string | CanvasGradient, lw = 3, stroke: string = INK) {
  ctx.fillStyle = fill; ctx.fill();
  if (lw) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
}
export function el(x: number, y: number, rx: number, ry: number, rot = 0) { ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), rot, 0, TAU); }
export function lg(x0: number, y0: number, x1: number, y1: number, stops: string[]) { const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => g.addColorStop(i / (stops.length - 1), c)); return g; }
export function rg(x: number, y: number, r: number, c0: string, c1: string) { const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.08, x, y, r); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; }
export function eye(x: number, y: number, r: number) { B(); el(x, y, r, r * 1.2); fs('#17121f', 0); B(); el(x + r * 0.35, y - r * 0.45, r * 0.38, r * 0.38); fs('#fff', 0); }
export function tube(path: () => void, w: number, col: string) {
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  B(); path(); ctx.lineWidth = w + 6; ctx.strokeStyle = INK; ctx.stroke();
  B(); path(); ctx.lineWidth = w; ctx.strokeStyle = col; ctx.stroke();
}
export function leg(x: number, y: number, w: number, h: number, col: string) { B(); ctx.roundRect(x - w / 2, y, w, h, w / 2); fs(col, 2.5); }
export function flame(x0: number, y0: number, x1: number, y1: number, wid: number, cols: string[], wob: number) {
  B(); ctx.moveTo(x0 - wid, y0);
  ctx.bezierCurveTo(x0 - wid * 1.6, y0 - (y0 - y1) * 0.5, x1 + wob - wid * 0.4, y1 + 12, x1 + wob, y1);
  ctx.bezierCurveTo(x1 + wob + wid * 0.6, y1 + 16, x0 + wid * 1.4, y0 - (y0 - y1) * 0.4, x0 + wid, y0);
  ctx.closePath(); fs(lg(0, y1, 0, y0, cols));
}
export function pill(x: number, y: number, w: number, h: number, fill: string, stroke?: string | null) { B(); ctx.roundRect(x, y, w, h, h / 2); ctx.fillStyle = fill; ctx.fill(); if (stroke) { ctx.lineWidth = 2; ctx.strokeStyle = stroke; ctx.stroke(); } }
export function panel(x: number, y: number, w: number, h: number, border: string = GOLD, a = 0.86) {
  B(); ctx.roundRect(x, y, w, h, 12); ctx.fillStyle = `rgba(14,12,28,${a})`; ctx.fill();
  ctx.lineWidth = 2; ctx.strokeStyle = border; ctx.stroke();
  B(); ctx.roundRect(x + 4, y + 4, w - 8, h - 8, 9); ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.stroke();
}
export function typePill(type: string, x: number, y: number, size = 13) {
  const T_ = TYPES[type]; ctx.font = `700 ${size}px ${FONT}`; const w = ctx.measureText(T_.name).width + 16;
  pill(x, y - size * 0.75, w, size * 1.5, T_.col, INK); txt(T_.name, x + w / 2, y, size, '#160f1c', 'center', true, false); return w;
}
export function arrowShape(dir: number, x: number, y: number, s: number, fill: string | null, stroke: string | null = INK, lw = 3) { // a drawn arrow, never a font glyph
  ctx.save(); ctx.translate(x, y); ctx.rotate([Math.PI, Math.PI / 2, -Math.PI / 2, 0][dir]);
  B(); ctx.moveTo(s, 0); ctx.lineTo(0, -s); ctx.lineTo(0, -s * 0.42); ctx.lineTo(-s, -s * 0.42);
  ctx.lineTo(-s, s * 0.42); ctx.lineTo(0, s * 0.42); ctx.lineTo(0, s); ctx.closePath();
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.lineWidth = lw; ctx.strokeStyle = stroke; ctx.lineJoin = 'round'; ctx.stroke(); }
  ctx.restore();
}
export function heart(x: number, y: number, s: number, col: string) {
  B(); ctx.moveTo(x, y + s * 0.9);
  ctx.bezierCurveTo(x - s * 1.4, y - s * 0.2, x - s * 0.6, y - s * 1.2, x, y - s * 0.4);
  ctx.bezierCurveTo(x + s * 0.6, y - s * 1.2, x + s * 1.4, y - s * 0.2, x, y + s * 0.9); fs(col, 2);
}
export function diamond(x: number, y: number, s: number, fill: string) { B(); ctx.moveTo(x, y - s); ctx.lineTo(x + s * 0.75, y); ctx.lineTo(x, y + s); ctx.lineTo(x - s * 0.75, y); ctx.closePath(); fs(fill, 1.5); }
export const keyLabel = (id: string): string => (KEYCAPS.find(k => k.id === id) || { label: '' }).label;
export function keycap(id: string, x: number, y: number, s = 1) { // a drawn key with its letter, shown only inside a ring
  const wide = id === 'SPC', w = (wide ? 92 : 38) * s, h = 36 * s;
  B(); ctx.roundRect(x - w / 2, y - h / 2 + 3 * s, w, h, 7 * s); ctx.fillStyle = '#0d0a18'; ctx.fill();
  B(); ctx.roundRect(x - w / 2, y - h / 2, w, h, 7 * s); ctx.fillStyle = '#f4ead0'; ctx.fill(); ctx.lineWidth = Math.max(1.5, 2.5 * s); ctx.strokeStyle = INK; ctx.stroke();
  txt(keyLabel(id), x, y + s, Math.max(11, (wide ? 15 : 22) * s), '#1b1426', 'center', true, false);
}
export function chevron(x: number, y: number, s: number, col: string) { B(); ctx.moveTo(x - s, y - s * 0.7); ctx.lineTo(x, y + s * 0.5); ctx.lineTo(x + s, y - s * 0.7); ctx.lineTo(x, y - s * 0.1); ctx.closePath(); fs(col, 2); }

