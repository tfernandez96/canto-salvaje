// Every tuning value, from data/config.json, and the live tune.<name> reads. No browser in here, so Vitest can load it.

import data from '../../data/config.json';

type ConfigData = typeof data;
/** The keys of data/config.json that hold a tunable number. */
export type TuneKey = { [K in keyof ConfigData]: ConfigData[K] extends { value: number } ? K : never }[keyof ConfigData];

/** data/config.json itself: the tweak panel changes its values in place. */
export const CONFIG = data;

/** Live reads: tune.speed is CONFIG.speed.value as it is now. */
export const tune = new Proxy({}, {
  get: (_, k) => (data as unknown as Record<string, { value: number }>)[k as string].value,
}) as { readonly [K in TuneKey]: number };
