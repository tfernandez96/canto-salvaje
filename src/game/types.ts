// The shapes the game passes around.

/** Objects the code builds field by field (the run's state, a battle, an action, a song): typing still to do. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Loose = any;

/** Which side of a battle. */
export type Side = 'team' | 'enemy';

/** A type in the loop Brasa > Brote > Marea > Brasa, or Neutro. */
export interface TypeInfo { name: string; col: string; beats: string | null }

/** A move: power per hit, how many timed rings, what it targets and what it does. */
export interface Move {
  name: string; type: string; en: number; pow: number; hits: number;
  target: 'one' | 'all' | 'ally' | 'team' | 'self'; kind: 'hit' | 'heal' | 'guard';
  ring?: number; feint?: boolean; drain?: number; keys?: string[]; gain?: number; parry?: number;
}

/** A creature kind: stats at level 1 and per level after it, the moves it learns, how it draws. */
export interface Species {
  name: string; type: string; rarity: string; base: number[]; grow: number[];
  learn: Record<number, string[]>; evo?: string; h: number; w: number; desc?: string; evolved?: boolean;
}

/** One creature, on the team or in a battle. */
export interface Pet {
  uid: number; sp: string; lv: number; xp: number; type: string; moves: string[];
  hp: number; maxhp: number; atk: number; def: number; spd: number; en: number; last: number;
  boss: boolean; wild: boolean; guard: boolean; cyc: number; phase: number; warn: boolean;
  flash: number; ghost: number; faintT: number; hop: number; intent?: Loose;
}

/** A room of the dungeon: its tiles, its torches and its wild groups. */
export interface Room {
  name: string; torches: number[]; theme: number; spawn?: number[]; map: string[];
  wilds: { x: number; y: number; group: [string, number][]; boss?: boolean }[];
}

/** A dungeon on the map. */
export interface DungeonDef {
  id: string; name: string; desc: string; boss: string;
  /** The dungeon whose boss opens this one; null for the first. */
  after: string | null;
  /** False for one shown on the map that cannot be entered yet. */
  built: boolean;
  /** Where it sits on the map, and how it is drawn there. */
  x: number; y: number; icon: 'arch' | 'forest';
}

/** A room's colours, for the battle arena. */
export interface Theme { wallTop: string; wallBot: string; floorFar: string; floorNear: string; glow: string; accent: string }

/** A wild group on the dungeon map. */
export interface Wild { x: number; y: number; hx: number; hy: number; group: [string, number][]; alive: boolean; boss: boolean; ph: number }

/** A damage number or a spark. */
export interface Fx { k: string; s?: string; x: number; y: number; vx: number; vy: number; t: number; life: number; col: string; size?: number; g?: number }

/** One timed ring of an action. */
export interface Hit { start: number; impact: number; ringT: number; feint: boolean; judged: boolean; res: string; key: string }

/** A move being acted out: the actor, its target and its rings. */
export interface Action { side: string; i: number; move: string; target: number; t: number; hits: Hit[]; end: number; approach: number; applied?: boolean }

/** A move waiting its turn in the round. */
export interface QueueEntry { side: string; i: number; move: string; target: number; spd: number; pri?: number; tie?: number }

/** A slot on the turn-order strip. */
export interface StripEntry { side: string; i: number; done: boolean }

/** A pet's chosen move for the round. */
export interface Plan { move: string; target: number }

/** A battle in progress. */
export interface Battle {
  phase: string; t: number; en: number; gain: number; enemies: Pet[]; boss: boolean; wi: number; round: number;
  cur: number; sel: number; tgt: number; plans: (Plan | null)[]; queue: QueueEntry[]; act: Action | null;
  strip: StripEntry[]; banner: string; bannerT: number; bannerCol?: string; warnShown: boolean; uids: number[];
  phase2Said: boolean; teamGuard?: boolean; stripIdx: number; doorNews?: boolean;
  /** The enemy and the ally last tapped, aimed at when a move that targets one is tapped. */
  foeTap?: number; allyTap?: number;
}

/** A note of the healing song. */
export interface Note { lane: number; at: number; judged: boolean; res: string; f: number }

/** The healing song, from the offer to the result. */
export interface Song {
  phase: string; cands: number[]; pick: number; t: number; e: Pet; notes: Note[]; beat: number;
  score: number; perfect: number; good: number; miss: number; flashL: number[]; ticks: number; ok?: boolean;
}

/** A pet's row in the victory tally. */
export interface TallyRow { uid: number; gain: number; newbie?: boolean; from: number; to: number; x0: number; x1?: number; lines: string[] }

/** The victory tally. */
export interface Tally { t: number; rows: TallyRow[]; total: number }

/** A step after the tally: learning a move, or evolving. */
export interface PostStep { k: string; uid: number; move?: string }

/** The whole run. */
export interface RunState {
  t: number; score: number; gained: string; mode: string; pick: number; team: Pet[]; room: number;
  rooms: { wilds: Wild[] }[];
  player: { x: number; y: number; face: number; walk: number; trail: number[][] };
  battle: Loose; song: Loose; tally: Loose; post: PostStep[]; learn: Loose; evo: Loose;
  fx: Fx[]; toast: string; toastT: number; fade: number; inv: number; shake: number; fountainT: number;
  tut: { plan: boolean; atk: number; def: number; song: boolean };
  stats: { time: number; battles: number; perfects: number; parries: number; tamed: number; falls: number; released: number };
  resultsT?: number;
  /** Dungeons whose boss was beaten, by id. */
  cleared: string[];
  /** The dungeon being explored. */
  dungeon: string;
  /** Cursors of the camp menu and the map. */
  campSel: number; mapSel: number;
  /** A dungeon the last boss opened, for the results screen. */
  opened: string | null;
}
