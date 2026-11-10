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

test('a scripted run picks a starter and walks it east, and the same seed repeats it exactly', async ({ page }) => {
  // The reference replay's opening: Enter leaves the title, Enter picks the first starter,
  // then a second of walking right. ?manual=1 stops the loop, so only step() moves the game.
  type Run = { scene: string; mode: string; team: string[]; moved: number; state: unknown };
  async function run(): Promise<Run> {
    await open(page, 'manual=1&seed=7');
    return page.evaluate(() => {
      const g = window.game!;
      const st = () => g.state as { mode: string; team: { sp: string }[]; player: { x: number } };
      g.press('Enter'); g.step();
      g.press('Enter'); g.step();
      const x0 = st().player.x;
      g.hold('ArrowRight', true); g.step(60); g.hold('ArrowRight', false);
      return { scene: g.scene, mode: st().mode, team: st().team.map(p => p.sp), moved: st().player.x - x0, state: g.state };
    });
  }
  const first = await run();
  expect(first.scene).toBe('play');
  expect(first.mode).toBe('dungeon');
  expect(first.team).toEqual(['chispin']);
  expect(first.moved).toBeCloseTo(config.walk_speed.value, 6);
  expect(await run()).toEqual(first);
});
