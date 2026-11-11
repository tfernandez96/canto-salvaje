# The values' notes

What `prototypes/canto-salvaje/config.js` said beside its values, kept here because `data/config.json`
holds no comments. The values themselves are in `data/config.json`.

- `seed`: every gameplay random call reads rng(), seeded from this (or ?seed= in the address)

---- Dungeon ----
- `walk_speed`: px/s, the trainer walking
- `wild_speed`: px/s, a wild creature drifting toward you
- `wild_chase_radius`: px, how close before it comes at you
- `enemy_level_offset`: levels added to every wild creature and the boss
- `post_battle_heal`: share of max HP back after a win; fainted pets get up with it

---- Timing: your hits ----
- `ring_attack`: s, the ring closing on your hit (moves scale it)
- `hit_gap`: s between the hits of a multi-hit move
- `crit_window`: s each side of impact for PERFECTO
- `good_window`: s each side of impact for Bien
- `crit_mult`: damage x on PERFECTO
- `good_mult`: damage x on Bien
- `weak_mult`: damage x on a late, early or missing press

---- Timing: defense ----
- `ring_defend`: s, the ring closing on an enemy hit (moves scale it)
- `parry_window`: s each side of impact for a PARADA: no damage + counter
- `block_window`: s each side of impact for a Bloqueo
- `block_mult`: damage x on a Bloqueo
- `counter_power`: power of the counter after a parry
- `boss_phase2_speed`: ring time x for the boss's second phase

---- Battle numbers ----
- `dmg_scale`: damage = power * atk/(atk+def) * this
- `type_strong`: Brasa > Brote > Marea > Brasa
- `guard_mult`: damage x under Escudo de Agua / Endurecer
- `heal_share`: share of max HP a heal gives on Bien
- `en_max`: cap of the team's shared energy (the panel draws up to 10)
- `en_start`: shared energy on the first turn of each battle
- `en_regen`: shared energy each new round, flat (free moves add their own on top)
- `en_parry`: shared energy a perfect parry gives, when its roll succeeds
- `parry_config`: default worth of a move's parries: each perfect parry rolls parry_config / hits (boss moves set their own in MOVE_PARRY)

---- Growth ----
- `xp_per_level`: XP a defeated creature gives, times its level
- `xp_need_base`: XP to next level = base + per_level * level
- `evolve_level`: starters evolve once at this level
- `release_xp`: XP x level for letting a convinced creature go when the team is full

---- The healing song ----
- `song_secs_comun`: s a common creature's song lasts at your team's level
- `song_secs_rara`: s for a rare one
- `song_secs_superrara`: s for a super rare one
- `song_secs_legendaria`: s for a legendary one with no length of its own (each legendary sets songSecs in src/game/data.ts)
- `song_secs_per_level`: s added per level the creature is above your team's average (taken off below it)
- `song_secs_min`: the shortest a song gets
- `song_secs_max`: the longest a song gets
- `song_bpm`: beats per minute, common creatures
- `song_bpm_rare_bonus`: extra bpm for rare ones
- `song_bpm_epic_bonus`: extra bpm for super rare and legendary ones (they use the rare half-beat chance)
- `song_half_comun`: chance a gap is half a beat, common
- `song_half_rara`: chance a gap is half a beat, rare
- `song_travel`: s a note takes along the ribbon
- `song_perfect`: s each side for a perfect note
- `song_good`: s each side for a good note
- `song_pass`: share of the song (perfect 1, good 0.6) that convinces
