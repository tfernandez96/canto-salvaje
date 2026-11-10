// What is kept between dungeons, and what the map opens. No browser in here, so Vitest runs it.
// Brief: design/game-brief.md (Your systems: map with camp; mixed progress: pets, journal and gear are kept).
import { SPECIES } from './data';
import type { DungeonDef, Pet, RunState } from './types';

/** Bumped when the save's shape changes; an older save is not loaded. */
export const SAVE_VERSION = 1;

/** What a save keeps: the team, the dungeons beaten, the tallies and the tutorial hints seen. */
export interface SaveData {
  v: number; team: Pet[]; cleared: string[]; stats: RunState['stats']; tut: RunState['tut']; uidN: number;
}

/** True when the dungeon can be entered from the map: the first one, or the one after a beaten boss. */
export function isOpen(d: DungeonDef, cleared: string[]): boolean {
  return d.after === null || cleared.includes(d.after);
}

/** The save of a run: a copy, so later play never changes a save already made. */
export function toSave(s: Pick<RunState, 'team' | 'cleared' | 'stats' | 'tut'>, uidN: number): SaveData {
  return JSON.parse(JSON.stringify({ v: SAVE_VERSION, team: s.team, cleared: s.cleared, stats: s.stats, tut: s.tut, uidN }));
}

/** A save read back, or null when it is missing, from another version, or not a team this game knows. */
export function fromSave(raw: unknown): SaveData | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Partial<SaveData>;
  if (d.v !== SAVE_VERSION || !Array.isArray(d.team) || d.team.length === 0) return null;
  const petOk = (p: Pet): boolean => !!p && typeof p.sp === 'string' && !!SPECIES[p.sp]
    && [p.lv, p.hp, p.maxhp, p.uid].every(n => typeof n === 'number' && Number.isFinite(n)) && Array.isArray(p.moves);
  if (!d.team.every(petOk)) return null;
  if (!Array.isArray(d.cleared) || !d.cleared.every(c => typeof c === 'string')) return null;
  if (!d.stats || !d.tut || typeof d.uidN !== 'number') return null;
  return d as SaveData;
}
