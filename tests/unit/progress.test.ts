// Vitest: what is kept between dungeons, and what the map opens (src/game/progress.ts).
// Brief: design/game-brief.md (map with camp; mixed progress).
import { describe, expect, it } from 'vitest';
import { DUNGEONS, SPECIES } from '../../src/game/data';
import { SAVE_VERSION, fromSave, isOpen, toSave } from '../../src/game/progress';
import type { Pet, RunState } from '../../src/game/types';

/** A starter pet as the game makes one at level 1. */
function pet(uid: number, sp = 'chispin'): Pet {
  const s = SPECIES[sp];
  return {
    uid, sp, lv: 1, xp: 0, type: s.type, moves: ['embestida'], hp: s.base[0], maxhp: s.base[0], atk: s.base[1], def: s.base[2], spd: s.base[3],
    en: 0, last: 0, boss: false, wild: false, guard: false, cyc: 0, phase: 1, warn: false, flash: 0, ghost: s.base[0], faintT: 0, hop: 0,
  };
}
/** The parts of a run a save keeps. */
function run(team: Pet[], cleared: string[] = []): Pick<RunState, 'team' | 'cleared' | 'stats' | 'tut'> {
  return { team, cleared, stats: { time: 12, battles: 3, perfects: 2, parries: 1, tamed: 1, falls: 0, released: 0 }, tut: { plan: true, atk: 3, def: 3, song: true } };
}

describe('isOpen', () => {
  it('opens the first dungeon from the start', () => {
    expect(isOpen(DUNGEONS[0], [])).toBe(true);
  });
  it('keeps the next dungeon closed until the one before it is cleared', () => {
    const next = DUNGEONS.find(d => d.after === DUNGEONS[0].id)!;
    expect(isOpen(next, [])).toBe(false);
    expect(isOpen(next, [DUNGEONS[0].id])).toBe(true);
  });
});

describe('save', () => {
  it('reads back the team, the cleared dungeons and the next uid it was given', () => {
    const saved = fromSave(JSON.parse(JSON.stringify(toSave(run([pet(1), pet(2, 'gotin')], ['fuente']), 3))));
    expect(saved).not.toBeNull();
    expect(saved!.team.map(p => p.sp)).toEqual(['chispin', 'gotin']);
    expect(saved!.cleared).toEqual(['fuente']);
    expect(saved!.uidN).toBe(3);
  });
  it('is a copy: play after saving does not change the save', () => {
    const team = [pet(1)], save = toSave(run(team), 2);
    team[0].lv = 9;
    expect(save.team[0].lv).toBe(1);
  });
  it('refuses a save from another version, an empty team, or a creature this game does not know', () => {
    const good = toSave(run([pet(1)]), 2);
    expect(fromSave({ ...good, v: SAVE_VERSION + 1 })).toBeNull();
    expect(fromSave({ ...good, team: [] })).toBeNull();
    expect(fromSave({ ...good, team: [{ ...pet(1), sp: 'no_such_creature' }] })).toBeNull();
    expect(fromSave(null)).toBeNull();
  });
});
