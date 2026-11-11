// Playwright: the single-file build opened from disk, driven through the
// game-state hook (src/hook.ts). npm run smoke runs only the @boot test.
import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const config = JSON.parse(readFileSync('data/config.json', 'utf8'));
const build = (query: string): string => `${pathToFileURL(resolve('dist-single/index.html')).href}?${query}`;

/** Opens the build and collects every page error and console error. */
async function open(page: Page, query: string): Promise<string[]> {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(build(query));
  // Until the game installs its hook, window.game is the canvas (an element's id is a window
  // property), so wait for the hook itself.
  await expect.poll(() => page.evaluate(() => typeof window.game?.step)).toBe('function');
  return errors;
}

test('boots to the title screen with no errors @boot', async ({ page }) => {
  const errors = await open(page, 'manual=1');
  expect(await page.evaluate(() => window.game!.scene)).toBe('title');
  const size = await page.locator('#game').boundingBox();
  expect(size && size.width > 0 && size.height > 0).toBe(true);
  expect(errors).toEqual([]);
});

test('a scripted run goes from the camp through the map into the first dungeon, and the same seed repeats it exactly', async ({ page }) => {
  // Enter leaves the title, Enter picks the first starter (the camp), Enter opens the map,
  // Enter enters the first dungeon, then a second of walking right.
  // ?manual=1 stops the loop, so only step() moves the game.
  type Run = { scene: string; mode: string; team: string[]; moved: number; state: unknown };
  async function run(): Promise<Run> {
    await open(page, 'manual=1&seed=7');
    return page.evaluate(() => {
      const g = window.game!;
      const st = () => g.state as { mode: string; team: { sp: string }[]; player: { x: number } };
      const modes: string[] = [];
      for (let k = 0; k < 4; k++) { g.press('Enter'); g.step(); modes.push(st().mode); }
      if (modes.join(' ') !== 'starter camp map dungeon') throw new Error('went through ' + modes.join(' '));
      const x0 = st().player.x;
      g.hold('ArrowRight', true); g.step(60); g.hold('ArrowRight', false);
      return { scene: g.scene, mode: st().mode, team: st().team.map(p => p.sp), moved: st().player.x - x0, state: g.state };
    });
  }
  // The game saves in this browser; each run starts with no save, as a first visit does.
  await page.addInitScript(() => { try { localStorage.clear(); } catch { /* no storage */ } });
  const first = await run();
  expect(first.scene).toBe('play');
  expect(first.mode).toBe('dungeon');
  expect(first.team).toEqual(['chispin']);
  expect(first.moved).toBeCloseTo(config.walk_speed.value, 6);
  expect(await run()).toEqual(first);
});

test('can be played with the mouse from the title into the first dungeon, walking by holding the button', async ({ page }) => {
  // Clicks land on what the last frame drew (src/pointer.ts); ?manual=1 so each step() is one frame.
  await page.addInitScript(() => { try { localStorage.clear(); } catch { /* no storage */ } });
  const errors = await open(page, 'manual=1&seed=7');
  const step = (n = 1) => page.evaluate(k => window.game!.step(k), n);
  const st = () => page.evaluate(() => window.game!.state as { mode: string; player: { x: number; y: number } });
  await page.mouse.click(640, 300); await step();     // the title: a tap anywhere starts
  expect((await st()).mode).toBe('starter');
  await page.mouse.click(340, 440); await step();     // the first starter
  expect((await st()).mode).toBe('camp');
  await page.mouse.click(1060, 162); await step();    // Mapa de mazmorras
  expect((await st()).mode).toBe('map');
  await page.mouse.click(330, 400); await step();     // the selected dungeon: a second tap enters
  expect((await st()).mode).toBe('dungeon');
  const before = await st();
  await page.mouse.move(before.player.x + 300, before.player.y - 24);
  await page.mouse.down(); await step(30); await page.mouse.up();
  const after = await st();
  expect(after.player.x - before.player.x).toBeGreaterThan(config.walk_speed.value * 0.4);
  expect(Math.abs(after.player.y - before.player.y)).toBeLessThan(10);
  expect(errors).toEqual([]);
});

test('in a battle turn, a tap on an attack card uses it on the enemy tapped before', async ({ page }, info) => {
  await page.addInitScript(() => { try { localStorage.clear(); } catch { /* no storage */ } });
  const errors = await open(page, 'manual=1&seed=7');
  // Into the first dungeon by keys, then walk into the first wild creature until its battle asks for a move.
  const reached = await page.evaluate(() => {
    const g = window.game!, st = () => g.state as { mode: string; battle: { phase: string } | null };
    for (let k = 0; k < 4; k++) { g.press('Enter'); g.step(); }
    g.hold('ArrowRight', true);
    for (let i = 0; i < 600 && st().mode !== 'battle'; i++) g.step(1, false);
    g.hold('ArrowRight', false);
    for (let i = 0; i < 600 && !(st().battle && st().battle!.phase === 'plan'); i++) g.step(1, false);
    g.step(1); // draw the turn, so the taps land on it
    return st().battle ? st().battle!.phase : st().mode;
  });
  expect(reached).toBe('plan');
  await page.mouse.click(888, 480); await page.evaluate(() => window.game!.step());   // the enemy
  await page.mouse.click(1010, 608); await page.evaluate(() => window.game!.step());  // card 2: Chispazo
  const after = await page.evaluate(() => {
    const b = (window.game!.state as { battle: { phase: string; plans: ({ move: string; target: number } | null)[] } }).battle;
    return { phase: b.phase, plan: b.plans[0] };
  });
  expect(after.phase).toBe('exec');
  expect(after.plan).toEqual({ move: 'chispazo', target: 0 });

  // The ring key row: step until Chispazo's first ring is about to close, then tap the key it shows.
  const key = await page.evaluate(() => {
    const g = window.game!;
    type H = { start: number; impact: number; key: string; judged: boolean };
    const act = () => (g.state as { battle: { act: { side: string; move: string; t: number; hits: H[] } | null } }).battle.act;
    for (let i = 0; i < 600; i++) { const a = act(); if (a && a.side === 'team' && a.move === 'chispazo' && a.t >= a.hits[0].impact - 0.02) break; g.step(1, false); }
    g.step(1);
    return act()!.hits[0].key;
  });
  await page.screenshot({ path: info.outputPath('touch-pad.png') }); // kept with the test's results, for a look
  const padX: Record<string, number> = { A: 330, W: 450, SPC: 640, S: 830, D: 950 };
  await page.mouse.click(padX[key], 673); await page.evaluate(() => window.game!.step());
  const res = await page.evaluate(() => (window.game!.state as { battle: { act: { hits: { res: string }[] } } }).battle.act.hits[0].res);
  expect(['perfect', 'good']).toContain(res);
  expect(errors).toEqual([]);
});

test('the healing song runs down four lanes: a note is hit by its key (A S D F) or by a tap on its lane', async ({ page }, info) => {
  await page.addInitScript(() => { try { localStorage.clear(); } catch { /* no storage */ } });
  const errors = await open(page, 'manual=1&seed=7');
  type Note = { lane: number; at: number; res: string };
  type St = { mode: string; battle: { phase: string; enemies: { hp: number }[] } | null; song: { phase: string; t: number; notes: Note[] } | null };
  // Into the first battle, the wild creature already worn out (a shortcut through the state), and won.
  const mode = await page.evaluate(() => {
    const g = window.game!, st = () => g.state as St;
    for (let k = 0; k < 4; k++) { g.press('Enter'); g.step(); }
    g.hold('ArrowRight', true);
    for (let i = 0; i < 600 && st().mode !== 'battle'; i++) g.step(1, false);
    g.hold('ArrowRight', false);
    for (let i = 0; i < 600 && st().battle!.phase !== 'plan'; i++) g.step(1, false);
    st().battle!.enemies.forEach(e => { e.hp = 0; });
    g.press('Enter'); g.step(1, false);
    for (let i = 0; i < 900 && st().mode !== 'song'; i++) g.step(1, false);
    g.press('Enter'); g.step(1, false);            // the offer: play the song
    return st().mode + ' ' + st().song!.phase;
  });
  expect(mode).toBe('song play');
  // The first note by its key, on the beat.
  const first = await page.evaluate(() => {
    const g = window.game!, S = () => (g.state as St).song!;
    while (S().t < S().notes[0].at - 0.005) g.step(1, false);
    g.press(['KeyA', 'KeyS', 'KeyD', 'KeyF'][S().notes[0].lane]); g.step(1, false);
    return S().notes[0].res;
  });
  expect(['perfect', 'good']).toContain(first);
  // Halfway to the second note: a look at the staff, then a tap on the second note's lane as it lands.
  const lane = await page.evaluate(() => {
    const g = window.game!, S = () => (g.state as St).song!, n = S().notes[1];
    while (S().t < n.at - 0.6) g.step(1, false);
    g.step(1);
    return n.lane;
  });
  await page.screenshot({ path: info.outputPath('song-staff.png') });
  await page.evaluate(() => { const g = window.game!, S = () => (g.state as St).song!; while (S().t < S().notes[1].at - 0.005) g.step(1, false); g.step(1); });
  await page.mouse.click(640 + (lane + 0.5 - 2) * 160, 560); await page.evaluate(() => window.game!.step(1, false));
  expect(['perfect', 'good']).toContain(await page.evaluate(() => (window.game!.state as St).song!.notes[1].res));
  expect(errors).toEqual([]);
});
