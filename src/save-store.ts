// The save in this browser's storage. It can be missing or refused (a private window, blocked
// site data), so every read and write is guarded and the game plays on without it.
const KEY = 'canto-salvaje:save';

/** The stored save as parsed JSON, or null when there is none or storage is unavailable. */
export function readSave(): unknown {
  try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}

/** Stores the save; false when the browser refused it. */
export function writeSave(data: unknown): boolean {
  try { localStorage.setItem(KEY, JSON.stringify(data)); return true; } catch { return false; }
}

/** Forgets the stored save. */
export function clearSave(): void {
  try { localStorage.removeItem(KEY); } catch { /* storage unavailable: nothing to clear */ }
}
