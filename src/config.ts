// Every tuning value, from data/config.json. The tweak panel is on the dev server only: no build has it.

import { CONFIG, tune } from './game/tuning';

export { CONFIG, tune };

declare global {
  interface Window { CONFIG?: unknown }
}
window.CONFIG = CONFIG;
if (import.meta.env.DEV) await import('./dev/tune');
