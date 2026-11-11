// Vitest: the rules in src/game/, run in Node with no browser.
// Brief: design/game-brief.md (Core loop: type loop, levels, parries that give energy).
import { describe, expect, it } from 'vitest';
import config from '../../data/config.json';
import { rng, setSeed } from '../../src/game/rng';
import { calcStats, parryChance, songSeconds, typeMult, xpNeed } from '../../src/game/rules';
import { MOVES, SPECIES } from '../../src/game/data';
import type { Pet } from '../../src/game/types';

/** A pet with only what the rules read; the rest at rest. */
function pet(sp: string, lv: number, boss = false): Pet {
  return {
    uid: 1, sp, lv, xp: 0, type: SPECIES[sp].type, moves: [], hp: 0, maxhp: 0, atk: 0, def: 0, spd: 0, en: 0, last: 0,
    boss, wild: false, guard: false, cyc: 0, phase: 1, warn: false, flash: 0, ghost: 0, faintT: 0, hop: 0,
  };
}

describe('rng', () => {
  it('repeats the same numbers for the same seed', () => {
    setSeed(7); const first = [rng(), rng(), rng()];
    setSeed(7); expect([rng(), rng(), rng()]).toEqual(first);
    expect(first.every(n => n >= 0 && n < 1)).toBe(true);
  });
});

describe('typeMult', () => {
  it('is strong along the loop Brasa > Brote > Marea > Brasa', () => {
    for (const [a, b] of [['brasa', 'brote'], ['brote', 'marea'], ['marea', 'brasa']]) {
      expect(typeMult(a, b)).toBe(config.type_strong.value);
    }
  });
  it('is weak against the loop', () => {
    for (const [a, b] of [['brote', 'brasa'], ['marea', 'brote'], ['brasa', 'marea']]) {
      expect(typeMult(a, b)).toBe(config.type_weak.value);
    }
  });
  it('leaves neutral moves, neutral targets and same-type hits at 1', () => {
    expect(typeMult('neutro', 'brote')).toBe(1);
    expect(typeMult('brasa', 'neutro')).toBe(1);
    expect(typeMult('marea', 'marea')).toBe(1);
  });
});

describe('xpNeed', () => {
  it('grows by xp_need_per_level each level from xp_need_base', () => {
    expect(xpNeed(1)).toBe(config.xp_need_base.value + config.xp_need_per_level.value);
    expect(xpNeed(5) - xpNeed(4)).toBe(config.xp_need_per_level.value);
  });
});

describe('parryChance', () => {
  it('gives a single-hit move with the default parry_config its full worth', () => {
    expect(MOVES.embestida.hits).toBe(1);
    expect(parryChance(MOVES.embestida)).toBe(Math.min(1, config.parry_config.value));
  });
  it('spreads a multi-hit move over its hits', () => {
    const m = MOVES.picotazo;
    expect(parryChance(m)).toBeCloseTo(Math.min(1, config.parry_config.value / m.hits), 10);
  });
  it('makes each of the boss moves worth more per hit than the default', () => {
    for (const id of ['puno_raiz', 'marejada', 'terremoto']) {
      const m = MOVES[id];
      expect(parryChance(m)).toBeGreaterThan(Math.min(1, config.parry_config.value / m.hits));
    }
  });
  it('never goes above certain', () => {
    expect(parryChance({ ...MOVES.embestida, parry: 9 })).toBe(1);
  });
});

describe('calcStats', () => {
  it('adds the species growth for each level past the first', () => {
    const p = pet('chispin', 3), s = SPECIES.chispin;
    calcStats(p);
    expect(p.maxhp).toBe(Math.round(s.base[0] + s.grow[0] * 2));
    expect(p.atk).toBeCloseTo(s.base[1] + s.grow[1] * 2, 10);
  });
  it('multiplies a boss HP by boss_hp_mult', () => {
    const boss = pet('golem', 7, true), plain = pet('golem', 7);
    calcStats(boss); calcStats(plain);
    expect(boss.maxhp).toBe(Math.round(plain.maxhp * config.boss_hp_mult.value));
  });
});

describe('songSeconds', () => {
  it('lasts by rarity at the team\'s own level', () => {
    expect(songSeconds('común', 3, 3)).toBe(config.song_secs_comun.value);
    expect(songSeconds('rara', 3, 3)).toBe(config.song_secs_rara.value);
    expect(songSeconds('superrara', 3, 3)).toBe(config.song_secs_superrara.value);
  });
  it('gives a legendary its own length, or the default when it has none', () => {
    expect(songSeconds('legendaria', 5, 5, 95)).toBe(95);
    expect(songSeconds('legendaria', 5, 5)).toBe(config.song_secs_legendaria.value);
  });
  it('grows with each level above the team and shrinks below, within its bounds', () => {
    expect(songSeconds('rara', 6, 4) - songSeconds('rara', 4, 4)).toBe(2 * config.song_secs_per_level.value);
    expect(songSeconds('común', 1, 40)).toBe(config.song_secs_min.value);
    expect(songSeconds('legendaria', 1, 1, 9999)).toBe(config.song_secs_max.value);
  });
});
