// The tables: types, moves, creatures, rooms. No browser in here.

import type { Move, Room, Species, Theme, TypeInfo } from './types';

export const TYPES: Record<string, TypeInfo> = {
  brasa: { name: 'Brasa', col: '#ff7a3a', beats: 'brote' },
  brote: { name: 'Brote', col: '#7ccf4f', beats: 'marea' },
  marea: { name: 'Marea', col: '#46a8ff', beats: 'brasa' },
  neutro: { name: 'Neutro', col: '#c9c2b0', beats: null },
};
// pow: power per hit · hits: timed rings · ring: ring-time factor · feint: the ring stops, then snaps
export const MOVES: Record<string, Move> = {
  embestida: { name: 'Embestida', type: 'neutro', en: 0, pow: 8, hits: 1, target: 'one', kind: 'hit' },
  chispazo: { name: 'Chispazo', type: 'brasa', en: 1, pow: 6, hits: 2, target: 'one', kind: 'hit' },
  cola_ignea: { name: 'Cola Ígnea', type: 'brasa', en: 2, pow: 9, hits: 2, target: 'one', kind: 'hit' },
  llamarada: { name: 'Llamarada', type: 'brasa', en: 3, pow: 10, hits: 1, target: 'all', kind: 'hit' },
  latigo_hoja: { name: 'Látigo Hoja', type: 'brote', en: 1, pow: 6, hits: 2, target: 'one', kind: 'hit' },
  brote_curativo: { name: 'Brote Curativo', type: 'brote', en: 2, pow: 0, hits: 1, target: 'ally', kind: 'heal' },
  esporas: { name: 'Tormenta de Esporas', type: 'brote', en: 3, pow: 9, hits: 1, target: 'all', kind: 'hit' },
  burbuja: { name: 'Burbujas', type: 'marea', en: 1, pow: 6, hits: 2, target: 'one', kind: 'hit' },
  escudo_agua: { name: 'Escudo de Agua', type: 'marea', en: 2, pow: 0, hits: 0, target: 'team', kind: 'guard' },
  maremoto: { name: 'Maremoto', type: 'marea', en: 3, pow: 10, hits: 1, target: 'all', kind: 'hit' },
  rodada: { name: 'Rodada Musgosa', type: 'brote', en: 1, pow: 11, hits: 1, target: 'one', kind: 'hit', ring: 1.3 },
  endurecer: { name: 'Endurecer', type: 'neutro', en: 1, pow: 0, hits: 0, target: 'self', kind: 'guard' },
  chorro_doble: { name: 'Chorro Doble', type: 'marea', en: 1, pow: 6, hits: 2, target: 'one', kind: 'hit', ring: 0.8 },
  lengua: { name: 'Lengua Látigo', type: 'neutro', en: 0, pow: 4, hits: 3, target: 'one', kind: 'hit', ring: 0.7 },
  picotazo: { name: 'Picoteo', type: 'neutro', en: 0, pow: 4, hits: 3, target: 'one', kind: 'hit', ring: 0.6 },
  pluma_ardiente: { name: 'Pluma Ardiente', type: 'brasa', en: 2, pow: 8, hits: 2, target: 'one', kind: 'hit', ring: 0.75 },
  latigazo: { name: 'Latigazo Espino', type: 'brote', en: 1, pow: 12, hits: 1, target: 'one', kind: 'hit', feint: true },
  abrazo_zarza: { name: 'Abrazo de Zarza', type: 'brote', en: 2, pow: 7, hits: 2, target: 'one', kind: 'hit', drain: 0.5, feint: true },
  puno_raiz: { name: 'Puño Raíz', type: 'brote', en: 0, pow: 12, hits: 2, target: 'one', kind: 'hit', ring: 1.1 },
  terremoto: { name: 'TERREMOTO', type: 'neutro', en: 0, pow: 7, hits: 4, target: 'all', kind: 'hit', ring: 0.8 },
  marejada: { name: 'Marejada', type: 'marea', en: 0, pow: 9, hits: 3, target: 'one', kind: 'hit', ring: 0.75 },
  descanso: { name: 'Descansar', type: 'neutro', en: 0, pow: 0, hits: 0, target: 'self', kind: 'guard' },
};
// The keys a timed press can use. Each hit wants one of them (MOVE_KEYS), never shown to the player.
export const KEYCAPS = [
  { id: 'W', label: 'W', codes: ['KeyW', 'ArrowUp'] }, { id: 'A', label: 'A', codes: ['KeyA', 'ArrowLeft'] },
  { id: 'S', label: 'S', codes: ['KeyS', 'ArrowDown'] }, { id: 'D', label: 'D', codes: ['KeyD', 'ArrowRight'] },
  { id: 'SPC', label: 'ESPACIO', codes: ['Space'] },
];
// Hidden from the player: the key for each hit, in order (it cycles when a move has more hits than keys).
export const MOVE_KEYS: Record<string, string[]> = {
  embestida: ['SPC'], chispazo: ['D', 'A'], cola_ignea: ['W', 'W'], llamarada: ['S'], latigo_hoja: ['A', 'D'],
  brote_curativo: ['W'], esporas: ['S'], burbuja: ['A', 'A'], maremoto: ['S'], rodada: ['S'], chorro_doble: ['D', 'D'],
  lengua: ['A', 'W', 'D'], picotazo: ['W', 'W', 'W'], pluma_ardiente: ['D', 'SPC'], latigazo: ['A'], abrazo_zarza: ['W', 'S'],
  puno_raiz: ['D', 'A'], terremoto: ['SPC', 'S', 'SPC', 'S'], marejada: ['A', 'D', 'A'],
};
for (const [id, k] of Object.entries(MOVE_KEYS)) MOVES[id].keys = k;
// Free moves give shared energy back when they act.
export const MOVE_GAIN: Record<string, number> = { embestida: 1, picotazo: 1, lengua: 1, descanso: 2 };
for (const [id, g] of Object.entries(MOVE_GAIN)) MOVES[id].gain = g;
// parry_config: how much energy a move's perfect parries are worth, spread over its hits.
// Each perfect parry gives en_parry with chance parry_config / hits (at most 1). Moves not listed use
// tune.parry_config (1). The boss's moves are worth more, since it fights alone.
export const MOVE_PARRY: Record<string, number> = { puno_raiz: 2, marejada: 2.5, terremoto: 3 };
for (const [id, p] of Object.entries(MOVE_PARRY)) MOVES[id].parry = p;
// base and grow: [hp, atk, def, spd] at level 1, and per level after it
export const SPECIES: Record<string, Species> = {
  chispin: { name: 'Chispín', type: 'brasa', rarity: 'inicial', base: [34, 11, 8, 12], grow: [6, 2.2, 1.4, 1.2], learn: { 1: ['embestida', 'chispazo'], 3: ['cola_ignea'], 5: ['llamarada'] }, evo: 'fogaral', h: 92, w: 96, desc: 'Rápido y fogoso: golpes dobles de Brasa.' },
  retoni: { name: 'Retoñí', type: 'brote', rarity: 'inicial', base: [40, 9, 10, 8], grow: [7, 1.8, 1.8, 0.8], learn: { 1: ['embestida', 'latigo_hoja'], 3: ['brote_curativo'], 5: ['esporas'] }, evo: 'frondalce', h: 84, w: 84, desc: 'Resistente: aprende a curar a su equipo.' },
  gotin: { name: 'Gotín', type: 'marea', rarity: 'inicial', base: [37, 10, 9, 10], grow: [6.5, 2, 1.6, 1], learn: { 1: ['embestida', 'burbuja'], 3: ['escudo_agua'], 5: ['maremoto'] }, evo: 'mareon', h: 64, w: 112, desc: 'Equilibrado: aprende a proteger a su equipo.' },
  musgorro: { name: 'Musgorro', type: 'brote', rarity: 'común', base: [26, 8, 10, 5], grow: [6, 1.8, 2, 0.6], learn: { 1: ['embestida', 'rodada'], 4: ['endurecer'], 6: ['esporas'] }, h: 62, w: 104 },
  charquillo: { name: 'Charquillo', type: 'marea', rarity: 'común', base: [22, 9, 7, 11], grow: [5, 2, 1.4, 1.2], learn: { 1: ['embestida', 'chorro_doble'], 4: ['lengua'], 6: ['escudo_agua'] }, h: 58, w: 92 },
  ascuervo: { name: 'Ascuervo', type: 'brasa', rarity: 'rara', base: [20, 11, 6, 15], grow: [4.5, 2.4, 1.2, 1.6], learn: { 1: ['picotazo'], 3: ['pluma_ardiente'], 6: ['llamarada'] }, h: 132, w: 100 },
  zarzalma: { name: 'Zarzalma', type: 'brote', rarity: 'rara', base: [28, 12, 8, 9], grow: [6, 2.5, 1.6, 1], learn: { 1: ['embestida', 'latigazo'], 4: ['abrazo_zarza'], 6: ['brote_curativo'] }, h: 132, w: 92 },
  golem: { name: 'Gólem Raíz', type: 'brote', rarity: 'jefe', base: [110, 13, 12, 7], grow: [13, 2.6, 2.2, 0.6], learn: { 1: ['puno_raiz', 'terremoto', 'marejada'] }, h: 258, w: 270 },
};
// Evolved forms: stronger base, the same moves to learn.
export const EVOS: Record<string, [string, string, number, number]> = { fogaral: ['chispin', 'Fogaral', 132, 136], frondalce: ['retoni', 'Frondalce', 168, 124], mareon: ['gotin', 'Mareón', 138, 120] };
for (const [id, [from, name, h, w]] of Object.entries(EVOS)) {
  const f = SPECIES[from];
  SPECIES[id] = { name, type: f.type, rarity: 'inicial', base: f.base.map((b, i) => b + [12, 4, 3, 2][i]), grow: f.grow.map(g => g * 1.1), learn: f.learn, h, w, evolved: true };
}
export const STARTERS = ['chispin', 'retoni', 'gotin'];

// Rooms: 20 x 10 tiles. # wall · P pillar · ~ water · f fountain · D door on (locked until the room is clear)
// L door back · , moss · g tall grass · . floor
export const ROOMS: Room[] = [
  { name: 'Vestíbulo de la fuente', torches: [7, 12], theme: 0, spawn: [3.5, 4.6], map: [
    '####################',
    '#,,......##.......,#',
    '#.f......##........#',
    '#..................#',
    '#.....,............D',
    '#..................D',
    '#......,...........#',
    '#,.......##.......,#',
    '#,,......##......,,#',
    '####################'],
    wilds: [{ x: 10.5, y: 4.9, group: [['musgorro', 1]] }] },
  { name: 'Galería de los charcos', torches: [7, 14], theme: 1, map: [
    '####################',
    '#.......~~~~.......#',
    '#..,....~~~~...,...#',
    '#...........P......#',
    'L..................D',
    'L.......P..........D',
    '#......,...........#',
    '#...~~~.......g....#',
    '#...~~~.....ggg....#',
    '####################'],
    wilds: [{ x: 5.5, y: 3, group: [['charquillo', 2]] }, { x: 14.5, y: 6.6, group: [['musgorro', 2], ['charquillo', 1]] }] },
  { name: 'Cámara de las raíces', torches: [6, 13], theme: 2, map: [
    '####################',
    '#,,,...........,,,,#',
    '#,..P.......P.....,#',
    '#..................#',
    'L..................D',
    'L..................D',
    '#..................#',
    '#,..P.......P.....,#',
    '#,,,.............,,#',
    '####################'],
    wilds: [{ x: 10, y: 4.9, group: [['charquillo', 3], ['ascuervo', 3], ['musgorro', 3]] }] },
  { name: 'Pasaje de las zarzas', torches: [7, 13], theme: 3, map: [
    '####################',
    '#gg.......#......gg#',
    '#g........#.......g#',
    '#.....P...#...P....#',
    'L..................D',
    'L..................D',
    '#.....P...#...P....#',
    '#g........#.......g#',
    '#gg.......#......gg#',
    '####################'],
    wilds: [{ x: 5, y: 2, group: [['zarzalma', 4]] }, { x: 15, y: 6.8, group: [['ascuervo', 4], ['musgorro', 4]] }] },
  { name: 'Antesala inundada', torches: [5, 14], theme: 4, map: [
    '####################',
    '#,.......~~.......,#',
    '#........~~........#',
    '#...P....~~....P...#',
    'L..................D',
    'L..................D',
    '#...P....~~....P...#',
    '#........~~........#',
    '#,.......~~.......,#',
    '####################'],
    wilds: [{ x: 13.5, y: 4.9, group: [['zarzalma', 5], ['charquillo', 5], ['ascuervo', 4]] }] },
  { name: 'Sala del Guardián', torches: [7, 10, 13], theme: 5, map: [
    '####################',
    '#,,,,..........,,,,#',
    '#,P.....P..P.....P,#',
    '#..................#',
    'L..................#',
    'L..................#',
    '#..................#',
    '#,P.....P..P.....P,#',
    '#,,,,..........,,,,#',
    '####################'],
    wilds: [{ x: 14.5, y: 5.1, group: [['golem', 0]], boss: true }] },
];
export const THEMES: Theme[] = [
  { wallTop: '#3c5560', wallBot: '#1f2d38', floorFar: '#3c4f4e', floorNear: '#5d6f62', glow: '#ffb060', accent: '#5ff2ff' },
  { wallTop: '#2f5266', wallBot: '#162836', floorFar: '#355057', floorNear: '#4f6a6c', glow: '#ffb060', accent: '#46a8ff' },
  { wallTop: '#46503a', wallBot: '#222a1e', floorFar: '#454d3b', floorNear: '#66704f', glow: '#ffbe6a', accent: '#9cff7a' },
  { wallTop: '#4a3f4c', wallBot: '#241c28', floorFar: '#4a4448', floorNear: '#6a5e5c', glow: '#ff9f5a', accent: '#ff6fa8' },
  { wallTop: '#27495a', wallBot: '#10222e', floorFar: '#2e4a52', floorNear: '#466568', glow: '#ffb060', accent: '#5ff2ff' },
  { wallTop: '#4a2a3e', wallBot: '#1c0e1a', floorFar: '#3d2a33', floorNear: '#5d3f40', glow: '#ff7a4a', accent: '#e0315b' },
];

