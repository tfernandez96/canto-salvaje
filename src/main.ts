// Canto Salvaje: a small dungeon, a team of up to four pets, turn-based battles with timed hits
// and timed blocks, and a healing song that convinces a defeated creature to join you.
// The scenes, the run's state and the loop; the rules, tables, drawing kit, sound and input
// are modules beside it.
import { CONFIG, tune } from './config';
import { params, manual, clock, seedFrom, install } from './hook';
import { rng, setSeed } from './game/rng';
import { clamp, lerp, ease, TAU, hash, bz, typeMult, parryChance, xpNeed, calcStats, calcDmg } from './game/rules';
import { TYPES, MOVES, KEYCAPS, SPECIES, STARTERS, ROOMS, THEMES, DUNGEONS } from './game/data';
import { isOpen, toSave, fromSave, type SaveData } from './game/progress';
import { readSave, writeSave, clearSave } from './save-store';
import type { Action, Battle, DungeonDef, Loose, Move, Pet, PostStep, QueueEntry, RunState, Song, Tally, TallyRow, Theme } from './game/types';
import {
  W, H, FONT, mainCtx, ctx, setCtx, clear, text, txt, INK, GOLD, CRIM, CYAN, B, fs, el, lg, rg, tube, flame,
  pill, panel, typePill, arrowShape, heart, diamond, keycap, chevron,
} from './screen';
import { FIG_W, FIG_H, silhouette, drawFigure } from './creatures';
import { setMuted, muted, tone, seq, sfx } from './audio';
import { down, hit, pressed, tap, held, digit } from './input';

const STEP = 1 / 60;            // simulation step in seconds; motion is per second, never per frame
const TITLE = 'Canto Salvaje';
const CONTROLS = [
  'Flechas o WASD: moverte por la mazmorra',
  'En tu turno: Izquierda/Derecha ataque · Arriba/Abajo objetivo · Enter confirma',
  'Al aparecer cada anillo, su tecla (W, A, S, D o Espacio): púlsala cuando se cierre',
  'Flechas: las notas de la canción sanadora',
  'P: pausa  ·  M: silencio',
];
const CHEAP = params.get('render') === 'cheap'; // a headless shot or check: 3D would draw cheap; players never see it
const events: unknown[] = []; // window.game.events: anything the game wants a run to see

// ---- The run's state -------------------------------------------------------------------
let scene: string, state: RunState, uidN = 1;
function reset() {
  setSeed(seedFrom(CONFIG.seed));
  uidN = 1;
  state = {
    t: 0, score: 0, gained: '', mode: 'starter', pick: 0,
    team: [], room: 0,
    rooms: freshRooms(),
    player: { x: 0, y: 0, face: 1, walk: 0, trail: [] },
    battle: null, song: null, tally: null, post: [], learn: null, evo: null,
    fx: [], toast: '', toastT: 0, fade: 0, inv: 0, shake: 0, fountainT: 0,
    tut: { plan: false, atk: 0, def: 0, song: false },
    stats: { time: 0, battles: 0, perfects: 0, parries: 0, tamed: 0, falls: 0, released: 0 },
    cleared: [], dungeon: DUNGEONS[0].id, campSel: 0, mapSel: 0, opened: null,
  };
  placePlayer(0, ROOMS[0].spawn![0], ROOMS[0].spawn![1]);
}
const T = 64, OX = 0, OY = 8, WH = 26;
/** A dungeon as it is on a fresh entry: every wild group home and alive. */
function freshRooms() {
  return ROOMS.map(R => ({ wilds: R.wilds.map((w, i) => ({ x: w.x * T + OX, y: w.y * T + OY, hx: w.x * T + OX, hy: w.y * T + OY, group: w.group, alive: true, boss: !!w.boss, ph: i * 1.7 })) }));
}
function placePlayer(room: number, tx: number, ty: number) {
  state.room = room; const p = state.player; p.x = tx * T + OX; p.y = ty * T + OY; p.trail = [];
  for (let i = 0; i < 30; i++) p.trail.push([p.x - 1, p.y]);
}
function toast(s: string, d = 3) { state.toast = s; state.toastT = d; }
function pop(textS: string, x: number, y: number, col = '#fff', size = 26, o: Loose = {}) {
  state.fx.push({ k: 'pop', s: textS, x, y, vx: o.vx != null ? o.vx : (rng() - 0.5) * 120, vy: o.vy != null ? o.vy : -260, t: 0, life: o.life || 1.0, col, size, g: o.g != null ? o.g : 520 });
}
function burst(x: number, y: number, col: string, n = 12, sp = 220) {
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU + rng() * 0.3, v = sp * (0.5 + rng() * 0.6); state.fx.push({ k: 'spark', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, t: 0, life: 0.45 + rng() * 0.3, col }); }
}

// ---- Creatures ---------------------------------------------------------------------------
function makePet(sp: string, lv: number, o: Loose = {}) {
  const p: Pet = { uid: uidN++, sp, lv, xp: 0, type: SPECIES[sp].type, moves: [], hp: 0, maxhp: 0, atk: 0, def: 0, spd: 0,
    en: tune.en_start, last: 0, boss: !!o.boss, wild: !!o.wild, guard: false, cyc: 0, phase: 1, warn: false,
    flash: 0, ghost: 0, faintT: 0, hop: 0 };
  const L = SPECIES[sp].learn;
  for (const k of Object.keys(L).map(Number).sort((a, b) => a - b)) if (k <= lv) for (const m of L[k]) p.moves.push(m);
  while (p.moves.length > 4) p.moves.shift();
  calcStats(p); p.hp = p.maxhp; p.ghost = p.hp; return p;
}
const nameOf = (p: Pet): string => SPECIES[p.sp].name;
const alive = (arr: Pet[]): Pet[] => arr.filter(p => p.hp > 0);

// ---- Dungeon -----------------------------------------------------------------------------
function tileAt(room: number, c: number, r: number) { const m = ROOMS[room].map; if (r < 0 || r >= m.length || c < 0 || c >= 20) return '#'; return m[r][c]; }
function roomCleared(i: number) { return state.rooms[i].wilds.every(w => !w.alive); }
function solid(c: number, r: number) {
  const ch = tileAt(state.room, c, r);
  if (ch === '#' || ch === 'P' || ch === '~' || ch === 'f') return true;
  if (ch === 'D') return !roomCleared(state.room);
  return false;
}
function canStand(x: number, y: number) {
  for (const [dx, dy] of [[-13, -9], [13, -9], [-13, 7], [13, 7]]) {
    if (solid(Math.floor((x + dx - OX) / T), Math.floor((y + dy - OY) / T))) return false;
  }
  return true;
}
function fountainPos() { // the fountain lives in room 0
  const m = ROOMS[0].map; for (let r = 0; r < m.length; r++) { const c = m[r].indexOf('f'); if (c >= 0) return [c * T + OX + T / 2, r * T + OY + T / 2]; }
  return [0, 0];
}
function updDungeon(dt: number) {
  const p = state.player;
  state.stats.time += dt;
  if (state.inv > 0) state.inv -= dt;
  let mx = (held('right') ? 1 : 0) - (held('left') ? 1 : 0), my = (held('down') ? 1 : 0) - (held('up') ? 1 : 0);
  if (mx || my) {
    const l = Math.hypot(mx, my), v = tune.walk_speed * dt; mx = mx / l * v; my = my / l * v;
    if (canStand(p.x + mx, p.y)) p.x += mx;
    else if (mx > 0 && tileAt(state.room, Math.floor((p.x + 20 - OX) / T), Math.floor((p.y - OY) / T)) === 'D' && !roomCleared(state.room) && state.toastT <= 0.5) toast('Las zarzas cierran el paso: vence a las criaturas de esta sala.', 2.2);
    if (canStand(p.x, p.y + my)) p.y += my;
    if (mx) p.face = mx > 0 ? 1 : -1;
    p.walk += dt * 12;
    p.trail.unshift([p.x, p.y]); if (p.trail.length > 30) p.trail.pop();
  } else p.walk = 0;
  // doors
  const col = Math.floor((p.x - OX) / T), row = Math.floor((p.y - OY) / T);
  if (p.x > OX + 19.45 * T && tileAt(state.room, 19, row) === 'D' && roomCleared(state.room)) {
    placePlayer(state.room + 1, 1.2, (p.y - OY) / T); state.fade = 0.45; sfx('door');
    if (state.room === ROOMS.length - 1) toast('Algo enorme duerme al fondo de la sala...', 3);
    else toast(ROOMS[state.room].name, 2);
    return;
  }
  if (p.x < OX + 0.55 * T && tileAt(state.room, 0, row) === 'L') {
    if (state.room === 0) { sfx('door'); goCamp('Vuelves al campamento. La mazmorra empieza de cero en la próxima entrada.'); return; }
    placePlayer(state.room - 1, 18.8, (p.y - OY) / T); state.fade = 0.45; sfx('door'); toast(ROOMS[state.room].name, 2); return;
  }
  // fountain
  if (state.room === 0) {
    const [fx, fy] = fountainPos();
    state.fountainT -= dt;
    if (Math.hypot(p.x - fx, p.y - fy) < 92 && state.team.some(q => q.hp < q.maxhp) && state.fountainT <= 0) {
      for (const q of state.team) { q.hp = q.maxhp; q.ghost = q.hp; }
      state.fountainT = 1; sfx('heal'); burst(fx, fy - 20, CYAN, 16); toast('La fuente sana a tu equipo.', 2);
    }
  }
  // wild creatures
  for (const [wi, w] of state.rooms[state.room].wilds.entries()) {
    if (!w.alive) continue;
    const d = Math.hypot(p.x - w.x, p.y - w.y);
    if (!w.boss) {
      if (d < tune.wild_chase_radius && state.inv <= 0) {
        const v = tune.wild_speed * dt, nx = w.x + (p.x - w.x) / d * v, ny = w.y + (p.y - w.y) / d * v;
        if (canStand(nx, w.y)) w.x = nx; if (canStand(w.x, ny)) w.y = ny;
      } else {
        const tx = w.hx + Math.cos(state.t * 0.7 + w.ph) * 34, ty = w.hy + Math.sin(state.t * 0.9 + w.ph) * 18;
        w.x += (tx - w.x) * Math.min(1, dt * 1.5); w.y += (ty - w.y) * Math.min(1, dt * 1.5);
      }
    }
    if (state.inv <= 0 && d < (w.boss ? 110 : 46)) { startBattle(wi); return; }
  }
}

// ---- Battle ------------------------------------------------------------------------------
const TEAM_SLOTS = [[392, 522], [264, 446], [226, 556], [116, 486]];
const FOE_SLOTS = [[888, 522], [1016, 446], [1054, 556]];
const BOSS_SLOT = [968, 566];
const depthScale = (y: number): number => 0.84 + (y - 440) / 120 * 0.2;
function slot(side: string, i: number) {
  const Bt: Battle = state.battle;
  if (side === 'enemy' && Bt && Bt.boss) return BOSS_SLOT;
  return side === 'team' ? TEAM_SLOTS[i] : FOE_SLOTS[i];
}
function unit(side: string, i: number) { return side === 'team' ? state.team[i] : state.battle.enemies[i]; }
function centerOf(side: string, i: number) { const [x, y] = slot(side, i), p = unit(side, i); return [x, y - FIG_H(p.sp) * depthScale(y) * (p.boss ? 0.55 : 0.48)]; }
function groupCenter(side: string) {
  const arr: Pet[] = side === 'team' ? state.team : state.battle.enemies; let sx = 0, sy = 0, n = 0;
  arr.forEach((p, i) => { if (p.hp > 0) { const [x, y] = centerOf(side, i); sx += x; sy += y; n++; } });
  return n ? [sx / n, sy / n] : [640, 400];
}
function startBattle(wi: number) {
  const w = state.rooms[state.room].wilds[wi];
  const enemies = w.group.map(([sp, lv]) => makePet(sp, Math.max(1, (w.boss ? tune.boss_level : lv) + tune.enemy_level_offset), { wild: true, boss: w.boss }));
  state.battle = { phase: 'intro', t: 0, en: tune.en_start, gain: 0, enemies, boss: w.boss, wi, round: 0, cur: 0, sel: 0, tgt: 0, plans: [], queue: [], act: null, strip: [], banner: '', bannerT: 0, warnShown: false, uids: state.team.map(p => p.uid), phase2Said: false };
  for (const p of state.team) { p.en = tune.en_start; p.guard = false; p.flash = 0; p.ghost = p.hp; }
  state.mode = 'battle'; state.stats.battles++; sfx('encounter');
  state.battle.banner = w.boss ? '¡El Gólem Raíz despierta!' : (enemies.length > 1 ? `¡Un grupo de ${enemies.length} criaturas salvajes!` : `¡Un ${nameOf(enemies[0])} salvaje!`);
  state.battle.bannerT = 1.6;
}
function chooseIntent(e: Pet) {
  if (e.boss) {
    const pat = e.phase === 2 ? ['marejada', 'marejada', 'terremoto'] : ['puno_raiz', 'puno_raiz', 'terremoto'];
    const m = pat[e.cyc % 3]; e.warn = (e.cyc % 3) === 1; e.cyc++;
    return { move: m, target: MOVES[m].target === 'all' ? -1 : pickTarget(MOVES[m]) };
  }
  e.warn = false;
  const ms = e.moves.filter(id => MOVES[id].kind === 'hit' || (MOVES[id].kind === 'guard' && e.hp < e.maxhp * 0.5));
  const wts = ms.map(id => (MOVES[id].kind === 'guard' ? 0.6 : (MOVES[id].en >= 2 ? 1.2 : 2)));
  let r = rng() * wts.reduce((a, b) => a + b, 0), m = ms[0];
  for (let i = 0; i < ms.length; i++) { r -= wts[i]; if (r <= 0) { m = ms[i]; break; } }
  return { move: m, target: MOVES[m].target === 'one' ? pickTarget(MOVES[m]) : -1 };
}
function pickTarget(m: Move) {
  const opts = state.team.map((p, i) => i).filter(i => state.team[i].hp > 0);
  if (!opts.length) return 0;
  const strong = opts.filter(i => typeMult(m.type, state.team[i].type) > 1);
  if (strong.length && rng() < 0.55) return strong[Math.floor(rng() * strong.length)];
  return opts[Math.floor(rng() * opts.length)];
}
function speedStrip() {
  const list: { side: string; i: number; spd: number }[] = [];
  state.team.forEach((p, i) => { if (p.hp > 0) list.push({ side: 'team', i, spd: p.spd }); });
  state.battle.enemies.forEach((p: Pet, i: number) => { if (p.hp > 0) list.push({ side: 'enemy', i, spd: p.spd }); });
  list.sort((a, b) => b.spd - a.spd); return list.map(x => ({ side: x.side, i: x.i, done: false }));
}
function newRound() {
  const Bt: Battle = state.battle; Bt.round++;
  for (const p of state.team) p.guard = false;
  if (Bt.round > 1) { // the shared pool: a flat en_regen each new round
    const before = Bt.en; Bt.en = Math.min(tune.en_max, Bt.en + tune.en_regen); Bt.gain = Bt.en - before;
    if (Bt.gain > 0) pop(`+${Bt.gain} energía`, 250, 70, CYAN, 22, { vx: 0, vy: -40, g: 0, life: 1.4 });
  }
  Bt.teamGuard = false;
  Bt.enemies.forEach(e => { e.guard = false; e.intent = e.hp > 0 ? chooseIntent(e) : null; });
  Bt.plans = state.team.map(() => null);
  Bt.cur = state.team.findIndex(p => p.hp > 0);
  Bt.strip = speedStrip(); Bt.phase = 'plan'; Bt.act = null;
  enterPet();
  const boss = Bt.enemies.find(e => e.boss && e.hp > 0);
  if (boss && boss.warn) { sfx('warn'); Bt.banner = '¡El Gólem Raíz carga TERREMOTO para el próximo turno!'; Bt.bannerT = 2.6; }
}
function targetOptions(p: Pet, m: Move) { // sorted top to bottom on screen, so Up and Down move along them
  const Bt: Battle = state.battle, byY = (side: string) => (a: number, b: number) => slot(side, a)[1] - slot(side, b)[1];
  if (m.target === 'one') return Bt.enemies.map((e, i) => i).filter(i => Bt.enemies[i].hp > 0).sort(byY('enemy'));
  if (m.target === 'ally') return state.team.map((q, i) => i).filter(i => state.team[i].hp > 0).sort(byY('team'));
  return [];
}
function reservedEn() { const Bt: Battle = state.battle; return Bt.plans.reduce((s, pl) => s + (pl ? MOVES[pl.move].en : 0), 0); }
function availEn() { return Math.max(0, state.battle.en - reservedEn()); }
function enterPet() {
  const Bt: Battle = state.battle, p = state.team[Bt.cur];
  Bt.sel = clamp(p.last || 0, 0, p.moves.length - 1);
  if (MOVES[p.moves[Bt.sel]].en > availEn()) Bt.sel = p.moves.findIndex(id => MOVES[id].en <= availEn());
  if (Bt.sel < 0) Bt.sel = 0;
  defaultTarget();
}
function defaultTarget() {
  const Bt: Battle = state.battle, p = state.team[Bt.cur], m = MOVES[p.moves[Bt.sel]], opts = targetOptions(p, m);
  if (m.target === 'ally') { let best = opts[0]; for (const i of opts) if (state.team[i].hp / state.team[i].maxhp < state.team[best].hp / state.team[best].maxhp) best = i; Bt.tgt = Math.max(0, opts.indexOf(best)); }
  else if (m.target === 'one') { let bi = 0, bv = -1; opts.forEach((ei, k) => { const v = typeMult(m.type, Bt.enemies[ei].type); if (v > bv) { bv = v; bi = k; } }); Bt.tgt = bi; }
  else Bt.tgt = 0;
}
function updPlan() {
  const Bt: Battle = state.battle, p = state.team[Bt.cur];
  const n = p.moves.length;
  if (tap('left')) { Bt.sel = (Bt.sel + n - 1) % n; defaultTarget(); sfx('select'); }
  if (tap('right')) { Bt.sel = (Bt.sel + 1) % n; defaultTarget(); sfx('select'); }
  const m = MOVES[p.moves[Bt.sel]], opts = targetOptions(p, m);
  if (opts.length > 1) {
    if (tap('up')) { Bt.tgt = (Bt.tgt + opts.length - 1) % opts.length; sfx('select'); }
    if (tap('down')) { Bt.tgt = (Bt.tgt + 1) % opts.length; sfx('select'); }
  }
  const d = digit();
  let confirm = tap('ok');
  if (d >= 0 && d < n) { if (d !== Bt.sel) { Bt.sel = d; defaultTarget(); } confirm = true; }
  if (confirm) {
    let mm = MOVES[p.moves[Bt.sel]], oo = targetOptions(p, mm), moveId = p.moves[Bt.sel];
    if (mm.en > availEn()) {
      if (p.moves.some(id => MOVES[id].en <= availEn())) { sfx('deny'); toast(`No queda energía del equipo para ${mm.name}: libre ${availEn()}, cuesta ${mm.en}.`, 2); return; }
      moveId = 'descanso'; mm = MOVES.descanso; oo = []; toast(`${nameOf(p)} no tiene ataques que pagar y descansa.`, 2);
    }
    Bt.plans[Bt.cur] = { move: moveId, target: oo.length ? oo[clamp(Bt.tgt, 0, oo.length - 1)] : -1 };
    p.last = Bt.sel; sfx('confirm'); state.tut.plan = true;
    let nx = Bt.cur + 1; while (nx < state.team.length && state.team[nx].hp <= 0) nx++;
    if (nx >= state.team.length) startExec(); else { Bt.cur = nx; enterPet(); }
    return;
  }
  if (tap('back')) {
    let pv = Bt.cur - 1; while (pv >= 0 && state.team[pv].hp <= 0) pv--;
    if (pv >= 0) { Bt.plans[Bt.cur] = null; Bt.cur = pv; Bt.plans[pv] = null; enterPet(); sfx('select'); }
  }
}
function startExec() {
  const Bt: Battle = state.battle, list: QueueEntry[] = [];
  state.team.forEach((p, i) => { if (p.hp > 0 && Bt.plans[i]) list.push({ side: 'team', i, move: Bt.plans[i].move, target: Bt.plans[i].target, spd: p.spd }); });
  Bt.enemies.forEach((e, i) => { if (e.hp > 0 && e.intent) list.push({ side: 'enemy', i, move: e.intent.move, target: e.intent.target, spd: e.spd }); });
  for (const a of list) { a.pri = MOVES[a.move].kind === 'guard' ? 1 : 0; a.tie = rng(); }
  list.sort((a, b) => (b.pri! - a.pri!) || (b.spd - a.spd) || (a.tie! - b.tie!));
  Bt.queue = list; Bt.strip = list.map(a => ({ side: a.side, i: a.i, done: false }));
  Bt.phase = 'exec'; Bt.act = null; Bt.stripIdx = -1;
}
function buildAction(q: Loose) {
  const m = MOVES[q.move], Bt = state.battle, actor = unit(q.side, q.i);
  if (m.en && q.side === 'team') Bt.en = Math.max(0, Bt.en - m.en); // spent from the shared pool as it acts
  if (m.gain && q.side === 'team') { // a free move recharges the pool
    const before = Bt.en; Bt.en = Math.min(tune.en_max, Bt.en + m.gain);
    if (Bt.en > before) pop(`+${Bt.en - before} energía`, 250, 70, '#9cff7a', 22, { vx: 0, vy: -40, g: 0, life: 1.3 });
  }
  let target = q.target;
  if (m.target === 'one') {
    const arr: Pet[] = q.side === 'team' ? Bt.enemies : state.team;
    if (!arr[target] || arr[target].hp <= 0) { target = arr.findIndex(p => p.hp > 0); if (q.side === 'enemy' && target >= 0) target = pickTarget(m); }
  }
  if (m.target === 'ally' && (!state.team[target] || state.team[target].hp <= 0)) target = state.team.findIndex(p => p.hp > 0);
  const a: Action = { side: q.side, i: q.i, move: q.move, target, t: 0, hits: [], end: 0, approach: 0.3 };
  let ringT = (q.side === 'team' ? tune.ring_attack : tune.ring_defend) * (m.ring || 1);
  if (actor.boss && actor.phase === 2) ringT *= tune.boss_phase2_speed;
  if (m.kind === 'guard') { a.end = 0.8; a.approach = 0; }
  else {
    if (m.kind === 'heal') a.approach = 0.15;
    let tt = a.approach;
    for (let k = 0; k < m.hits; k++) {
      const start = tt, impact = start + (m.feint ? ringT * 0.5 + 0.38 + ringT * 0.18 : ringT);
      a.hits.push({ start, impact, ringT, feint: !!m.feint, judged: false, res: '', key: m.keys ? m.keys[k % m.keys.length] : 'SPC' });
      tt = impact + tune.hit_gap;
    }
    a.end = a.hits[a.hits.length - 1].impact + Math.max(tune.good_window, tune.block_window) + 0.4;
  }
  Bt.banner = `${nameOf(actor)}${actor.wild && !actor.boss ? ' salvaje' : ''} usa ${m.name}`; Bt.bannerT = 1.2; Bt.bannerCol = TYPES[m.type].col;
  return a;
}
function hurt(p: Pet, side: string, i: number, dmg: number, col: string) {
  p.hp = Math.max(0, p.hp - dmg); p.flash = 1;
  const [x, y] = centerOf(side, i);
  pop(String(dmg), x + (rng() - 0.5) * 30, y - 20, col, dmg >= 20 ? 40 : 30);
  if (p.hp <= 0) { sfx('faint'); p.faintT = 0; pop('¡Debilitado!', x, y - 60, '#ffd0d8', 22, { vy: -80, g: 0, life: 1.4, vx: 0 }); }
}
function judge(a: Loose, h: Loose, res: string) {
  const Bt: Battle = state.battle, m = MOVES[a.move], actor = unit(a.side, a.i);
  h.judged = true; h.res = res;
  const [rx, ry] = ringCenter(a);
  if (a.side === 'team') {
    if (state.tut.atk < 3) state.tut.atk++;
    const mult = res === 'perfect' ? tune.crit_mult : res === 'good' ? tune.good_mult : tune.weak_mult;
    if (res === 'perfect') { sfx('perfect'); state.stats.perfects++; pop('¡PERFECTO!', rx, ry - 70, CYAN, 30, { vx: 0, vy: -90, g: 0, life: 0.8 }); burst(rx, ry, CYAN, 14); state.shake = 0.18; }
    else if (res === 'good') { sfx('good'); pop('Bien', rx, ry - 64, '#e8f8ff', 24, { vx: 0, vy: -80, g: 0, life: 0.7 }); }
    else { sfx('weak'); pop(res === 'early' ? 'Temprano' : res === 'wrong' ? 'Tecla equivocada' : 'Flojo', rx, ry - 64, '#b0a8c0', 22, { vx: 0, vy: -70, g: 0, life: 0.7 }); }
    if (m.kind === 'heal') {
      const q = state.team[a.target]; if (!q || q.hp <= 0) return;
      const amt = Math.round(q.maxhp * tune.heal_share * mult); q.hp = Math.min(q.maxhp, q.hp + amt); q.ghost = q.hp;
      const [x, y] = centerOf('team', a.target); pop('+' + amt, x, y - 20, '#9cff7a', 30); burst(x, y, '#9cff7a', 12); sfx('heal');
      return;
    }
    const targets = m.target === 'all' ? Bt.enemies.map((e, i) => i).filter(i => Bt.enemies[i].hp > 0) : [a.target];
    for (const ti of targets) {
      const e = Bt.enemies[ti]; if (!e || e.hp <= 0) continue;
      let dmg = Math.max(1, Math.round(calcDmg(actor, e, m) * mult * (e.guard ? tune.guard_mult : 1)));
      const tm = typeMult(m.type, e.type);
      hurt(e, 'enemy', ti, dmg, tm > 1 ? '#ffd36b' : '#ffffff');
      const [x, y] = centerOf('enemy', ti);
      if (tm > 1 && h === a.hits[0]) pop('¡Eficaz!', x, y - 90, '#ffd36b', 22, { vx: 0, vy: -60, g: 0, life: 1 });
      if (tm < 1 && h === a.hits[0]) pop('Poco eficaz', x, y - 90, '#b0a8c0', 20, { vx: 0, vy: -60, g: 0, life: 1 });
      if (m.drain) { const hl = Math.round(dmg * m.drain); actor.hp = Math.min(actor.maxhp, actor.hp + hl); }
    }
  } else {
    if (state.tut.def < 3) state.tut.def++;
    const targets = m.target === 'all' ? state.team.map((p, i) => i).filter(i => state.team[i].hp > 0) : [a.target];
    if (res === 'parry') {
      sfx('parry'); state.stats.parries++; burst(rx, ry, '#ffffff', 16, 260); state.shake = 0.12;
      pop('¡PARADA!', rx, ry - 74, '#ffffff', 32, { vx: 0, vy: -90, g: 0, life: 0.8 });
      if (tune.en_parry > 0 && rng() < parryChance(m)) { // this parry is worth energy
        const before = Bt.en; Bt.en = Math.min(tune.en_max, Bt.en + tune.en_parry);
        if (Bt.en > before) {
          pop(`+${Bt.en - before} energía`, rx, ry - 118, CYAN, 28, { vx: 0, vy: -50, g: 0, life: 1.3 });
          pop(`+${Bt.en - before} energía`, 250, 70, CYAN, 22, { vx: 0, vy: -40, g: 0, life: 1.2 });
        }
      }
      if (actor.hp > 0) { // the counter
        const ti = targets[0], q = state.team[ti];
        if (q) { const d = calcDmg(q, actor, MOVES.embestida, tune.counter_power); hurt(actor, 'enemy', a.i, d, '#ffffff'); pop('Contragolpe', centerOf('enemy', a.i)[0], centerOf('enemy', a.i)[1] - 90, '#e8f8ff', 20, { vx: 0, vy: -60, g: 0, life: 0.9 }); }
      }
      return;
    }
    const mult = res === 'block' ? tune.block_mult : 1;
    if (res === 'block') { sfx('block'); pop('Bloqueo', rx, ry - 70, '#d8e8ff', 26, { vx: 0, vy: -80, g: 0, life: 0.7 }); }
    else { sfx('hurt'); state.shake = 0.22; if (res === 'early' || res === 'wrong') pop(res === 'wrong' ? 'Tecla equivocada' : 'Temprano', rx, ry - 70, '#b0a8c0', 22, { vx: 0, vy: -70, g: 0, life: 0.7 }); }
    for (const ti of targets) {
      const q = state.team[ti]; if (!q || q.hp <= 0) continue;
      const g = (Bt.teamGuard ? tune.guard_mult : 1) * (q.guard ? tune.guard_mult : 1);
      const dmg = Math.max(res === 'block' ? 0 : 1, Math.round(calcDmg(actor, q, m) * mult * g));
      hurt(q, 'team', ti, dmg, '#ff8a9a');
    }
  }
}
function ringCenter(a: Loose) {
  const m = MOVES[a.move];
  if (m.kind === 'heal') return centerOf('team', Math.max(0, a.target));
  const victimSide = a.side === 'team' ? 'enemy' : 'team';
  if (m.target === 'all') return groupCenter(victimSide);
  return centerOf(victimSide, Math.max(0, a.target));
}
function updExec(dt: number) {
  const Bt: Battle = state.battle;
  if (!Bt.act) {
    if (checkEnd()) return;
    const q = Bt.queue.shift();
    if (!q) { newRound(); return; }
    Bt.stripIdx++;
    const actor = unit(q.side, q.i);
    if (!actor || actor.hp <= 0) { if (Bt.strip[Bt.stripIdx]) Bt.strip[Bt.stripIdx].done = true; return; }
    Bt.act = buildAction(q);
    const m = MOVES[q.move];
    if (m.kind === 'hit' && m.target === 'one' && Bt.act.target < 0) { Bt.act = null; return; }
  }
  const a = Bt.act, m = MOVES[a.move]; a.t += dt;
  if (m.kind === 'guard') {
    if (!a.applied && a.t > 0.2) {
      a.applied = true; sfx('guard');
      const actor = unit(a.side, a.i);
      if (m.target === 'team' && a.side === 'team') { Bt.teamGuard = true; const [x, y] = groupCenter('team'); pop('Equipo protegido', x, y - 80, '#9fd8ff', 24, { vx: 0, vy: -60, g: 0, life: 1.2 }); burst(x, y, '#9fd8ff', 18); }
      else { actor.guard = true; const [x, y] = centerOf(a.side, a.i); pop('Se protege', x, y - 70, '#d8e8ff', 22, { vx: 0, vy: -60, g: 0, life: 1.2 }); }
    }
  } else {
    const win = a.side === 'team' ? tune.good_window : tune.block_window;
    const kc = KEYCAPS.find(k => k.codes.some(pressed));
    if (kc) {
      const h = a.hits.find(h => !h.judged && a.t >= h.start - 0.05);
      if (h) {
        const d = a.t - h.impact;
        if (kc.id !== h.key) judge(a, h, 'wrong');
        else if (d < -win) judge(a, h, 'early');
        else if (a.side === 'team') judge(a, h, Math.abs(d) <= tune.crit_window ? 'perfect' : 'good');
        else judge(a, h, Math.abs(d) <= tune.parry_window ? 'parry' : 'block');
      }
    }
    for (const h of a.hits) if (!h.judged && a.t > h.impact + win) judge(a, h, a.side === 'team' ? 'weak' : 'hit');
    const victims = a.side === 'team' ? (m.kind === 'heal' ? null : Bt.enemies) : state.team;
    if (victims && victims.every(p => p.hp <= 0)) { // nobody left to hit: drop the remaining rings
      for (const h of a.hits) if (!h.judged) { h.judged = true; h.res = 'skip'; }
      a.end = Math.min(a.end, a.t + 0.45);
    }
  }
  if (a.t >= a.end) {
    if (Bt.strip[Bt.stripIdx]) Bt.strip[Bt.stripIdx].done = true;
    Bt.act = null;
    const boss = Bt.enemies.find(e => e.boss);
    if (boss && boss.hp > 0 && boss.phase === 1 && boss.hp < boss.maxhp * 0.5) {
      boss.phase = 2; boss.type = 'marea'; boss.cyc = 0; boss.flash = 1;
      Bt.banner = '¡El Gólem Raíz se inunda! Ahora es de tipo Marea y golpea más rápido'; Bt.bannerT = 3; sfx('warn');
      Bt.queue = Bt.queue.filter(q => !(q.side === 'enemy' && Bt.enemies[q.i].boss));
    }
  }
}
function checkEnd() {
  const Bt: Battle = state.battle;
  if (Bt.enemies.every(e => e.hp <= 0)) { Bt.phase = 'win'; Bt.t = 0; sfx('fanfare'); return true; }
  if (state.team.every(p => p.hp <= 0)) { Bt.phase = 'lose'; Bt.t = 0; sfx('lose'); return true; }
  return false;
}
function updBattle(dt: number) {
  const Bt: Battle = state.battle; Bt.t += dt; state.stats.time += dt;
  if (Bt.bannerT > 0) Bt.bannerT -= dt;
  for (const p of [...state.team, ...Bt.enemies]) {
    if (p.flash > 0) p.flash = Math.max(0, p.flash - dt * 4);
    if (p.ghost > p.hp) p.ghost = Math.max(p.hp, p.ghost - p.maxhp * dt * 0.8); else p.ghost = p.hp;
    if (p.hp <= 0) p.faintT += dt;
  }
  if (Bt.phase === 'intro') { if (Bt.t > 1.4 || (Bt.t > 0.4 && tap('ok'))) newRound(); return; }
  if (Bt.phase === 'plan') { updPlan(); return; }
  if (Bt.phase === 'exec') { updExec(dt); return; }
  if (Bt.phase === 'win') { if (Bt.t > 1.6 || (Bt.t > 0.6 && tap('ok'))) afterWin(); return; }
  if (Bt.phase === 'lose') { if (Bt.t > 2.6 || (Bt.t > 1 && tap('ok'))) afterLose(); return; }
}
function afterWin() {
  const Bt: Battle = state.battle;
  const w = state.rooms[state.room].wilds[Bt.wi]; w.alive = false;
  if (roomCleared(state.room) && state.room < ROOMS.length - 1) Bt.doorNews = true;
  const cands = Bt.boss ? [] : Bt.enemies.map((e, i) => i);
  if (cands.length) {
    state.song = { phase: 'offer', cands, pick: cands.length - 1, t: 0 };
    let best = 0; cands.forEach((ci, k) => { if (Bt.enemies[ci].lv * (SPECIES[Bt.enemies[ci].sp].rarity === 'rara' ? 2 : 1) > Bt.enemies[cands[best]].lv * (SPECIES[Bt.enemies[cands[best]].sp].rarity === 'rara' ? 2 : 1)) best = k; });
    state.song.pick = best;
    state.mode = 'song';
  } else startTally(0);
}
function afterLose() {
  state.stats.falls++;
  for (const p of state.team) { p.hp = p.maxhp; p.ghost = p.hp; p.en = tune.en_start; p.faintT = 0; }
  state.battle = null; state.mode = 'dungeon'; state.inv = 2; state.fade = 0.8;
  placePlayer(0, ROOMS[0].spawn![0], ROOMS[0].spawn![1]);
  toast('Despiertas junto a la fuente. Tu equipo está curado y no has perdido nada.', 4);
}

// ---- The healing song ------------------------------------------------------------------
const SONG_HX = 930, SONG_X0 = 250;
const LANE_COL = ['#ff8fb8', '#5ff2ff', '#9cff7a', '#ffd36b'];
const LANE_KEYS = [['ArrowLeft', 'KeyA'], ['ArrowDown', 'KeyS'], ['ArrowUp', 'KeyW'], ['ArrowRight', 'KeyD']];
const SCALE = [262, 294, 330, 392, 440, 523, 587, 659, 784, 880];
function teamAvgLv() { return state.team.reduce((s, p) => s + p.lv, 0) / Math.max(1, state.team.length); }
function songLen(e: Pet) {
  const rare = SPECIES[e.sp].rarity === 'rara';
  return clamp(Math.round((rare ? tune.song_base_rara : tune.song_base_comun) + tune.song_per_level * (e.lv - teamAvgLv())), tune.song_min, tune.song_max);
}
function beginSong() {
  const S: Song = state.song, e = state.battle.enemies[S.cands[S.pick]], rare = SPECIES[e.sp].rarity === 'rara';
  const n = songLen(e), beat = 60 / (tune.song_bpm + (rare ? tune.song_bpm_rare_bonus : 0));
  const notes = []; let at = tune.song_travel + 0.9, prev = -1, prev2 = -2;
  for (let k = 0; k < n; k++) {
    let lane = Math.floor(rng() * 4); if (lane === prev && lane === prev2) lane = (lane + 1 + Math.floor(rng() * 3)) % 4;
    const deg = clamp(lane * 2 + (k % 3 === 2 ? 1 : 0) + (k >= n / 2 ? 1 : 0), 0, SCALE.length - 1);
    notes.push({ lane, at, judged: false, res: '', f: SCALE[deg] });
    prev2 = prev; prev = lane;
    at += beat * (rng() < (rare ? tune.song_half_rara : tune.song_half_comun) ? 0.5 : 1);
  }
  Object.assign(S, { phase: 'play', t: 0, e, notes, beat, score: 0, perfect: 0, good: 0, miss: 0, flashL: [0, 0, 0, 0], ticks: 0 });
}
function songJudge(note: Loose, res: string) {
  const S: Song = state.song; note.judged = true; note.res = res;
  const y = laneY(note.lane, SONG_HX);
  if (res === 'perfect') { S.perfect++; S.score += 1; tone(note.f, 0.32, 'triangle', 0.24); tone(note.f * 2, 0.2, 'sine', 0.08); burst(SONG_HX, y, LANE_COL[note.lane], 10, 180); pop('¡Perfecta!', SONG_HX + 70, y, LANE_COL[note.lane], 20, { vx: 40, vy: -30, g: 0, life: 0.6 }); }
  else if (res === 'good') { S.good++; S.score += 0.6; tone(note.f, 0.25, 'triangle', 0.18); burst(SONG_HX, y, LANE_COL[note.lane], 6, 120); pop('Bien', SONG_HX + 60, y, '#e8f8ff', 18, { vx: 40, vy: -30, g: 0, life: 0.5 }); }
  else { S.miss++; tone(note.f * 0.5, 0.18, 'sawtooth', 0.08, 0, 0.8); pop('Falla', SONG_HX + 60, y, '#b0a8c0', 18, { vx: 40, vy: -30, g: 0, life: 0.5 }); }
}
function laneY(l: number, x: number) {
  const S: Song = state.song; const tt = S ? S.t : 0;
  return 262 + l * 56 + Math.sin(x / 150 + tt * 2) * 9 * clamp((SONG_HX - x) / 260, 0, 1);
}
function updSong(dt: number) {
  const S: Song = state.song; S.t += dt;
  if (S.phase === 'offer') {
    if (S.cands.length > 1) {
      if (tap('left')) { S.pick = (S.pick + S.cands.length - 1) % S.cands.length; sfx('select'); }
      if (tap('right')) { S.pick = (S.pick + 1) % S.cands.length; sfx('select'); }
    }
    if (tap('ok')) { beginSong(); sfx('confirm'); }
    else if (tap('back')) { state.song = null; startTally(0); }
    return;
  }
  if (S.phase === 'play') {
    const beat = S.beat;
    while (S.ticks < 4 && S.t > tune.song_travel + 0.9 - (4 - S.ticks) * beat) { tone(S.ticks === 3 ? 880 : 660, 0.05, 'sine', 0.12); S.ticks++; }
    for (let l = 0; l < 4; l++) {
      if (S.flashL[l] > 0) S.flashL[l] -= dt * 5;
      if (LANE_KEYS[l].some(pressed)) {
        S.flashL[l] = 1;
        let best = null, bd = 1e9;
        for (const nt of S.notes) if (!nt.judged && nt.lane === l) { const d = Math.abs(S.t - nt.at); if (d < bd) { bd = d; best = nt; } }
        if (best && bd <= tune.song_good) songJudge(best, bd <= tune.song_perfect ? 'perfect' : 'good');
        else tone(130, 0.08, 'triangle', 0.06);
      }
    }
    for (const nt of S.notes) if (!nt.judged && S.t > nt.at + tune.song_good) songJudge(nt, 'miss');
    const last = S.notes[S.notes.length - 1];
    if (S.notes.every(nt => nt.judged) && S.t > last.at + 0.7) {
      S.ok = S.score / S.notes.length >= tune.song_pass;
      S.phase = 'result'; S.t = 0;
      if (S.ok) { sfx('join'); state.stats.tamed++; state.tut.song = true; }
      else sfx('flee');
    }
    return;
  }
  if (S.phase === 'result') {
    if (S.t > 0.8 && (tap('ok') || S.t > 3.2)) {
      if (!S.ok) { state.song = null; startTally(0); return; }
      if (state.team.length < tune.max_team) { state.team.push(recruit(S.e)); state.song = null; startTally(0); }
      else { S.phase = 'swap'; S.t = 0; }
    }
    return;
  }
  if (S.phase === 'swap') {
    const d = digit();
    if (d >= 0 && d < state.team.length) {
      const old = state.team[d]; state.team[d] = recruit(S.e);
      toast(`${nameOf(old)} se despide y vuelve al bosque. ${nameOf(S.e)} ocupa su lugar.`, 3.5);
      state.song = null; startTally(0);
    } else if (tap('back')) {
      state.stats.released++; const bonus = tune.release_xp * S.e.lv;
      toast(`${nameOf(S.e)} se va en paz y te deja su gratitud: +${bonus} EXP.`, 3);
      state.song = null; startTally(bonus);
    }
  }
}
function recruit(e: Pet) {
  const p = makePet(e.sp, e.lv); p.hp = p.maxhp; p.ghost = p.hp; return p;
}

// ---- Tally, learning, evolution ----------------------------------------------------------
function startTally(bonus: number) {
  const Bt: Battle = state.battle;
  let total = bonus;
  for (const e of Bt.enemies) total += tune.xp_per_level * e.lv * (e.boss ? tune.boss_xp_mult : 1);
  const rows: TallyRow[] = [], post: PostStep[] = [];
  for (const p of state.team) {
    if (!Bt.uids.includes(p.uid)) { rows.push({ uid: p.uid, gain: 0, newbie: true, from: p.lv, to: p.lv, x0: p.xp / xpNeed(p.lv), lines: [] }); continue; }
    const gain = p.hp > 0 ? total : Math.round(total / 2);
    const row = { uid: p.uid, gain, from: p.lv, x0: p.xp / xpNeed(p.lv), lines: [] } as unknown as TallyRow;
    p.xp += gain;
    while (p.xp >= xpNeed(p.lv)) {
      p.xp -= xpNeed(p.lv); const old = { hp: p.maxhp, atk: p.atk, def: p.def };
      p.lv++; calcStats(p); if (p.hp > 0) p.hp += p.maxhp - old.hp;
      row.lines.push(`Nv ${p.lv}: PV +${p.maxhp - old.hp}  ATQ +${Math.round(p.atk - old.atk)}  DEF +${Math.round(p.def - old.def)}`);
      const L = SPECIES[p.sp].learn[p.lv];
      if (L) for (const m of L) { if (p.moves.includes(m)) continue; if (p.moves.length < 4) { p.moves.push(m); row.lines.push(`¡Aprende ${MOVES[m].name}!`); } else post.push({ k: 'learn', uid: p.uid, move: m }); }
      if (SPECIES[p.sp].evo && p.lv >= tune.evolve_level && !post.some(q => q.k === 'evolve' && q.uid === p.uid)) post.push({ k: 'evolve', uid: p.uid });
    }
    row.to = p.lv; row.x1 = p.xp / xpNeed(p.lv); rows.push(row);
  }
  state.tally = { t: 0, rows, total }; state.post = post; state.mode = 'tally';
  if (rows.some(r => r.to > r.from)) sfx('level');
}
function nextPost() {
  const nx = state.post.shift();
  if (!nx) return finishBattle();
  const p = state.team.find(q => q.uid === nx.uid);
  if (!p) return nextPost();
  if (nx.k === 'learn') { state.learn = { uid: nx.uid, move: nx.move, t: 0 }; state.mode = 'learn'; }
  else if (nx.k === 'evolve') { state.evo = { uid: nx.uid, from: p.sp, to: SPECIES[p.sp].evo, t: 0, done: false }; state.mode = 'evolve'; sfx('evolve'); }
}
function finishBattle() {
  const Bt: Battle = state.battle;
  if (Bt && Bt.boss) {
    const dg = DUNGEONS.find(d => d.id === state.dungeon)!;
    state.gained = `¡El ${dg.boss} descansa en paz!`; state.score = state.stats.perfects + state.stats.parries;
    state.opened = null;
    if (!state.cleared.includes(dg.id)) { state.cleared.push(dg.id); const nx = DUNGEONS.find(d => d.after === dg.id); state.opened = nx ? nx.name : null; }
    saveRun();
    state.mode = 'dungeon'; scene = 'results'; state.resultsT = 0; sfx('join'); return;
  }
  for (const p of state.team) {
    const heal = Math.round(p.maxhp * tune.post_battle_heal);
    p.hp = Math.min(p.maxhp, p.hp + heal); p.ghost = p.hp; p.faintT = 0; p.guard = false;
  }
  const news = Bt && Bt.doorNews;
  saveRun();
  state.battle = null; state.tally = null; state.mode = 'dungeon'; state.inv = 1.2; state.fade = 0.35;
  if (news) { toast('Las zarzas se retiran: el camino sigue hacia el este.', 3); sfx('door'); }
}
function updTally(dt: number) {
  const TL: Tally = state.tally; TL.t += dt;
  if (TL.t > 0.4 && tap('ok')) { if (TL.t < 1.6) TL.t = 1.6; else { state.tally = null; nextPost(); } }
}
function updLearn(dt: number) {
  const L = state.learn, p = state.team.find(q => q.uid === L.uid)!; L.t += dt;
  const d = digit();
  if (d >= 0 && d < p.moves.length) {
    const old = p.moves[d]; p.moves[d] = L.move; toast(`${nameOf(p)} olvida ${MOVES[old].name} y aprende ${MOVES[L.move].name}.`, 3); sfx('level');
    state.learn = null; nextPost();
  } else if (tap('back')) { toast(`${nameOf(p)} no aprende ${MOVES[L.move].name}.`, 2); state.learn = null; nextPost(); }
}
function updEvolve(dt: number) {
  const E = state.evo; E.t += dt;
  if (!E.done && E.t > 3.2) {
    const p = state.team.find(q => q.uid === E.uid)!; const ratio = p.hp / p.maxhp;
    p.sp = E.to; calcStats(p); p.hp = Math.max(1, Math.round(p.maxhp * Math.max(ratio, 0.5))); p.ghost = p.hp;
    E.done = true; E.t = 3.2; sfx('join'); burst(640, 380, '#fff3a0', 30, 340);
  }
  if (E.done && E.t > 3.8 && tap('ok')) { state.evo = null; nextPost(); }
}

// ---- Starter pick -----------------------------------------------------------------------
function updStarter() {
  if (tap('left')) { state.pick = (state.pick + 2) % 3; sfx('select'); }
  if (tap('right')) { state.pick = (state.pick + 1) % 3; sfx('select'); }
  const d = digit(); if (d >= 0 && d < 3) state.pick = d;
  if (tap('ok') || (d >= 0 && d < 3)) {
    state.team = [makePet(STARTERS[state.pick], 1)];
    sfx('join'); goCamp('Tu campamento: abre el mapa de mazmorras para elegir adónde ir.');
  }
}

// ---- Camp, map and save ------------------------------------------------------------------
// Brief: design/game-brief.md, Your systems (map with camp, mixed progress) and Build order step 4.
let titleSave: SaveData | null = null, titleSel = 0, titleConfirm = false;
/** Reads the stored save again for the title screen. */
function refreshTitle() { titleSave = fromSave(readSave()); titleSel = 0; titleConfirm = false; }
/** Stores what the run keeps between dungeons; false when the browser refuses. */
function saveRun(): boolean { return writeSave(toSave(state, uidN)); }
/** Puts a save's team, beaten dungeons and tallies into the fresh run. */
function applySave(d: SaveData) { state.team = d.team; state.cleared = d.cleared; state.stats = d.stats; state.tut = d.tut; uidN = d.uidN; }
/** Back at camp: the team fully healed, any battle left behind, and the run saved. */
function goCamp(msg: string) {
  for (const p of state.team) { p.hp = p.maxhp; p.ghost = p.hp; p.faintT = 0; p.guard = false; p.flash = 0; }
  state.battle = null; state.song = null; state.tally = null; state.post = []; state.learn = null; state.evo = null;
  state.mode = 'camp'; state.campSel = 0; state.fade = 0.5; scene = 'play';
  toast(saveRun() ? msg : `${msg} (este navegador no guarda la partida)`, 4);
}
/** A fresh entry into a dungeon, at its first room. */
function enterDungeon(d: DungeonDef) {
  state.dungeon = d.id; state.rooms = freshRooms(); placePlayer(0, ROOMS[0].spawn![0], ROOMS[0].spawn![1]);
  state.mode = 'dungeon'; state.fade = 0.5; state.inv = 1; sfx('door');
  toast(`${d.name}: sal por el oeste de la primera sala para volver al campamento.`, 4.5);
}
const CAMP_OPTIONS = ['Mapa de mazmorras', 'Guardar partida', 'Volver al título'];
function updCamp() {
  const n = CAMP_OPTIONS.length;
  if (tap('up')) { state.campSel = (state.campSel + n - 1) % n; sfx('select'); }
  if (tap('down')) { state.campSel = (state.campSel + 1) % n; sfx('select'); }
  if (!tap('ok')) return;
  sfx('confirm');
  if (state.campSel === 0) {
    state.mode = 'map'; state.toastT = 0;
    state.mapSel = Math.max(0, DUNGEONS.findIndex(d => isOpen(d, state.cleared) && d.built && !state.cleared.includes(d.id)));
  } else if (state.campSel === 1) toast(saveRun() ? 'Partida guardada.' : 'Este navegador no deja guardar la partida.', 2.5);
  else { saveRun(); refreshTitle(); scene = 'title'; }
}
function updMap() {
  const n = DUNGEONS.length;
  if (tap('left')) { state.mapSel = (state.mapSel + n - 1) % n; sfx('select'); }
  if (tap('right')) { state.mapSel = (state.mapSel + 1) % n; sfx('select'); }
  if (tap('back')) { state.mode = 'camp'; sfx('select'); return; }
  if (!tap('ok')) return;
  const d = DUNGEONS[state.mapSel];
  if (!isOpen(d, state.cleared)) { sfx('deny'); toast(lockedLine(d), 3); return; }
  if (!d.built) { sfx('deny'); toast('Próximamente: este camino todavía se está abriendo.', 3); return; }
  enterDungeon(d);
}
/** Why a closed dungeon is closed, in the player's words. */
function lockedLine(d: DungeonDef): string {
  const prev = DUNGEONS.find(x => x.id === d.after)!;
  return `Cerrada: vence al ${prev.boss} de la ${prev.name}.`;
}
function drawCamp() {
  ctx.fillStyle = lg(0, 0, 0, H, ['#0a1224', '#16233a', '#1d2a2a']); ctx.fillRect(0, 0, W, H);
  for (let k = 0; k < 70; k++) { const a = 0.35 + 0.35 * Math.sin(state.t * 1.5 + k); ctx.fillStyle = `rgba(230,240,255,${a})`; ctx.fillRect(hash(k, 3) * W, hash(k, 7) * 300, 2, 2); }
  ctx.save(); ctx.shadowColor = '#fff6dc'; ctx.shadowBlur = 30; B(); ctx.arc(1110, 96, 30, 0, TAU); ctx.fillStyle = '#f4ead0'; ctx.fill(); ctx.restore();
  B(); ctx.arc(1124, 86, 27, 0, TAU); ctx.fillStyle = '#111c32'; ctx.fill();
  ctx.fillStyle = '#132020'; B(); ctx.moveTo(0, 400); for (let x = 0; x <= W; x += 40) ctx.lineTo(x, 330 + Math.sin(x * 0.01) * 26); ctx.lineTo(W, 400); ctx.closePath(); ctx.fill();
  for (let k = 0; k < 24; k++) { const x = k * 58 + hash(k, 11) * 30 - 20, h = 80 + hash(k, 13) * 80, y = 378; B(); ctx.moveTo(x, y - h); ctx.lineTo(x + 24, y); ctx.lineTo(x - 24, y); ctx.closePath(); fs('#0d1914', 2); }
  ctx.fillStyle = lg(0, 370, 0, H, ['#26361f', '#18221a']); ctx.fillRect(0, 370, W, H - 370);
  for (let k = 0; k < 40; k++) { const x = hash(k, 31) * W, y = 400 + hash(k, 37) * 240; ctx.strokeStyle = 'rgba(110,160,70,0.5)'; ctx.lineWidth = 2; B(); ctx.moveTo(x, y); ctx.lineTo(x - 3, y - 9); ctx.moveTo(x, y); ctx.lineTo(x + 4, y - 8); ctx.stroke(); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(640, 530, 10, 640, 530, 380); g.addColorStop(0, 'rgba(255,160,70,0.36)'); g.addColorStop(1, 'rgba(255,160,70,0)'); ctx.fillStyle = g; ctx.fillRect(240, 150, 800, 760);
  ctx.restore();
  // the tent, the fountain, the fire
  B(); ctx.moveTo(130, 530); ctx.lineTo(250, 380); ctx.lineTo(370, 530); ctx.closePath(); fs(lg(130, 0, 370, 0, ['#e0c084', '#a8834a']), 3);
  B(); ctx.moveTo(228, 530); ctx.lineTo(250, 440); ctx.lineTo(274, 530); ctx.closePath(); fs('#2a1c12', 2);
  tube(() => { ctx.moveTo(250, 382); ctx.lineTo(250, 356); }, 3, '#7a5636');
  B(); ctx.moveTo(250, 358); ctx.lineTo(276, 366); ctx.lineTo(250, 374); ctx.closePath(); fs(CRIM, 2);
  drawFountain(1050, 480);
  for (const r of [-0.35, 0.35]) { ctx.save(); ctx.translate(640, 546); ctx.rotate(r); B(); ctx.roundRect(-48, -8, 96, 16, 7); fs('#6a4428', 3); ctx.restore(); }
  for (let k = 0; k < 3; k++) flame(640 + (k - 1) * 14, 540, 640 + (k - 1) * 10, k === 1 ? 452 : 482, 13 - Math.abs(k - 1) * 4, ['#fff3a0', '#ffb030', '#e2452a'], Math.sin(state.t * 10 + k) * 5);
  // the team around the fire, facing it; the trainer plays beside it
  const seats = [[470, 492], [814, 492], [404, 590], [880, 590]];
  state.team.forEach((p, i) => { const [x, y] = seats[i]; drawFigure(p.sp, x, y, clamp(84 / Math.max(FIG_H(p.sp), FIG_W(p.sp) * 0.8), 0.4, 0.95), x < 640 ? 1 : -1, { t: state.t + i * 1.3 }); });
  drawFigure('trainer', 560, 616, 1.15, 1, { t: state.t, play: true });
  panel(10, 10, 450, 72, GOLD, 0.85);
  txt('Campamento', 28, 34, 24, '#fff6dc', 'left', true);
  txt(`Mazmorras superadas: ${state.cleared.length} de ${DUNGEONS.length}  ·  tu equipo descansa y se cura`, 28, 62, 15, '#d8d0e8', 'left');
  panel(880, 120, 380, 214, GOLD, 0.9);
  CAMP_OPTIONS.forEach((o, k) => {
    const y = 162 + k * 52, sel = k === state.campSel;
    if (sel) { B(); ctx.roundRect(896, y - 21, 348, 42, 10); ctx.fillStyle = 'rgba(242,193,78,0.22)'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = GOLD; ctx.stroke(); chevron(918, y - 2, 8, GOLD); }
    txt(o, 938, y, 20, sel ? '#fff6dc' : '#bfb4d0', 'left', true);
  });
  txt('Arriba / Abajo y Enter', 1070, 316, 14, '#9f94b8', 'center');
  drawTeamStrip(652);
}
function mapArch(x: number, y: number) {
  B(); ctx.moveTo(x - 46, y); ctx.lineTo(x - 46, y - 50); ctx.arc(x, y - 50, 46, Math.PI, 0); ctx.lineTo(x + 46, y); ctx.closePath(); fs(lg(x - 46, 0, x + 46, 0, ['#a39e86', '#6e6a5c']), 3);
  B(); ctx.moveTo(x - 26, y); ctx.lineTo(x - 26, y - 46); ctx.arc(x, y - 46, 26, Math.PI, 0); ctx.lineTo(x + 26, y); ctx.closePath(); fs('#1c1426', 2);
  ctx.save(); ctx.shadowColor = CYAN; ctx.shadowBlur = 14; B(); el(x, y - 10, 12, 6); fs(CYAN, 0); ctx.restore();
  tube(() => { ctx.moveTo(x - 40, y - 70); ctx.quadraticCurveTo(x - 20, y - 98, x + 8, y - 92); }, 3, '#4f8a35');
}
function mapForest(x: number, y: number) {
  for (const [dx, h, c] of [[-34, 70, '#3f6b3a'], [30, 80, '#355f33'], [0, 96, '#4a7a40']] as [number, number, string][]) {
    B(); ctx.moveTo(x + dx, y - h); ctx.lineTo(x + dx + 26, y); ctx.lineTo(x + dx - 26, y); ctx.closePath(); fs(c, 3);
  }
  tube(() => { ctx.moveTo(x - 50, y - 6); ctx.bezierCurveTo(x - 20, y - 30, x + 20, y + 4, x + 52, y - 18); }, 4, '#5a2a4a');
  for (let k = 0; k < 5; k++) { const tx = x - 44 + k * 22, ty = y - 14 + (k % 2) * 8; B(); ctx.moveTo(tx, ty); ctx.lineTo(tx + 7, ty - 6); ctx.lineTo(tx + 3, ty + 3); ctx.closePath(); fs('#e6edc0', 1.5); }
}
function padlock(x: number, y: number) {
  B(); ctx.arc(x, y - 8, 12, Math.PI, 0); ctx.lineWidth = 8; ctx.strokeStyle = INK; ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#c0b8a0'; ctx.stroke();
  B(); ctx.roundRect(x - 17, y - 8, 34, 28, 5); fs(lg(0, y - 8, 0, y + 20, ['#e2c050', '#a8862a']), 3);
  B(); el(x, y + 3, 4, 4); fs(INK, 0); ctx.fillStyle = INK; ctx.fillRect(x - 1.5, y + 3, 3, 9);
}
function drawMap() {
  ctx.fillStyle = '#0b0a14'; ctx.fillRect(0, 0, W, H);
  B(); ctx.roundRect(70, 30, 1140, 572, 18); fs(lg(0, 30, 0, 602, ['#efdfb2', '#d9bf86', '#c9a86a']), 4);
  B(); ctx.roundRect(88, 48, 1104, 536, 12); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(90,60,30,0.5)'; ctx.stroke();
  txt('Mapa de mazmorras', 640, 84, 32, '#3a2414', 'center', true, false);
  ctx.save(); B(); ctx.roundRect(88, 48, 1104, 536, 12); ctx.clip(); // the scenery stays on the parchment
  for (let k = 0; k < 7; k++) { B(); el(160 + k * 160, 540 - hash(k, 5) * 40, 96, 34); ctx.fillStyle = 'rgba(120,140,80,0.32)'; ctx.fill(); }
  ctx.strokeStyle = 'rgba(70,130,170,0.6)'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  B(); ctx.moveTo(640, 120); ctx.bezierCurveTo(560, 250, 720, 380, 620, 580); ctx.stroke();
  for (let k = 0; k < 16; k++) {
    const x = 130 + hash(k, 21) * 1020, y = 140 + hash(k, 23) * 420;
    if (Math.abs(x - 640) < 90 || DUNGEONS.some(d => Math.hypot(d.x - x, d.y - y) < 130)) continue;
    B(); ctx.moveTo(x, y - 18); ctx.lineTo(x + 9, y); ctx.lineTo(x - 9, y); ctx.closePath(); fs('rgba(70,100,60,0.55)', 0);
  }
  ctx.restore();
  ctx.save(); ctx.setLineDash([14, 12]); ctx.lineWidth = 5; ctx.strokeStyle = '#7a5230';
  for (let i = 1; i < DUNGEONS.length; i++) { const a = DUNGEONS[i - 1], b = DUNGEONS[i]; B(); ctx.moveTo(a.x, a.y + 20); ctx.bezierCurveTo((a.x + b.x) / 2, a.y + 140, (a.x + b.x) / 2, b.y - 100, b.x, b.y + 20); ctx.stroke(); }
  ctx.restore();
  DUNGEONS.forEach((d, i) => {
    const open = isOpen(d, state.cleared), sel = i === state.mapSel, done = state.cleared.includes(d.id);
    B(); el(d.x, d.y + 30, 78, 22); ctx.fillStyle = sel ? 'rgba(242,193,78,0.55)' : 'rgba(90,60,30,0.22)'; ctx.fill();
    if (sel) { ctx.lineWidth = 4; ctx.strokeStyle = '#b07a1a'; ctx.stroke(); }
    ctx.save(); if (!open) ctx.globalAlpha = 0.45;
    if (d.icon === 'arch') mapArch(d.x, d.y + 30); else mapForest(d.x, d.y + 30);
    ctx.restore();
    if (!open) padlock(d.x, d.y - 4);
    if (done) { tube(() => { ctx.moveTo(d.x + 52, d.y + 26); ctx.lineTo(d.x + 52, d.y - 40); }, 3, '#5a3a1a'); B(); ctx.moveTo(d.x + 54, d.y - 40); ctx.lineTo(d.x + 84, d.y - 30); ctx.lineTo(d.x + 54, d.y - 20); ctx.closePath(); fs(GOLD, 2); }
    txt(d.name, d.x, d.y + 72, 20, '#3a2414', 'center', true, false);
    const status = done ? 'Superada' : !open ? 'Cerrada' : !d.built ? 'Próximamente' : 'Abierta';
    txt(status, d.x, d.y + 96, 16, done ? '#2f6b2a' : !open ? '#8a2a1a' : '#5a3a1a', 'center', true, false);
    if (sel) chevron(d.x, d.y - 100 + Math.sin(state.t * 5) * 5, 14, GOLD);
  });
  const d = DUNGEONS[state.mapSel], open = isOpen(d, state.cleared);
  panel(70, 612, 1140, 98, GOLD, 0.92);
  txt(d.name, 96, 638, 22, '#fff6dc', 'left', true);
  txt(!open ? lockedLine(d) : !d.built ? 'Próximamente: este camino todavía se está abriendo.' : d.desc, 96, 666, 16, '#e8e0f0', 'left');
  txt('Izquierda / Derecha: elegir   ·   Enter: entrar   ·   Retroceso: volver al campamento', 96, 692, 14, '#bfb4d0', 'left');
}

// ---- Drawing: dungeon --------------------------------------------------------------------
function drawFloorTile(c: number, r: number, ch: string, th: Theme) {
  const x = OX + c * T, y = OY + r * T, h = hash(c + state.room * 31, r);
  if (ch === '~') {
    ctx.fillStyle = '#16344a'; ctx.fillRect(x, y, T, T);
    ctx.strokeStyle = 'rgba(120,210,255,0.35)'; ctx.lineWidth = 2;
    for (let k = 0; k < 2; k++) { const yy = y + 16 + k * 28 + Math.sin(state.t * 2 + c + k) * 3; B(); ctx.moveTo(x + 8, yy); ctx.quadraticCurveTo(x + 32, yy - 6, x + 56, yy); ctx.stroke(); }
    return;
  }
  const cols = ['#4b5d5a', '#526460', '#47585a', '#4f5f56'];
  ctx.fillStyle = cols[Math.floor(h * 4)]; ctx.fillRect(x, y, T, T);
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.fillRect(x + 2, y + 2, T - 4, 3);
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.fillRect(x, y + T - 3, T, 3); ctx.fillRect(x + T - 3, y, 3, T);
  if (h > 0.7) { ctx.strokeStyle = 'rgba(20,24,30,0.35)'; ctx.lineWidth = 1.5; B(); ctx.moveTo(x + 14, y + 20); ctx.lineTo(x + 26, y + 30); ctx.lineTo(x + 22, y + 44); ctx.stroke(); }
  if (ch === ',') { for (let k = 0; k < 4; k++) { B(); el(x + 12 + hash(c, r + k) * 40, y + 12 + hash(r, c + k) * 40, 10 + k * 2, 6 + k); ctx.fillStyle = k % 2 ? 'rgba(110,170,70,0.55)' : 'rgba(80,140,60,0.5)'; ctx.fill(); } }
  if (ch === 'g') {
    ctx.strokeStyle = '#7cbf4a'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let k = 0; k < 6; k++) { const gx = x + 8 + k * 9, gy = y + 50 - (k % 2) * 14, sw = Math.sin(state.t * 2 + k + c) * 3; B(); ctx.moveTo(gx, gy); ctx.quadraticCurveTo(gx + sw, gy - 12, gx + sw * 2, gy - 22); ctx.stroke(); }
  }
  if (ch === 'D' || ch === 'L') { ctx.fillStyle = lg(ch === 'D' ? x : x + T, 0, ch === 'D' ? x + T : x, 0, ['rgba(0,0,0,0)', 'rgba(5,4,12,0.85)']); ctx.fillRect(x, y, T, T); }
}
function drawWallTile(c: number, r: number, th: Theme) {
  const x = OX + c * T, y = OY + r * T;
  const below = tileAt(state.room, c, r + 1);
  ctx.fillStyle = lg(0, y - WH, 0, y - WH + T, ['#6a7773', '#55625e']); ctx.fillRect(x, y - WH, T, T);
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(x, y - WH, T, 4);
  if (hash(c, r + 9) > 0.6) { ctx.fillStyle = 'rgba(95,150,60,0.55)'; B(); el(x + 20 + hash(c, r) * 24, y - WH + 10, 14, 6); ctx.fill(); }
  if (below !== '#') {
    ctx.fillStyle = '#3a4541'; ctx.fillRect(x, y + T - WH, T, WH);
    ctx.strokeStyle = 'rgba(20,24,28,0.6)'; ctx.lineWidth = 1.5;
    B(); ctx.moveTo(x, y + T - WH / 2); ctx.lineTo(x + T, y + T - WH / 2);
    const o = (r % 2) * 16; ctx.moveTo(x + 16 + o, y + T - WH); ctx.lineTo(x + 16 + o, y + T - WH / 2); ctx.moveTo(x + 48 - o, y + T - WH / 2); ctx.lineTo(x + 48 - o, y + T); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y + T, T, 8);
  }
}
function drawDoorVines(c: number, r: number) {
  const x = OX + c * T, y = OY + r * T;
  tube(() => { for (let k = 0; k < 3; k++) { ctx.moveTo(x + 10 + k * 18, y - 6); ctx.bezierCurveTo(x + 30 - k * 8, y + 20, x + k * 20, y + 40, x + 14 + k * 16, y + T); } }, 6, '#3f6b2f');
  for (let k = 0; k < 7; k++) { const tx = x + 8 + hash(c, k + r) * 48, ty = y + 6 + hash(k, r + c) * 52; B(); ctx.moveTo(tx, ty); ctx.lineTo(tx + 9, ty - 4); ctx.lineTo(tx + 2, ty + 4); ctx.closePath(); fs('#e6edc0', 1.5); }
}
function drawPillar(c: number, r: number) {
  const cx = OX + c * T + T / 2, base = OY + r * T + T * 0.8;
  B(); el(cx, base, 28, 10); ctx.fillStyle = 'rgba(5,4,12,0.45)'; ctx.fill();
  B(); ctx.rect(cx - 21, base - 100, 42, 100); fs(lg(cx - 21, 0, cx + 21, 0, ['#9aa59e', '#6d7873', '#3e4744']));
  B(); ctx.roundRect(cx - 27, base - 112, 54, 16, 4); fs('#8a958f');
  B(); ctx.roundRect(cx - 26, base - 10, 52, 12, 4); fs('#6d7873');
  tube(() => { ctx.moveTo(cx - 18, base - 90); ctx.bezierCurveTo(cx + 10, base - 70, cx - 20, base - 40, cx + 14, base - 14); }, 4, '#4f8a35');
  B(); el(cx - 4, base - 66, 7, 4, 0.5); fs('#6fbe46', 1.5);
}
function drawFountain(cx: number, cy: number) {
  B(); el(cx, cy + 22, 44, 14); ctx.fillStyle = 'rgba(5,4,12,0.4)'; ctx.fill();
  B(); el(cx, cy + 4, 40, 18); fs('#8a958f');
  ctx.fillStyle = '#5d6863'; ctx.fillRect(cx - 40, cy + 4, 80, 16); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(cx - 40, cy + 4, 80, 16);
  B(); el(cx, cy + 20, 40, 10); ctx.fillStyle = '#5d6863'; ctx.fill(); ctx.stroke();
  ctx.save(); ctx.shadowColor = CYAN; ctx.shadowBlur = 18; B(); el(cx, cy + 4, 32, 12); fs(rg(cx, cy + 4, 34, '#bff8ff', '#2a8cb8'), 0); ctx.restore();
  B(); ctx.rect(cx - 6, cy - 30, 12, 34); fs('#9aa59e', 2.5);
  B(); el(cx, cy - 32, 12, 5); fs('#b0bab4', 2.5);
  ctx.strokeStyle = 'rgba(190,250,255,0.85)'; ctx.lineWidth = 3;
  for (const s of [-1, 1]) { B(); ctx.moveTo(cx, cy - 34); ctx.quadraticCurveTo(cx + s * 22, cy - 46 + Math.sin(state.t * 6) * 2, cx + s * 26, cy); ctx.stroke(); }
}
function drawTorch(x: number, y: number) {
  B(); ctx.rect(x - 4, y, 8, 18); fs('#5a3e26', 2);
  flame(x, y + 2, x, y - 22, 6, ['#fff3a0', '#ffb030', '#e2452a'], Math.sin(state.t * 12 + x) * 2);
}
function dungeonSprites() {
  const list = [], p = state.player;
  list.push({ y: p.y, f: () => drawFigure('trainer', p.x, p.y, 0.9, p.face, { walk: p.walk, t: state.t, side: null }) });
  if (state.team[0]) {
    const tr = p.trail[Math.min(p.trail.length - 1, 18)] || [p.x, p.y], lead = state.team[0];
    const s = clamp(52 / FIG_H(lead.sp), 0.32, 0.6);
    list.push({ y: tr[1] - 2, f: () => drawFigure(lead.sp, tr[0] - p.face * 4, tr[1] - 2, s, p.x >= tr[0] ? 1 : -1, { t: state.t }) });
  }
  for (const w of state.rooms[state.room].wilds) {
    if (!w.alive) continue;
    w.group.forEach(([sp], k) => {
      const ox = k === 0 ? 0 : (k === 1 ? 34 : -30), oy = k === 0 ? 0 : (k === 1 ? -16 : -20);
      const s = w.boss ? 0.42 : clamp(56 / FIG_H(sp), 0.36, 0.62);
      const face = state.player.x < w.x ? -1 : 1;
      list.push({ y: w.y + oy, f: () => drawFigure(sp, w.x + ox, w.y + oy, s, face, { t: state.t + k + w.ph, side: 'enemy', phase: 1 }) });
    });
  }
  return list;
}
function drawDungeon() {
  const R = ROOMS[state.room], th = THEMES[R.theme], m = R.map;
  clear('#0b0a14');
  for (let r = 0; r < m.length; r++) for (let c = 0; c < 20; c++) if (m[r][c] !== '#') drawFloorTile(c, r, m[r][c], th);
  const sprites = dungeonSprites();
  let fpos = null; if (state.room === 0) fpos = fountainPos();
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < 20; c++) { const ch = m[r][c]; if (ch === '#') drawWallTile(c, r, th); }
    if (r === 0) for (const tc of R.torches) drawTorch(OX + tc * T + T / 2, OY + T - WH - 6);
    for (let c = 0; c < 20; c++) { const ch = m[r][c]; if (ch === 'P') drawPillar(c, r); if (ch === 'D' && !roomCleared(state.room)) drawDoorVines(c, r); }
    if (fpos && Math.floor((fpos[1] - OY) / T) === r) drawFountain(fpos[0], fpos[1]);
    const top = OY + r * T, bot = top + T;
    for (const s of sprites) if (s.y >= top && s.y < bot) s.f();
  }
  for (const s of sprites) if (s.y < OY || s.y >= OY + m.length * T) s.f();
  // light: a cool dark wash, then warm pools from the torches and a cyan pool from the fountain
  ctx.fillStyle = 'rgba(10,12,30,0.32)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const tc of R.torches) { const x = OX + tc * T + T / 2, y = OY + T; const g = ctx.createRadialGradient(x, y, 4, x, y, 210); g.addColorStop(0, 'rgba(255,170,90,0.32)'); g.addColorStop(1, 'rgba(255,170,90,0)'); ctx.fillStyle = g; ctx.fillRect(x - 210, y - 210, 420, 420); }
  if (fpos) { const g = ctx.createRadialGradient(fpos[0], fpos[1], 4, fpos[0], fpos[1], 160); g.addColorStop(0, 'rgba(95,242,255,0.28)'); g.addColorStop(1, 'rgba(95,242,255,0)'); ctx.fillStyle = g; ctx.fillRect(fpos[0] - 160, fpos[1] - 160, 320, 320); }
  { const p = state.player, g = ctx.createRadialGradient(p.x, p.y - 30, 4, p.x, p.y - 30, 130); g.addColorStop(0, 'rgba(255,220,160,0.16)'); g.addColorStop(1, 'rgba(255,220,160,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - 130, p.y - 160, 260, 260); }
  if (state.room === ROOMS.length - 1) { const w = state.rooms[state.room].wilds[0]; if (w.alive) { const g = ctx.createRadialGradient(w.x, w.y - 50, 4, w.x, w.y - 50, 200); g.addColorStop(0, 'rgba(224,49,91,0.25)'); g.addColorStop(1, 'rgba(224,49,91,0)'); ctx.fillStyle = g; ctx.fillRect(w.x - 200, w.y - 250, 400, 400); } }
  ctx.restore();
  const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  // HUD
  panel(10, 10, 360, 40, GOLD, 0.8);
  txt(`Sala ${state.room + 1} de ${ROOMS.length} · ${R.name}`, 24, 30, 17, '#f4ead0', 'left', true);
  const obj = state.room === ROOMS.length - 1 ? 'Vence al Guardián de la mazmorra' : roomCleared(state.room) ? 'Camino libre: sigue hacia el este' : 'Vence a las criaturas para abrir las zarzas';
  ctx.font = `700 16px ${FONT}`; const ow = ctx.measureText(obj).width + 30;
  panel(W - 10 - ow, 10, ow, 40, roomCleared(state.room) && state.room < ROOMS.length - 1 ? '#9cff7a' : CRIM, 0.8);
  txt(obj, W - 10 - ow / 2, 30, 16, '#f4ead0', 'center', true);
  drawTeamStrip(652);
}
function drawTeamStrip(y: number) {
  ctx.fillStyle = 'rgba(10,9,20,0.92)'; ctx.fillRect(0, y - 4, W, H - y + 4);
  ctx.fillStyle = GOLD; ctx.fillRect(0, y - 4, W, 2);
  state.team.forEach((p, i) => {
    const x = 12 + i * 316;
    panel(x, y + 2, 304, 60, p.hp > 0 ? 'rgba(242,193,78,0.6)' : 'rgba(150,140,160,0.5)', 0.9);
    const s = clamp(48 / Math.max(FIG_H(p.sp), FIG_W(p.sp) * 0.8), 0.22, 0.6);
    ctx.save(); B(); ctx.roundRect(x + 6, y + 6, 54, 52, 8); ctx.fillStyle = '#26314a'; ctx.fill(); ctx.clip();
    drawFigure(p.sp, x + 33, y + 54, s, 1, { t: state.t, noShadow: true, alpha: p.hp > 0 ? 1 : 0.4 }); ctx.restore();
    txt(`${nameOf(p)}`, x + 70, y + 18, 16, '#fff', 'left', true);
    txt(`Nv ${p.lv}`, x + 296, y + 18, 15, GOLD, 'right', true);
    typePill(p.type, x + 186, y + 18, 12);
    hpBar(x + 70, y + 32, 160, 10, p);
    txt(`${p.hp}/${p.maxhp}`, x + 296, y + 37, 14, '#e8e0f0', 'right');
    const xr = clamp(p.xp / xpNeed(p.lv), 0, 1);
    ctx.fillStyle = '#2a2440'; ctx.fillRect(x + 70, y + 48, 160, 4); ctx.fillStyle = '#7fc8ff'; ctx.fillRect(x + 70, y + 48, 160 * xr, 4);
  });
}
function hpBar(x: number, y: number, w: number, h: number, p: Pet) {
  ctx.fillStyle = '#1a1424'; B(); ctx.roundRect(x - 2, y - 2, w + 4, h + 4, 4); ctx.fill();
  const r = clamp(p.hp / p.maxhp, 0, 1), g = clamp(p.ghost / p.maxhp, 0, 1);
  ctx.fillStyle = '#ffe0e8'; ctx.fillRect(x, y, w * g, h);
  ctx.fillStyle = r > 0.5 ? '#5fd36a' : r > 0.25 ? '#f2c14e' : '#ff4d6a'; ctx.fillRect(x, y, w * r, h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(x, y, w * r, h * 0.35);
}

// ---- Drawing: battle ---------------------------------------------------------------------
function drawArena(th: Theme) {
  ctx.fillStyle = lg(0, 0, 0, 330, [th.wallBot, th.wallTop, th.wallBot]); ctx.fillRect(0, 0, W, 340);
  for (let i = 0; i < 6; i++) {
    const x = -60 + i * 250;
    B(); ctx.moveTo(x + 30, 340); ctx.lineTo(x + 30, 190); ctx.arc(x + 110, 190, 80, Math.PI, 0); ctx.lineTo(x + 190, 340); ctx.closePath();
    ctx.fillStyle = 'rgba(5,4,14,0.55)'; ctx.fill(); ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255,255,255,0.07)'; ctx.stroke();
    ctx.fillStyle = lg(x + 200, 0, x + 240, 0, ['rgba(160,175,170,0.35)', 'rgba(60,70,70,0.35)']); ctx.fillRect(x + 200, 70, 40, 270);
    drawTorch(x + 220, 150);
    const g = ctx.createRadialGradient(x + 220, 140, 4, x + 220, 140, 120); g.addColorStop(0, 'rgba(255,170,90,0.3)'); g.addColorStop(1, 'rgba(255,170,90,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(x + 100, 20, 240, 240); ctx.restore();
  }
  ctx.fillStyle = lg(0, 330, 0, H, [th.floorFar, th.floorNear]); ctx.fillRect(0, 330, W, H - 330);
  ctx.save(); B(); ctx.rect(0, 330, W, H - 330); ctx.clip();
  ctx.strokeStyle = 'rgba(15,18,28,0.35)'; ctx.lineWidth = 2;
  for (let k = 1; k < 10; k++) { const y = 330 + (H - 330) * Math.pow(k / 10, 1.7); B(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  for (let k = -6; k <= 14; k++) { B(); ctx.moveTo(640 + (k - 4) * 40, 330); ctx.lineTo(640 + (k - 4) * 190, H); ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = lg(0, 320, 0, 380, ['rgba(10,10,24,0.6)', 'rgba(10,10,24,0)']); ctx.fillRect(0, 320, W, 60);
  ctx.save(); ctx.globalAlpha = 0.5; ctx.strokeStyle = th.accent; ctx.lineWidth = 2;
  for (const [cx, cy] of [[300, 510], [960, 510]]) { B(); el(cx, cy, 230, 70); ctx.stroke(); B(); el(cx, cy, 200, 58); ctx.setLineDash([10, 12]); ctx.stroke(); ctx.setLineDash([]); }
  ctx.restore();
}
function dashOffset(side: string, i: number) {
  const Bt: Battle = state.battle, a = Bt && Bt.act;
  if (!a || a.side !== side || a.i !== i) return [0, 0];
  const m = MOVES[a.move]; if (m.kind === 'guard') return [0, -Math.sin(clamp(a.t / 0.8, 0, 1) * Math.PI) * 14];
  if (m.kind === 'heal') return [0, -Math.sin(clamp(a.t / a.end, 0, 1) * Math.PI) * 10];
  const [sx, sy] = slot(side, i), [tx, ty] = ringCenter(a);
  const lastImp = a.hits[a.hits.length - 1].impact;
  let u = a.t < a.approach ? ease(a.t / a.approach) : a.t < lastImp + 0.15 ? 1 : 1 - ease((a.t - lastImp - 0.15) / Math.max(0.05, a.end - lastImp - 0.15));
  const reach = m.target === 'all' ? 0.3 : 0.55;
  let lunge = 0; for (const h of a.hits) { const d = a.t - h.impact; if (d > -0.08 && d < 0.12) lunge = Math.max(lunge, 1 - Math.abs(d) / 0.12); }
  return [(tx - sx) * reach * u + (tx > sx ? 1 : -1) * lunge * 26, (ty + 60 - sy) * 0.25 * u];
}
function drawUnit(side: string, i: number) {
  const p = unit(side, i); if (!p) return;
  if (p.hp <= 0 && side === 'enemy' && p.faintT > 0.9) return;
  const [bx, by] = slot(side, i), [dx, dy] = dashOffset(side, i);
  const s = p.boss ? 1.0 : depthScale(by) * 1.05;
  const shake = p.flash > 0 ? Math.sin(state.t * 90) * 5 * p.flash : 0;
  const fallen = p.hp <= 0;
  drawFigure(p.sp, bx + dx + shake, by + dy, s, side === 'team' ? 1 : -1, {
    t: state.t + i * 1.3, side, phase: p.phase, flash: p.flash, flashCol: '#ffffff',
    alpha: fallen ? (side === 'enemy' ? 1 - p.faintT / 0.9 : 0.45) : 1, rot: fallen && side === 'team' ? 0.25 : 0,
  });
  if (p.guard || (side === 'team' && state.battle.teamGuard && p.hp > 0)) {
    const [cx, cy] = centerOf(side, i);
    ctx.save(); ctx.globalAlpha = 0.35 + Math.sin(state.t * 4) * 0.1; B(); el(cx + dx, cy + dy, FIG_W(p.sp) * s * 0.6, FIG_H(p.sp) * s * 0.6);
    ctx.fillStyle = 'rgba(120,200,255,0.25)'; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#9fd8ff'; ctx.stroke(); ctx.restore();
  }
}
function drawUnitBars(side: string, i: number) {
  const p = unit(side, i); if (!p || (p.hp <= 0 && side === 'enemy')) return;
  if (p.boss) return;
  const [bx, by] = slot(side, i), s = depthScale(by) * 1.05;
  const top = by - FIG_H(p.sp) * s - 26, w = 104, x = bx - w / 2;
  txt(`${nameOf(p)}  Nv ${p.lv}`, bx, top - 14, 14, side === 'team' ? '#fff6dc' : '#ffe0e6', 'center', true);
  hpBar(x, top - 2, w, 9, p);
  if (side === 'team') txt(`${p.hp}`, x + w + 4, top + 3, 13, '#e8e0f0', 'left');
  else typePill(p.type, x + w + 6, top + 3, 12);
}
function drawRing(a: Loose) {
  const now = a.t, [cx, cy] = ringCenter(a), m = MOVES[a.move];
  const big = m.target === 'all' ? 1.7 : 1;
  const col = a.side === 'team' ? CYAN : CRIM;
  for (const h of a.hits) {
    if (h.judged || now < h.start - 0.02) continue;
    const R1 = 34 * big, R0 = 124 * big;
    let r;
    if (!h.feint) r = R0 + (R1 - R0) * clamp((now - h.start) / (h.impact - h.start), 0, 1);
    else {
      const aT = h.ringT * 0.5, hold = 0.38, snap = h.ringT * 0.18, e = now - h.start, Rm = R1 + (R0 - R1) * 0.45;
      r = e < aT ? R0 + (Rm - R0) * (e / aT) : e < aT + hold ? Rm + Math.sin(e * 40) * 2 : Rm + (R1 - Rm) * clamp((e - aT - hold) / snap, 0, 1);
    }
    ctx.save();
    ctx.shadowColor = col; ctx.shadowBlur = 16;
    B(); ctx.arc(cx, cy, R1, 0, TAU); ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke();
    B(); ctx.arc(cx, cy, r, 0, TAU); ctx.lineWidth = 6; ctx.strokeStyle = col; ctx.stroke();
    ctx.restore();
    for (let k = 0; k < 4; k++) { const ang = k * Math.PI / 2 + Math.PI / 4; diamond(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 7, col); }
    keycap(h.key, cx, cy, 0.75 + 0.25 * ease((now - h.start) / 0.12)); // this hit's key, from the moment its ring appears
    break;
  }
}
function drawStrip() {
  const Bt: Battle = state.battle, n = Bt.strip.length, w = 52, x0 = W / 2 - (n * w) / 2;
  panel(x0 - 92, 8, n * w + 104, 60, 'rgba(242,193,78,0.5)', 0.8);
  txt(`TURNO ${Bt.round}`, x0 - 46, 38, 15, GOLD, 'center', true);
  Bt.strip.forEach((s, k) => {
    const p = unit(s.side, s.i); if (!p) return;
    const x = x0 + k * w + 4, y = 14, cur = Bt.phase === 'exec' && k === Bt.stripIdx;
    B(); ctx.roundRect(x, y, 44, 48, 8); ctx.fillStyle = s.side === 'team' ? '#2a3550' : '#4a2236'; ctx.fill();
    ctx.lineWidth = cur ? 4 : 2; ctx.strokeStyle = cur ? '#ffffff' : s.side === 'team' ? GOLD : CRIM; ctx.stroke();
    ctx.save(); B(); ctx.roundRect(x, y, 44, 48, 8); ctx.clip();
    drawFigure(p.sp, x + 22, y + 46, clamp(40 / Math.max(FIG_H(p.sp), FIG_W(p.sp) * 0.8), 0.14, 0.5), s.side === 'team' ? 1 : -1, { t: 0, noShadow: true, alpha: s.done || p.hp <= 0 ? 0.3 : 1, phase: p.phase });
    ctx.restore();
  });
}
function drawIntents() {
  const Bt: Battle = state.battle;
  Bt.enemies.forEach((e, i) => {
    if (e.hp <= 0 || !e.intent) return;
    const m = MOVES[e.intent.move], [ex, ey] = centerOf('enemy', i);
    const s = e.boss ? 1 : depthScale(slot('enemy', i)[1]) * 1.05;
    const top = e.boss ? 214 : slot('enemy', i)[1] - FIG_H(e.sp) * s - 64;
    const label = m.kind === 'guard' ? `${m.name} (se protege)` : m.target === 'all' ? `${m.name} · a todo tu equipo` : `${m.name} · ${m.hits} golpe${m.hits > 1 ? 's' : ''}`;
    ctx.font = `700 14px ${FONT}`; const w = ctx.measureText(label).width + 22;
    const lx = Math.min(ex, W - 10 - w / 2);
    pill(lx - w / 2, top - 12, w, 24, 'rgba(60,14,32,0.92)', CRIM); txt(label, lx, top, 14, '#ffd8e0', 'center', true, false);
    if (m.target === 'one' && e.intent.target >= 0 && state.team[e.intent.target] && state.team[e.intent.target].hp > 0) {
      const [tx, ty] = centerOf('team', e.intent.target);
      ctx.save(); ctx.setLineDash([10, 8]); ctx.lineDashOffset = -state.t * 40; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(224,49,91,0.75)';
      B(); ctx.moveTo(ex - 30, ey - 20); ctx.quadraticCurveTo((ex + tx) / 2, Math.min(ey, ty) - 120, tx + 30, ty - 30); ctx.stroke(); ctx.restore();
      B(); ctx.moveTo(tx + 30, ty - 30); ctx.lineTo(tx + 48, ty - 46); ctx.lineTo(tx + 50, ty - 24); ctx.closePath(); fs(CRIM, 2);
      if (typeMult(m.type, state.team[e.intent.target].type) > 1) txt('¡Le es eficaz!', tx, ty - 74, 14, '#ffb0c0', 'center', true);
    }
    if (e.warn) {
      const pulse = 0.6 + Math.sin(state.t * 8) * 0.4;
      panel(ex - 190, top - 60, 380, 34, `rgba(224,49,91,${pulse})`, 0.9);
      txt('Próximo turno: TERREMOTO a todo tu equipo', ex, top - 43, 15, '#ffd0d8', 'center', true);
    }
  });
}
function drawPlanPanel() {
  const Bt: Battle = state.battle, p = state.team[Bt.cur]; if (!p) return;
  const y = 574, avail = availEn();
  panel(10, y, W - 20, 138, GOLD, 0.92);
  const s = clamp(84 / Math.max(FIG_H(p.sp), FIG_W(p.sp) * 0.7), 0.3, 0.9);
  ctx.save(); B(); ctx.roundRect(22, y + 12, 112, 114, 10); ctx.fillStyle = '#26314a'; ctx.fill(); ctx.clip();
  drawFigure(p.sp, 78, y + 118, s, 1, { t: state.t, noShadow: true }); ctx.restore();
  txt(nameOf(p), 146, y + 26, 20, '#fff', 'left', true);
  txt(`Nv ${p.lv}`, 146, y + 52, 15, GOLD, 'left', true);
  typePill(p.type, 196, y + 52, 12);
  txt(`PV ${p.hp}/${p.maxhp}`, 146, y + 78, 14, '#e8e0f0', 'left');
  txt(`Energía libre ${avail}`, 146, y + 102, 14, '#bfefff', 'left', true);
  for (let k = 0; k < 4; k++) {
    const id = p.moves[k], cx = 290 + (k % 2) * 318, cy = y + 10 + Math.floor(k / 2) * 54;
    B(); ctx.roundRect(cx, cy, 306, 48, 10);
    if (!id) { ctx.fillStyle = 'rgba(40,36,60,0.5)'; ctx.fill(); continue; }
    const m = MOVES[id], can = m.en <= avail, sel = k === Bt.sel;
    ctx.fillStyle = sel ? 'rgba(242,193,78,0.22)' : 'rgba(40,36,66,0.85)'; ctx.fill();
    ctx.lineWidth = sel ? 3 : 1.5; ctx.strokeStyle = sel ? GOLD : 'rgba(255,255,255,0.2)'; ctx.stroke();
    pill(cx + 8, cy + 10, 28, 28, sel ? GOLD : '#3a3460', null); txt(String(k + 1), cx + 22, cy + 24, 16, sel ? '#1b1426' : '#fff', 'center', true, false);
    txt(m.name, cx + 46, cy + 15, 16, can ? '#fff' : '#7a7090', 'left', true);
    typePill(m.type, cx + 46, cy + 35, 11);
    const info = m.kind === 'hit' ? `${m.pow} x ${m.hits}${m.target === 'all' ? ' · a todos' : ''}${m.feint ? ' · finta' : ''}` : m.kind === 'heal' ? 'cura a un aliado' : m.target === 'team' ? 'protege al equipo' : 'se protege';
    txt(info, cx + 120, cy + 35, 13, can ? '#d8d0e8' : '#6a6080', 'left');
    for (let e = 0; e < m.en; e++) diamond(cx + 292 - e * 14, cy + 14, 5.5, can ? CYAN : '#3a3a55');
    if (m.gain) txt(`+${m.gain} energía`, cx + 298, cy + 14, 13, '#9cff7a', 'right', true);
    else if (!m.en) txt('gratis', cx + 298, cy + 14, 13, '#9cff7a', 'right');
  }
  txt('Izquierda / Derecha: ataque   ·   Arriba / Abajo: objetivo   ·   1-4 / Enter: confirmar   ·   Retroceso: volver', 606, y + 127, 13, '#9f94b8', 'center');
  const m = MOVES[p.moves[Bt.sel]], opts = targetOptions(p, m);
  const ix = 942;
  if (m.target === 'one' && opts.length) {
    const e = Bt.enemies[opts[clamp(Bt.tgt, 0, opts.length - 1)]], tm = typeMult(m.type, e.type);
    txt('Objetivo', ix, y + 18, 14, '#bfb4d0', 'left');
    txt(nameOf(e), ix, y + 40, 18, '#ffe0e6', 'left', true);
    txt(tm > 1 ? '¡Eficaz!  x' + tune.type_strong : tm < 1 ? 'Poco eficaz  x' + tune.type_weak : 'Daño normal', ix, y + 64, 15, tm > 1 ? '#ffd36b' : tm < 1 ? '#b0a8c0' : '#e8e0f0', 'left', true);
    if (opts.length > 1) txt('Arriba / Abajo: cambiar objetivo', ix, y + 112, 13, '#bfb4d0', 'left');
  } else if (m.target === 'ally' && opts.length) {
    const q = state.team[opts[clamp(Bt.tgt, 0, opts.length - 1)]];
    txt('Curar a', ix, y + 18, 14, '#bfb4d0', 'left'); txt(`${nameOf(q)}  ${q.hp}/${q.maxhp}`, ix, y + 40, 18, '#d8ffd0', 'left', true);
    if (opts.length > 1) txt('Arriba / Abajo: cambiar aliado', ix, y + 112, 13, '#bfb4d0', 'left');
  } else {
    txt(m.target === 'all' ? 'Golpea a todos los enemigos' : m.target === 'team' ? 'Mitad de daño al equipo este turno' : 'Mitad de daño este turno', ix, y + 30, 15, '#e8e0f0', 'left', true);
    if (m.kind === 'guard') txt('Actúa antes que nadie', ix, y + 56, 14, '#9fd8ff', 'left');
  }
  if (m.gain) txt(`Gratis: recarga +${m.gain} energía`, ix, y + 88, 14, '#9cff7a', 'left', true);
  else if (m.en) txt(`Cuesta ${m.en} de energía`, ix, y + 88, 14, '#bfefff', 'left', true);
}
// The shared energy: what is free, what the chosen moves have reserved, what the move under the cursor would take.
function drawPool() {
  const Bt: Battle = state.battle, plan = Bt.phase === 'plan', reserved = plan ? reservedEn() : 0, avail = Math.max(0, Bt.en - reserved);
  let preview = 0;
  if (plan) { const p = state.team[Bt.cur]; if (p) { const c = MOVES[p.moves[Bt.sel]].en; if (c <= avail) preview = c; } }
  panel(12, 10, 340, 110, CYAN, 0.86);
  txt('ENERGÍA DEL EQUIPO', 26, 28, 15, CYAN, 'left', true);
  txt(`${Bt.en}/${tune.en_max}`, 338, 28, 17, '#fff', 'right', true);
  const blink = 0.5 + Math.sin(state.t * 10) * 0.5;
  for (let k = 0; k < tune.en_max; k++) {
    const x = 36 + k * 30, y = 56;
    if (k < avail - preview) diamond(x, y, 10, CYAN);
    else if (k < avail) { diamond(x, y, 10, '#2a2a40'); ctx.save(); ctx.globalAlpha = blink; diamond(x, y, 10, '#ffffff'); ctx.restore(); }
    else if (k < Bt.en) diamond(x, y, 10, '#c08a20');
    else diamond(x, y, 10, '#1e1e30');
  }
  const recharge = plan ? Bt.plans.reduce((t, pl) => t + (pl ? (MOVES[pl.move].gain || 0) : 0), 0) : 0;
  const curM = plan && state.team[Bt.cur] ? MOVES[state.team[Bt.cur].moves[Bt.sel]] : null;
  const tail = preview ? `  ·  este ataque -${preview}` : curM && curM.gain ? `  ·  este ataque +${curM.gain}` : '';
  if (plan) txt(`Libre ${avail}  ·  Reservada ${reserved}${recharge ? `  ·  Recarga +${recharge}` : ''}${tail}`, 26, 82, 14, '#e8fbff', 'left', true);
  else txt(`Se gasta al atacar · quedan ${Bt.en}`, 26, 82, 14, '#e8fbff', 'left', true);
  txt(`+${tune.en_regen} por turno · gratis recargan${tune.en_parry ? ` · paradas +${tune.en_parry} a veces` : ''}`, 26, 104, 13, '#bfefff', 'left');
}
// Brackets around whatever the move under the cursor will hit, heal or protect.
function drawTargetMarker() {
  const Bt: Battle = state.battle, p = state.team[Bt.cur]; if (!p) return;
  const m = MOVES[p.moves[Bt.sel]], opts = targetOptions(p, m);
  let list: [string, number][] = [], col = GOLD, label = 'OBJETIVO';
  if (m.target === 'one' && opts.length) list = [['enemy', opts[clamp(Bt.tgt, 0, opts.length - 1)]]];
  else if (m.target === 'all') { list = Bt.enemies.map((e, i): [string, number] => ['enemy', i]).filter(([, i]) => Bt.enemies[i].hp > 0); label = 'TODOS'; }
  else if (m.target === 'ally' && opts.length) { list = [['team', opts[clamp(Bt.tgt, 0, opts.length - 1)]]]; col = '#9cff7a'; label = 'CURAR'; }
  else if (m.target === 'team') { list = state.team.map((q, i): [string, number] => ['team', i]).filter(([, i]) => state.team[i].hp > 0); col = '#9fd8ff'; label = 'PROTEGER'; }
  else { list = [['team', Bt.cur]]; col = '#9fd8ff'; label = 'PROTEGER'; }
  const pulse = 1 + Math.sin(state.t * 6) * 0.06;
  for (const [side, i] of list) {
    const u = unit(side, i), [bx, by] = slot(side, i), s = u.boss ? 1 : depthScale(by) * 1.05, [cx, cy] = centerOf(side, i);
    const w = (FIG_W(u.sp) * s * 0.5 + 14) * pulse, h = (FIG_H(u.sp) * s * 0.55 + 12) * pulse, L = 22;
    B(); el(bx, by + 2, FIG_W(u.sp) * s * 0.62, 15 * s); ctx.lineWidth = 5; ctx.strokeStyle = col; ctx.stroke();
    for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const x = cx + sx * w, y = cy + sy * h;
      for (const [lw, c] of [[9, INK], [5, col]] as [number, string][]) { B(); ctx.moveTo(x - sx * L, y); ctx.lineTo(x, y); ctx.lineTo(x, y - sy * L); ctx.lineWidth = lw; ctx.strokeStyle = c; ctx.lineCap = 'round'; ctx.stroke(); }
    }
    ctx.font = `700 14px ${FONT}`; const tw = ctx.measureText(label).width + 20;
    const lx = side === 'enemy' ? cx - w - 10 - tw : cx + w + 10;
    pill(lx, cy - 12, tw, 24, col, INK); txt(label, lx + tw / 2, cy, 14, '#1b1426', 'center', true, false);
  }
}
// Above each pet: an arrow on the one choosing, and the move (and its energy) on the ones already chosen.
function drawPlanTags() {
  const Bt: Battle = state.battle;
  state.team.forEach((p, i) => {
    if (p.hp <= 0) return;
    const [x, y] = slot('team', i), top = y - FIG_H(p.sp) * depthScale(y) * 1.05 - 64;
    if (i === Bt.cur) { chevron(x, top + Math.sin(state.t * 5) * 4, 12, GOLD); return; }
    const pl = Bt.plans[i]; if (!pl) return;
    const m = MOVES[pl.move], lab = `${m.name}${m.en ? ` · -${m.en} energía` : m.gain ? ` · +${m.gain} energía` : ''}`;
    ctx.font = `700 13px ${FONT}`; const w = ctx.measureText(lab).width + 20;
    pill(x - w / 2, top - 11, w, 22, 'rgba(60,46,14,0.92)', GOLD); txt(lab, x, top, 13, '#ffe39a', 'center', true, false);
  });
}
function drawBattle() {
  const Bt: Battle = state.battle;
  ctx.save();
  if (state.shake > 0) ctx.translate((rng() - 0.5) * 14 * state.shake / 0.2, (rng() - 0.5) * 10 * state.shake / 0.2);
  drawArena(THEMES[ROOMS[state.room].theme]);
  const order: [string, number, number][] = [];
  state.team.forEach((p, i) => order.push(['team', i, slot('team', i)[1]]));
  Bt.enemies.forEach((p, i) => order.push(['enemy', i, slot('enemy', i)[1]]));
  order.sort((a, b) => a[2] - b[2]);
  const introU = Bt.phase === 'intro' ? ease(Bt.t / 0.6) : 1;
  ctx.save(); ctx.translate(0, 0);
  for (const [side, i] of order) {
    ctx.save(); if (introU < 1) ctx.translate((side === 'team' ? -1 : 1) * (1 - introU) * 500, 0);
    drawUnit(side, i); ctx.restore();
  }
  ctx.restore();
  if (Bt.phase === 'plan') {
    const [cx, cy] = slot('team', Bt.cur), p = state.team[Bt.cur];
    if (p) { ctx.save(); ctx.globalAlpha = 0.5 + Math.sin(state.t * 6) * 0.3; B(); el(cx, cy + 2, FIG_W(p.sp) * 0.62, 16); ctx.lineWidth = 4; ctx.strokeStyle = GOLD; ctx.stroke(); ctx.restore(); }
  }
  if (Bt.phase !== 'intro') {
    for (const [side, i] of order) drawUnitBars(side, i);
    const boss = Bt.enemies.find(e => e.boss);
    if (boss) {
      panel(760, 78, 500, 52, CRIM, 0.85);
      txt(`${nameOf(boss)}  Nv ${boss.lv}`, 778, 96, 17, '#ffe0e6', 'left', true);
      typePill(boss.type, 1010, 96, 12);
      txt(boss.phase === 2 ? 'Fase 2' : 'Fase 1', 1244, 96, 14, '#ffb0c0', 'right', true);
      hpBar(778, 110, 464, 10, boss);
    }
  }
  if (Bt.phase === 'plan') {
    drawTargetMarker();
    drawIntents();
    drawPlanTags();
    drawPlanPanel();
    if (!state.tut.plan) { panel(330, 140, 620, 44, CYAN, 0.9); txt('Tu turno: el tiempo se detiene. Elige un ataque para cada mascota.', 640, 162, 17, '#e8fbff', 'center', true); }
  }
  if (Bt.phase === 'exec' && Bt.act) drawRing(Bt.act);
  if (Bt.phase !== 'intro') { drawStrip(); drawPool(); }
  ctx.restore();
  if (Bt.bannerT > 0 && Bt.phase !== 'plan' || (Bt.phase === 'plan' && Bt.bannerT > 0 && Bt.banner.includes('TERREMOTO'))) {
    ctx.font = `700 22px ${FONT}`; const w = Math.min(W - 40, ctx.measureText(Bt.banner).width + 50);
    panel(W / 2 - w / 2, Bt.boss ? 140 : 84, w, 44, Bt.bannerCol && Bt.phase === 'exec' ? Bt.bannerCol : GOLD, 0.9);
    txt(Bt.banner, W / 2, (Bt.boss ? 140 : 84) + 22, 22, '#fff6dc', 'center', true);
  }
  if (Bt.phase === 'win') { ctx.fillStyle = 'rgba(10,8,20,0.35)'; ctx.fillRect(0, 0, W, H); txt('¡Victoria!', W / 2, 300, 72, GOLD, 'center', true); }
  if (Bt.phase === 'lose') { ctx.fillStyle = `rgba(10,8,20,${clamp(Bt.t / 1.5, 0, 0.75)})`; ctx.fillRect(0, 0, W, H); txt('Tu equipo ha caído...', W / 2, 310, 52, '#ffd0d8', 'center', true); txt('Volverás a la fuente de la entrada, sin perder nada.', W / 2, 370, 20, '#e8e0f0', 'center'); }
}

// ---- Drawing: song, tally, learning, evolution --------------------------------------------
function drawSong() {
  const S: Song = state.song, Bt = state.battle;
  drawArena(THEMES[ROOMS[state.room].theme]);
  ctx.fillStyle = 'rgba(6,8,22,0.62)'; ctx.fillRect(0, 0, W, H);
  const e = S.phase === 'offer' ? Bt.enemies[S.cands[S.pick]] : S.e;
  const rare = SPECIES[e.sp].rarity === 'rara';
  if (S.phase === 'offer') {
    S.cands.forEach((ci, k) => {
      const en = Bt.enemies[ci], x = 640 + (k - (S.cands.length - 1) / 2) * 260, sel = k === S.pick;
      drawFigure(en.sp, x, 470, sel ? 1.15 : 0.85, -1, { t: state.t + k, side: sel ? 'enemy' : null, alpha: sel ? 1 : 0.5 });
      txt(`${nameOf(en)}  Nv ${en.lv}`, x, 510, 18, sel ? '#fff' : '#a098b8', 'center', true);
      txt(`${SPECIES[en.sp].rarity === 'rara' ? 'Rara' : 'Común'} · ${songLen(en)} notas`, x, 536, 15, SPECIES[en.sp].rarity === 'rara' ? '#ff9fc8' : '#bfefff', 'center');
    });
    panel(240, 90, 800, 120, CYAN, 0.9);
    txt('La criatura está derrotada y asustada.', 640, 124, 22, '#e8fbff', 'center', true);
    txt('¿Le tocas la canción sanadora para convencerla de unirse a tu equipo?', 640, 156, 18, '#d8eef8', 'center');
    txt(S.cands.length > 1 ? 'Izquierda / Derecha: elegir a quién   ·   Enter: tocar   ·   Retroceso: seguir sin tocar' : 'Enter: tocar   ·   Retroceso: seguir sin tocar', 640, 188, 15, '#9fd8e8', 'center');
    if (state.team.length >= tune.max_team) txt('Tu equipo está completo: si la convences, podrás cambiarla por otra mascota.', 640, 590, 16, '#ffd36b', 'center', true);
    drawTeamStrip(652);
    return;
  }
  const calm = S.phase === 'play' ? S.score / S.notes.length : S.ok ? 1 : S.score / S.notes.length;
  // the ribbon: a luminous staff from the trainer to the creature
  const yTop = laneY(0, SONG_X0) - 30, yBot = laneY(3, SONG_X0) + 30;
  ctx.save();
  const band = lg(SONG_X0, 0, SONG_HX + 60, 0, ['rgba(242,193,78,0.18)', 'rgba(95,242,255,0.22)']);
  B(); for (let x = SONG_X0; x <= SONG_HX + 60; x += 20) { const y = laneY(0, x) - 30; x === SONG_X0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  for (let x = SONG_HX + 60; x >= SONG_X0; x -= 20) ctx.lineTo(x, laneY(3, x) + 30);
  ctx.closePath(); ctx.fillStyle = band; ctx.fill();
  for (let l = 0; l < 4; l++) {
    ctx.shadowColor = LANE_COL[l]; ctx.shadowBlur = 10;
    B(); for (let x = SONG_X0; x <= SONG_HX + 60; x += 10) { const y = laneY(l, x); x === SONG_X0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(220,250,255,0.75)'; ctx.stroke();
  }
  ctx.restore();
  drawFigure('trainer', 168, 560, 1.7, 1, { t: state.t, play: true });
  const shake = S.phase === 'play' ? (1 - calm) * 3 * Math.sin(state.t * 40) : 0;
  const hop = S.phase === 'result' && S.ok ? Math.abs(Math.sin(S.t * 6)) * 18 : 0;
  drawFigure(e.sp, 1090 + shake, 560 - hop, 1.15, -1, { t: state.t, side: 'enemy', flash: S.phase === 'result' && !S.ok ? 0 : (1 - calm) * 0.45, flashCol: '#ff3a5a', alpha: S.phase === 'result' && !S.ok ? clamp(1 - S.t / 1.5, 0, 1) : 1 });
  for (let l = 0; l < 4; l++) {
    const y = laneY(l, SONG_HX), f = Math.max(0, S.flashL ? S.flashL[l] : 0);
    ctx.save(); ctx.shadowColor = LANE_COL[l]; ctx.shadowBlur = 8 + f * 20;
    arrowShape(l, SONG_HX, y, 18 + f * 4, f > 0 ? LANE_COL[l] : 'rgba(20,18,36,0.9)', LANE_COL[l], 3); ctx.restore();
  }
  if (S.phase === 'play') {
    for (const nt of S.notes) {
      if (nt.judged && nt.res !== 'miss') continue;
      const u = (nt.at - S.t) / tune.song_travel; if (u > 1.05) continue;
      const x = SONG_HX - u * (SONG_HX - SONG_X0); if (x > SONG_HX + 50) continue;
      const y = laneY(nt.lane, x);
      ctx.save(); ctx.globalAlpha = nt.res === 'miss' ? 0.3 : clamp((1.05 - u) * 4, 0, 1);
      ctx.shadowColor = LANE_COL[nt.lane]; ctx.shadowBlur = 14;
      arrowShape(nt.lane, x, y, 17, nt.res === 'miss' ? '#606070' : LANE_COL[nt.lane], INK, 3); ctx.restore();
    }
    if (S.t < tune.song_travel + 0.9 - 4 * S.beat) txt('¡Prepárate!', 640, 200, 30, '#fff6dc', 'center', true);
    else if (S.t < tune.song_travel + 0.9) txt(String(4 - S.ticks + 1 > 4 ? 4 : Math.max(1, 4 - S.ticks + 1)), 640, 200, 36, GOLD, 'center', true);
  }
  panel(20, 18, 560, 74, CYAN, 0.88);
  txt(`Canción sanadora para ${nameOf(e)}`, 40, 42, 21, '#e8fbff', 'left', true);
  txt(`${rare ? 'Rara' : 'Común'} · Nv ${e.lv} frente a tu equipo (Nv medio ${teamAvgLv().toFixed(1)}) · ${S.notes.length} notas`, 40, 70, 15, rare ? '#ff9fc8' : '#bfefff', 'left');
  const mx = 1000, my = 200;
  txt('Confianza', mx, my - 18, 15, '#e8fbff', 'left', true);
  ctx.fillStyle = '#1a1424'; B(); ctx.roundRect(mx - 2, my - 2, 224, 16, 6); ctx.fill();
  ctx.fillStyle = lg(mx, 0, mx + 220, 0, ['#ff8fb8', '#ffd36b', '#9cff7a']); ctx.fillRect(mx, my, 220 * clamp(calm, 0, 1), 12);
  ctx.fillStyle = '#fff'; ctx.fillRect(mx + 220 * tune.song_pass - 1, my - 5, 3, 22);
  if (!state.tut.song && S.phase === 'play') { panel(310, 520, 560, 50, '#9cff7a', 0.9); txt('Pulsa la flecha de cada nota cuando llegue al corazón de la cinta', 590, 545, 16, '#e8ffe0', 'center', true); }
  if (S.phase === 'result') {
    if (S.ok) {
      for (let k = 0; k < 6; k++) heart(1060 + Math.sin(S.t * 2 + k) * 50, 420 - ((S.t * 70 + k * 40) % 220), 9, '#ff8fb8');
      panel(340, 210, 600, 90, '#9cff7a', 0.92);
      txt(`¡${nameOf(e)} se une a tu equipo!`, 640, 244, 30, '#d8ffd0', 'center', true);
      txt(`${S.perfect} perfectas · ${S.good} bien · ${S.miss} falladas`, 640, 278, 16, '#e8e0f0', 'center');
    } else {
      panel(340, 210, 600, 90, '#b0a8c0', 0.92);
      txt(`${nameOf(e)} no se convence y se aleja...`, 640, 244, 26, '#e8e0f0', 'center', true);
      txt(`Necesitabas ${Math.round(tune.song_pass * 100)}% de la canción · lograste ${Math.round(calm * 100)}%`, 640, 278, 16, '#bfb4d0', 'center');
    }
  }
  if (S.phase === 'swap') {
    panel(240, 180, 800, 140, GOLD, 0.94);
    txt(`¡${nameOf(e)} quiere unirse, pero tu equipo está completo!`, 640, 214, 22, '#fff6dc', 'center', true);
    txt('1-4: ¿qué mascota se despide y vuelve al bosque?', 640, 252, 18, '#e8e0f0', 'center');
    txt(`Retroceso: dejar ir a ${nameOf(e)} en paz (+${tune.release_xp * e.lv} EXP para el equipo)`, 640, 286, 16, '#9fd8e8', 'center');
  }
  drawTeamStrip(652);
  if (S.phase === 'swap') state.team.forEach((p, i) => { pill(12 + i * 316 + 262, 640, 30, 24, GOLD, INK); txt(String(i + 1), 12 + i * 316 + 277, 652, 15, '#1b1426', 'center', true, false); });
}
function drawTally() {
  const TL: Tally = state.tally;
  drawArena(THEMES[ROOMS[state.room].theme]);
  ctx.fillStyle = 'rgba(6,8,22,0.6)'; ctx.fillRect(0, 0, W, H);
  panel(190, 60, 900, 600, GOLD, 0.94);
  txt('¡Victoria!', 640, 104, 40, GOLD, 'center', true);
  txt(`+${TL.total} EXP para cada mascota que luchó`, 640, 146, 18, '#bfefff', 'center');
  const u = ease(clamp((TL.t - 0.3) / 1.2, 0, 1));
  TL.rows.forEach((r, k) => {
    const p = state.team.find(q => q.uid === r.uid); if (!p) return;
    const y = 190 + k * 108;
    B(); ctx.roundRect(214, y, 852, 96, 10); ctx.fillStyle = 'rgba(40,36,66,0.7)'; ctx.fill();
    const s = clamp(78 / Math.max(FIG_H(p.sp), FIG_W(p.sp) * 0.8), 0.25, 0.8);
    drawFigure(p.sp, 268, y + 86, s, 1, { t: state.t, noShadow: true });
    txt(nameOf(p), 330, y + 22, 20, '#fff', 'left', true);
    if (r.newbie) { txt('¡Nueva en el equipo!', 330, y + 52, 16, '#9cff7a', 'left', true); return; }
    const lvShown = u >= 1 ? r.to : r.from;
    txt(`Nv ${lvShown}`, 520, y + 22, 18, GOLD, 'left', true);
    txt(`+${Math.round(r.gain * u)} EXP`, 600, y + 22, 16, '#bfefff', 'left');
    const fill = r.to > r.from ? (u < 1 ? r.x0 + (1 - r.x0) * u : r.x1!) : lerp(r.x0, r.x1!, u);
    ctx.fillStyle = '#1a1424'; ctx.fillRect(330, y + 40, 300, 10); ctx.fillStyle = '#7fc8ff'; ctx.fillRect(330, y + 40, 300 * clamp(fill, 0, 1), 10);
    if (u >= 1) r.lines.slice(0, 3).forEach((ln, j) => txt(ln, 660, y + 22 + j * 24, 15, ln.startsWith('¡') ? '#9cff7a' : '#ffd36b', 'left', true));
    if (p.hp <= 0) txt('Debilitada: la mitad de EXP', 330, y + 70, 14, '#ffb0c0', 'left');
  });
  if (TL.t > 1.6) txt('Enter para continuar', 640, 636, 18, '#fff6dc', 'center', true);
}
function drawLearn() {
  const L = state.learn, p = state.team.find(q => q.uid === L.uid)!, nm = MOVES[L.move];
  drawArena(THEMES[ROOMS[state.room].theme]);
  ctx.fillStyle = 'rgba(6,8,22,0.66)'; ctx.fillRect(0, 0, W, H);
  panel(190, 90, 900, 520, GOLD, 0.95);
  drawFigure(p.sp, 300, 300, 1, 1, { t: state.t });
  txt(`${nameOf(p)} quiere aprender ${nm.name}`, 680, 134, 26, '#fff6dc', 'center', true);
  typePill(nm.type, 560, 172, 13);
  txt(`${nm.kind === 'hit' ? `${nm.pow} x ${nm.hits}${nm.target === 'all' ? ' a todos' : ''}` : nm.kind === 'heal' ? 'cura a un aliado' : 'protege'} · ${nm.en} energía`, 640, 172, 16, '#e8e0f0', 'left');
  txt('Ya sabe cuatro ataques. ¿Cuál olvida?', 680, 214, 18, '#d8d0e8', 'center');
  p.moves.forEach((id, k) => {
    const m = MOVES[id], y = 244 + k * 70;
    B(); ctx.roundRect(440, y, 500, 58, 10); ctx.fillStyle = 'rgba(40,36,66,0.85)'; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,0.25)'; ctx.stroke();
    pill(452, y + 14, 30, 30, GOLD, null); txt(String(k + 1), 467, y + 29, 16, '#1b1426', 'center', true, false);
    txt(m.name, 496, y + 20, 18, '#fff', 'left', true); typePill(m.type, 496, y + 42, 11);
    txt(m.kind === 'hit' ? `${m.pow} x ${m.hits}` : m.kind === 'heal' ? 'cura' : 'protege', 700, y + 30, 15, '#d8d0e8', 'left');
  });
  txt('1-4: olvidar ese ataque   ·   Retroceso: no aprender', 640, 580, 16, '#9fd8e8', 'center');
}
function drawEvolve() {
  const E = state.evo, p = state.team.find(q => q.uid === E.uid)!;
  ctx.fillStyle = '#07060f'; ctx.fillRect(0, 0, W, H);
  const g = ctx.createRadialGradient(640, 380, 10, 640, 380, 420); g.addColorStop(0, 'rgba(255,230,160,0.35)'); g.addColorStop(1, 'rgba(255,230,160,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let k = 0; k < 14; k++) { const a = k / 14 * TAU + state.t * 0.6; ctx.strokeStyle = 'rgba(255,230,160,0.12)'; ctx.lineWidth = 18; B(); ctx.moveTo(640, 380); ctx.lineTo(640 + Math.cos(a) * 800, 380 + Math.sin(a) * 800); ctx.stroke(); }
  if (!E.done) {
    const rate = 2 + E.t * E.t * 2.2, showNew = Math.sin(E.t * rate * Math.PI) > 0;
    const sp = showNew ? E.to : E.from;
    silhouette(sp, 640, 520, 1.6, 1, '#fff8e0', 1, { t: state.t });
    txt(`¿Qué le pasa a ${SPECIES[E.from].name}?`, 640, 120, 30, '#fff6dc', 'center', true);
  } else {
    drawFigure(p.sp, 640, 520, 1.6, 1, { t: state.t, flash: clamp(1 - (E.t - 3.2) * 2, 0, 1) });
    txt(`¡${SPECIES[E.from].name} evolucionó a ${SPECIES[E.to].name}!`, 640, 120, 34, GOLD, 'center', true);
    txt(`PV ${p.maxhp}  ·  ATQ ${Math.round(p.atk)}  ·  DEF ${Math.round(p.def)}  ·  VEL ${Math.round(p.spd)}`, 640, 600, 20, '#e8e0f0', 'center', true);
    if (E.t > 3.8) txt('Enter para continuar', 640, 650, 18, '#fff6dc', 'center', true);
  }
}
function drawStarter() {
  drawArena(THEMES[0]);
  ctx.fillStyle = 'rgba(6,8,22,0.35)'; ctx.fillRect(0, 0, W, H);
  txt('Elige a tu primera mascota', 640, 80, 40, '#fff6dc', 'center', true);
  txt('Izquierda / Derecha y Enter, o 1-3', 640, 122, 17, '#bfb4d0', 'center');
  STARTERS.forEach((sp, k) => {
    const x = 340 + k * 300, sel = k === state.pick, y = 470 - (sel ? Math.abs(Math.sin(state.t * 4)) * 12 : 0);
    B(); el(x, 474, 110, 26); ctx.fillStyle = sel ? 'rgba(242,193,78,0.25)' : 'rgba(255,255,255,0.06)'; ctx.fill(); ctx.lineWidth = sel ? 4 : 2; ctx.strokeStyle = sel ? GOLD : 'rgba(255,255,255,0.2)'; ctx.stroke();
    drawFigure(sp, x, y, sel ? 1.5 : 1.2, 1, { t: state.t + k, alpha: sel ? 1 : 0.7 });
    txt(SPECIES[sp].name, x, 530, 24, sel ? '#fff' : '#b0a8c0', 'center', true);
    typePill(SPECIES[sp].type, x - 32, 562, 13);
  });
  const sp = STARTERS[state.pick], S_ = SPECIES[sp];
  panel(240, 600, 800, 96, GOLD, 0.9);
  txt(S_.desc!, 640, 630, 19, '#fff6dc', 'center', true);
  txt(`Fuerte contra ${TYPES[TYPES[S_.type].beats!].name} · débil contra ${Object.values(TYPES).find(t_ => t_.beats === S_.type)!.name} · evoluciona a nivel ${tune.evolve_level}`, 640, 664, 16, '#d8d0e8', 'center');
}
function drawFx() {
  for (const f of state.fx) {
    const a = clamp(1 - f.t / f.life, 0, 1);
    if (f.k === 'pop') { ctx.save(); ctx.globalAlpha = a; txt(f.s!, f.x, f.y, f.size! * (1 + Math.max(0, 0.25 - f.t) * 1.6), f.col, 'center', true); ctx.restore(); }
    else { ctx.save(); ctx.globalAlpha = a; diamond(f.x, f.y, 5 * a + 1, f.col); ctx.restore(); }
  }
}
function updFx(dt: number) {
  for (const f of state.fx) { f.t += dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.k === 'pop') f.vy += f.g! * dt; else { f.vx *= 0.92; f.vy *= 0.92; } }
  state.fx = state.fx.filter(f => f.t < f.life);
  if (state.shake > 0) state.shake = Math.max(0, state.shake - dt);
  if (state.toastT > 0) state.toastT -= dt;
  if (state.fade > 0) state.fade = Math.max(0, state.fade - dt);
}

// ---- Scenes ----------------------------------------------------------------------------
const scenes: Record<string, { update(dt: number): void; draw(): void }> = {
  figures: {
    update(dt) { state.t += dt; },
    draw() {
      drawArena(THEMES[2]); ctx.fillStyle = 'rgba(6,8,22,0.45)'; ctx.fillRect(0, 0, W, H);
      txt('Figuras de Canto Salvaje', 640, 34, 26, '#fff6dc', 'center', true);
      const rows = [['chispin', 'fogaral', 'retoni', 'frondalce', 'gotin', 'mareon'], ['musgorro', 'charquillo', 'ascuervo', 'zarzalma', 'trainer'], ['golem']];
      rows[0].forEach((sp, k) => { const x = 110 + k * 212; drawFigure(sp, x, 250, 1, 1, { t: 0.4, side: 'team' }); txt(SPECIES[sp].name, x, 280, 17, '#fff', 'center', true); });
      rows[1].forEach((sp, k) => { const x = 110 + k * 190; drawFigure(sp, x, 470, 1, sp === 'trainer' ? 1 : -1, { t: 0.4, side: sp === 'trainer' ? null : 'enemy' }); txt(sp === 'trainer' ? 'Tú, quien adiestra' : SPECIES[sp].name, x, 500, 17, '#fff', 'center', true); });
      drawFigure('golem', 1080, 690, 0.66, -1, { t: 0.4, side: 'enemy', phase: 1 }); txt('Gólem Raíz (jefe)', 1080, 706, 17, '#fff', 'center', true);
      drawFigure('golem', 900, 690, 0.5, -1, { t: 0.4, phase: 2 }); txt('fase 2', 860, 706, 15, '#bfefff', 'center', true);
    },
  },
  title: {
    update() {
      state.t += STEP;
      const go = pressed('Enter') || pressed('Space') || pressed('NumpadEnter');
      if (!titleSave) { if (go) { reset(); scene = 'play'; sfx('confirm'); } return; }
      if (titleConfirm) {
        if (go) { clearSave(); titleSave = null; reset(); scene = 'play'; sfx('confirm'); }
        else if (tap('back')) { titleConfirm = false; sfx('select'); }
        return;
      }
      if (tap('up') || tap('down') || tap('left') || tap('right')) { titleSel = 1 - titleSel; sfx('select'); }
      if (go) {
        if (titleSel === 0) { const sv = titleSave; reset(); applySave(sv); sfx('confirm'); goCamp('De vuelta en el campamento.'); }
        else { titleConfirm = true; sfx('select'); }
      }
    },
    draw() {
      drawArena(THEMES[0]);
      ctx.fillStyle = 'rgba(6,8,22,0.45)'; ctx.fillRect(0, 0, W, H);
      drawFigure('ascuervo', 1010, 330, 0.9, -1, { t: state.t, alpha: 0.85 });
      drawFigure('chispin', 470, 400, 1.2, 1, { t: state.t });
      drawFigure('gotin', 330, 410, 1.1, 1, { t: state.t + 1 });
      drawFigure('retoni', 590, 412, 1.1, 1, { t: state.t + 2 });
      drawFigure('trainer', 200, 412, 1.5, 1, { t: state.t, play: true });
      drawFigure('zarzalma', 860, 410, 1.0, -1, { t: state.t });
      for (let k = 0; k < 5; k++) { const x = 260 + k * 110 + Math.sin(state.t + k) * 10, y = 300 - k * 14 + Math.sin(state.t * 2 + k) * 8; ctx.save(); ctx.shadowColor = LANE_COL[k % 4]; ctx.shadowBlur = 12; arrowShape(k % 4, x, y, 12, LANE_COL[k % 4], INK, 2.5); ctx.restore(); }
      ctx.save(); ctx.shadowColor = GOLD; ctx.shadowBlur = 24; txt(TITLE, W / 2, 120, 84, '#ffe39a', 'center', true); ctx.restore();
      txt('Una mazmorra, un equipo de mascotas y una canción que sana', W / 2, 184, 22, '#e8fbff', 'center');
      panel(250, 448, 780, 196, GOLD, 0.88);
      CONTROLS.forEach((c, i) => txt(c, W / 2, 478 + i * 30, 17, '#e8e0f0', 'center'));
      const p = 0.6 + Math.sin(state.t * 4) * 0.4;
      if (!titleSave) txt('Enter para empezar', W / 2, 680, 26, `rgba(255,246,220,${p})`, 'center', true);
      else if (titleConfirm) {
        panel(300, 652, 680, 60, CRIM, 0.95);
        txt('¿Borrar la partida guardada y empezar de cero?', W / 2, 670, 18, '#ffd8e0', 'center', true);
        txt('Enter: sí, borrar   ·   Retroceso: no', W / 2, 696, 15, '#e8e0f0', 'center');
      } else {
        const opts = [`Continuar · ${titleSave.team.length} mascota${titleSave.team.length > 1 ? 's' : ''}`, 'Nueva partida'];
        opts.forEach((o, k) => {
          const x = W / 2 + (k ? 190 : -190), sel = k === titleSel;
          if (sel) chevron(x - 120, 676, 9, GOLD);
          txt(o, x, 682, sel ? 26 : 22, sel ? `rgba(255,227,154,${0.75 + 0.25 * p})` : '#a8a0c0', 'center', true);
        });
      }
    },
  },
  play: {
    update(dt) {
      if (pressed('KeyP')) { scene = 'pause'; return; }
      state.t += dt;
      updFx(dt);
      switch (state.mode) {
        case 'starter': updStarter(); break;
        case 'camp': updCamp(); break;
        case 'map': updMap(); break;
        case 'dungeon': updDungeon(dt); break;
        case 'battle': updBattle(dt); break;
        case 'song': updSong(dt); break;
        case 'tally': updTally(dt); break;
        case 'learn': updLearn(dt); break;
        case 'evolve': updEvolve(dt); break;
      }
    },
    draw() {
      ctx.save();
      switch (state.mode) {
        case 'starter': drawStarter(); break;
        case 'camp': drawCamp(); break;
        case 'map': drawMap(); break;
        case 'dungeon': drawDungeon(); break;
        case 'battle': drawBattle(); break;
        case 'song': drawSong(); break;
        case 'tally': drawTally(); break;
        case 'learn': drawLearn(); break;
        case 'evolve': drawEvolve(); break;
      }
      drawFx();
      if (state.toastT > 0) {
        ctx.font = `700 18px ${FONT}`; const w = ctx.measureText(state.toast).width + 40, a = clamp(state.toastT * 3, 0, 1);
        ctx.globalAlpha = a; panel(W / 2 - w / 2, state.mode === 'dungeon' ? 60 : 196, w, 40, CYAN, 0.9);
        txt(state.toast, W / 2, (state.mode === 'dungeon' ? 60 : 196) + 20, 18, '#e8fbff', 'center', true); ctx.globalAlpha = 1;
      }
      if (state.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${clamp(state.fade * 2, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
      ctx.restore();
    },
  },
  pause: {
    update() { if (pressed('KeyP') || pressed('Escape')) scene = 'play'; },
    draw() { scenes.play.draw(); ctx.fillStyle = 'rgba(6,8,22,0.6)'; ctx.fillRect(0, 0, W, H); txt('Pausa', W / 2, H / 2 - 20, 56, '#fff6dc', 'center', true); txt('P para seguir', W / 2, H / 2 + 36, 22, '#d8d0e8', 'center'); },
  },
  results: {
    update(dt) {
      state.t += dt; state.resultsT = (state.resultsT || 0) + dt; updFx(dt);
      if (state.resultsT > 1 && pressed('Enter')) goCamp(state.opened ? `Se abrió en el mapa: ${state.opened}.` : 'De vuelta en el campamento.');
    },
    draw() {
      drawArena(THEMES[5]); ctx.fillStyle = 'rgba(6,8,22,0.55)'; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.shadowColor = GOLD; ctx.shadowBlur = 20; txt(state.gained || '¡Mazmorra superada!', W / 2, 90, 46, '#ffe39a', 'center', true); ctx.restore();
      txt('La mazmorra está a salvo. Tu equipo:', W / 2, 140, 20, '#e8fbff', 'center');
      if (state.opened) txt(`En el mapa se abre: ${state.opened}`, W / 2, 176, 20, '#ffd36b', 'center', true);
      state.team.forEach((p, i) => { const x = 640 + (i - (state.team.length - 1) / 2) * 250; drawFigure(p.sp, x, 400, 1, 1, { t: state.t + i, side: 'team' }); txt(`${nameOf(p)}  Nv ${p.lv}`, x, 432, 18, '#fff', 'center', true); });
      const st = state.stats, mm = Math.floor(st.time / 60), ss = Math.floor(st.time % 60);
      panel(290, 470, 700, 170, GOLD, 0.9);
      txt(`Tiempo ${mm}:${String(ss).padStart(2, '0')}   ·   Combates ${st.battles}   ·   Caídas ${st.falls}`, W / 2, 504, 19, '#fff6dc', 'center', true);
      txt(`Golpes perfectos ${st.perfects}   ·   Paradas ${st.parries}`, W / 2, 540, 19, '#bfefff', 'center', true);
      txt(`Mascotas convencidas con tu canción ${st.tamed}`, W / 2, 576, 19, '#d8ffd0', 'center', true);
      txt('Enter para volver al campamento', W / 2, 616, 18, '#e8e0f0', 'center');
    },
  },
};

// ---- Loop: fixed step, frame time clamped ---------------------------------------------
function step() {
  if (pressed('KeyM')) { setMuted(!muted); hit.delete('KeyM'); }
  scenes[scene].update(STEP); hit.clear();
}
let last = 0, acc = 0, ALPHA = 1;
function tick() {
  const now = clock.now();
  acc += Math.min(now - last, 0.25); last = now;
  while (acc >= STEP) { step(); acc -= STEP; }
  ALPHA = acc / STEP;
  drawFrame();
}
function drawFrame() { setCtx(mainCtx); scenes[scene].draw(); }
function frame() { tick(); requestAnimationFrame(frame); }
function timer() { if (document.visibilityState === 'visible' && clock.now() - last > 0.1) tick(); }

// ---- What a check can read and drive (?manual=1 stops the loop; players never see it) ----
install({
  get scene() { return scene; },
  get state() { return state; },
  press(code) { hit.add(code); },
  hold(code, on) { on ? down.add(code) : down.delete(code); },
  get events() { return events; },
  step(n = 1, draw = true, alpha = 1) {
    for (let i = 0; i < n; i++) step();
    if (draw) { ALPHA = alpha; drawFrame(); }
  },
});

reset();
refreshTitle();
scene = params.get('scene') || 'title';
last = clock.now();
if (manual) drawFrame();
else { requestAnimationFrame(frame); setInterval(timer, 50); }

