// PROTOTYPE - NOT FOR PRODUCTION
// Question: ¿Se sostiene una sesión de mazmorra donde la pausa táctica del turno y el timing de golpes, bloqueos y canción se alternan sin cansar?
// Date: 2026-11-10
// Every tuning value lives here, each with value, min, max and step. The game reads them live
// through tune.<name> (index.html); the tweak panel, an add-on, writes them back here.
window.CONFIG = {
  seed: 1, // every gameplay random call reads rng(), seeded from this (or ?seed= in the address)
  volume: { value: 0.5, min: 0, max: 1, step: 0.05 },

  // ---- Dungeon ----
  walk_speed: { value: 230, min: 100, max: 420, step: 10 },          // px/s, the trainer walking
  wild_speed: { value: 70, min: 0, max: 200, step: 5 },              // px/s, a wild creature drifting toward you
  wild_chase_radius: { value: 170, min: 0, max: 400, step: 10 },     // px, how close before it comes at you
  enemy_level_offset: { value: 0, min: -3, max: 5, step: 1 },        // levels added to every wild creature and the boss
  post_battle_heal: { value: 0.3, min: 0, max: 1, step: 0.05 },      // share of max HP back after a win; fainted pets get up with it

  // ---- Timing: your hits ----
  ring_attack: { value: 0.7, min: 0.3, max: 1.5, step: 0.05 },       // s, the ring closing on your hit (moves scale it)
  hit_gap: { value: 0.22, min: 0, max: 1, step: 0.02 },              // s between the hits of a multi-hit move
  crit_window: { value: 0.075, min: 0.02, max: 0.2, step: 0.005 },   // s each side of impact for PERFECTO
  good_window: { value: 0.17, min: 0.05, max: 0.4, step: 0.01 },     // s each side of impact for Bien
  crit_mult: { value: 1.5, min: 1, max: 3, step: 0.05 },             // damage x on PERFECTO
  good_mult: { value: 1.0, min: 0.5, max: 2, step: 0.05 },           // damage x on Bien
  weak_mult: { value: 0.6, min: 0.1, max: 1, step: 0.05 },           // damage x on a late, early or missing press

  // ---- Timing: defense ----
  ring_defend: { value: 0.75, min: 0.3, max: 1.5, step: 0.05 },      // s, the ring closing on an enemy hit (moves scale it)
  parry_window: { value: 0.07, min: 0.02, max: 0.2, step: 0.005 },   // s each side of impact for a PARADA: no damage + counter
  block_window: { value: 0.16, min: 0.05, max: 0.4, step: 0.01 },    // s each side of impact for a Bloqueo
  block_mult: { value: 0.5, min: 0, max: 1, step: 0.05 },            // damage x on a Bloqueo
  counter_power: { value: 6, min: 0, max: 20, step: 1 },             // power of the counter after a parry
  boss_phase2_speed: { value: 0.85, min: 0.5, max: 1, step: 0.05 },  // ring time x for the boss's second phase

  // ---- Battle numbers ----
  dmg_scale: { value: 2.0, min: 0.5, max: 4, step: 0.1 },            // damage = power * atk/(atk+def) * this
  type_strong: { value: 1.5, min: 1, max: 3, step: 0.05 },           // Brasa > Brote > Marea > Brasa
  type_weak: { value: 0.67, min: 0.25, max: 1, step: 0.01 },
  guard_mult: { value: 0.5, min: 0, max: 1, step: 0.05 },            // damage x under Escudo de Agua / Endurecer
  heal_share: { value: 0.35, min: 0.1, max: 1, step: 0.05 },         // share of max HP a heal gives on Bien
  en_max: { value: 10, min: 1, max: 10, step: 1 },                   // cap of the team's shared energy (the panel draws up to 10)
  en_start: { value: 3, min: 0, max: 10, step: 1 },                  // shared energy at the start of each battle
  en_regen: { value: 1, min: 0, max: 5, step: 1 },                   // shared energy each new round, per pet still standing
  en_parry: { value: 1, min: 0, max: 5, step: 1 },                   // shared energy a perfect parry gives

  // ---- Growth ----
  xp_per_level: { value: 6, min: 1, max: 30, step: 1 },              // XP a defeated creature gives, times its level
  xp_need_base: { value: 4, min: 0, max: 50, step: 1 },              // XP to next level = base + per_level * level
  xp_need_per_level: { value: 8, min: 1, max: 50, step: 1 },
  evolve_level: { value: 5, min: 2, max: 20, step: 1 },              // starters evolve once at this level
  boss_level: { value: 7, min: 1, max: 20, step: 1 },
  boss_hp_mult: { value: 2.0, min: 0.5, max: 5, step: 0.1 },
  boss_xp_mult: { value: 3, min: 1, max: 10, step: 1 },
  release_xp: { value: 4, min: 0, max: 30, step: 1 },                // XP x level for letting a convinced creature go when the team is full

  // ---- The healing song ----
  song_base_comun: { value: 6, min: 2, max: 30, step: 1 },           // notes for a common creature at your level
  song_base_rara: { value: 10, min: 2, max: 30, step: 1 },           // notes for a rare creature at your level
  song_per_level: { value: 2, min: 0, max: 6, step: 1 },             // notes added per level it is above your team's average
  song_min: { value: 4, min: 1, max: 20, step: 1 },
  song_max: { value: 24, min: 4, max: 60, step: 1 },
  song_bpm: { value: 104, min: 60, max: 200, step: 2 },              // beats per minute, common creatures
  song_bpm_rare_bonus: { value: 22, min: 0, max: 80, step: 2 },      // extra bpm for rare ones
  song_half_comun: { value: 0.15, min: 0, max: 1, step: 0.05 },      // chance a gap is half a beat, common
  song_half_rara: { value: 0.35, min: 0, max: 1, step: 0.05 },       // chance a gap is half a beat, rare
  song_travel: { value: 1.7, min: 0.6, max: 4, step: 0.1 },          // s a note takes along the ribbon
  song_perfect: { value: 0.06, min: 0.02, max: 0.2, step: 0.005 },   // s each side for a perfect note
  song_good: { value: 0.13, min: 0.04, max: 0.3, step: 0.01 },       // s each side for a good note
  song_pass: { value: 0.7, min: 0.1, max: 1, step: 0.05 },           // share of the song (perfect 1, good 0.6) that convinces
  max_team: { value: 4, min: 1, max: 6, step: 1 },
};
