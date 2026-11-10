// The game's rules with no browser in them, so Vitest runs them in Node.

import { tune } from './tuning';
import { rng } from './rng';
import { SPECIES, TYPES } from './data';
import type { Move, Pet } from './types';

export const clamp = (v: number, a: number, b: number): number => Math.max(a, Math.min(b, v));
export const lerp = (a: number, b: number, u: number): number => a + (b - a) * u;
export const ease = (u: number): number => 1 - Math.pow(1 - clamp(u, 0, 1), 3);
export const TAU = Math.PI * 2;
export function hash(a: number, b: number) { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
export function bz(p0: number, p1: number, p2: number, p3: number, t: number) { const u = 1 - t; return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3; }
export function typeMult(mt: string, dt: string) {
  if (mt === 'neutro' || !TYPES[dt] || dt === 'neutro') return 1;
  if (TYPES[mt].beats === dt) return tune.type_strong;
  if (TYPES[dt].beats === mt) return tune.type_weak;
  return 1;
}
export const parryChance = (m: Move): number => Math.min(1, (m.parry != null ? m.parry : tune.parry_config) / Math.max(1, m.hits));
export const xpNeed = (lv: number): number => tune.xp_need_base + tune.xp_need_per_level * lv;
export function calcStats(p: Pet) {
  const s = SPECIES[p.sp], st = s.base.map((b, i) => b + s.grow[i] * (p.lv - 1));
  p.maxhp = Math.round(st[0] * (p.boss ? tune.boss_hp_mult : 1)); p.atk = st[1]; p.def = st[2]; p.spd = st[3];
}
export function calcDmg(a: Pet, d: Pet, m: Move, pow?: number) {
  const base = (pow != null ? pow : m.pow) * (a.atk / (a.atk + d.def)) * tune.dmg_scale;
  return Math.max(1, Math.round(base * typeMult(m.type, d.type) * (0.9 + rng() * 0.2)));
}
