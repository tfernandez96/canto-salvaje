# Grow: canto-salvaje

From `prototypes/canto-salvaje/` at commit `6cea14b` (first build tag `one-shot/canto-salvaje`, `3ad3617`), into a Vite + TypeScript web project at the project root, 2026-11-10.

| Step | What | Result |
|---|---|---|
| 1 Reference | The one-shot played twice from seed 1 by `replay.args` (title, starter, first battle, tally) | `exact yes` · 0 errors · `reference.png` |
| 2 Copy | Same game as `src/main.js`, values in `data/config.json` | `match yes` · 0 errors · `copy.png` |
| 3 TypeScript | Split into `src/game/` (rng, tuning, data, rules, types: no browser), `screen`, `creatures`, `audio`, `input`, `main`; `tsc --noEmit` clean under `strict` | `match yes` · 0 errors · `typescript.png` |
| 4 Rules under test | Vitest: rng by seed, the type loop, the XP curve, parry odds, stats by level (11). Playwright: boot, and a scripted run that repeats exactly by seed (2). The type-loop test was watched failing on a swapped rule | 13 passed |
| 5 Checks | `npm run build` · `test-run.sh web` · `npm run smoke` | build ok · `web:pass` (13 of 13) · smoke 1 passed |

Seen in: `typescript.png`, beside `reference.png`: the same tally screen, pixel for pixel to the eye.

NOT ASSESSED: nothing.

Still `Loose`: the run state's `battle`, `song`, `tally`, `learn` and `evo` fields (typed where they are read: `Battle`, `Song`, `Tally`; `learn` and `evo` untyped), and the options object of `drawFigure`, `silhouette` and `pop`.

Note for this machine: Vitest must run from a path with a capital drive letter (`E:\Proyectos\new-game`). From `e:\...` it loads itself twice and every suite fails with "Cannot read properties of undefined (reading 'config')".
