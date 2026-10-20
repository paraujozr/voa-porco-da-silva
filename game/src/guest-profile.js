import {readSave, writeSave} from './config.js';
import {freshProfile} from '../core/engine.js';

// Guest progress lives in localStorage under two keys:
//  - 'voaporco-beta-save' (config.js): coins, unlocks, mute/quality flags. Its `best` map is
//    the pre-1.2 per-map record, kept untouched as `legacyBest`.
//  - 'voaporco-guest-profile-canos': nickname, per map:difficulty records (counted in pipes),
//    ranked bests, lifetime coins and run count.
// Older builds used 'voaporco-guest-profile' (before records were counted in pipes); it is
// still read once so a returning player keeps their nickname and totals.
const PROFILE_KEY = 'voaporco-guest-profile-canos';
const LEGACY_PROFILE_KEY = 'voaporco-guest-profile';
const DEFAULT_NICKNAME = 'Porco Visitante';

function readProfileMeta(storage) {
  try {
    const current = JSON.parse(storage.getItem(PROFILE_KEY) || 'null');
    if (current) return current;
    const previous = JSON.parse(storage.getItem(LEGACY_PROFILE_KEY) || '{}');
    return {...previous, best: null, ranked: {}};
  } catch {
    return {};
  }
}

// Pre-difficulty records were keyed by map id only; they belong to the "normal" difficulty.
const migrateBest = best =>
  Object.fromEntries(
    Object.entries(best).map(([key, value]) => [key.includes(':') ? key : `${key}:normal`, value]),
  );

export function loadGuestProfile(storage) {
  const save = readSave(storage);
  const meta = readProfileMeta(storage);
  return {
    ...freshProfile(meta.nickname || DEFAULT_NICKNAME),
    ...save,
    legacyBest: save.best,
    best: meta.best || migrateBest(save.best),
    ranked: meta.ranked || {},
    totalCoins: meta.totalCoins || save.coins,
    runs: meta.runs || 0,
    nickname: meta.nickname || DEFAULT_NICKNAME,
  };
}

export function saveGuestProfile(storage, profile) {
  writeSave(storage, {...profile, best: profile.legacyBest || {}});
  try {
    storage.setItem(
      PROFILE_KEY,
      JSON.stringify({
        nickname: profile.nickname,
        best: profile.best,
        ranked: profile.ranked,
        totalCoins: profile.totalCoins,
        runs: profile.runs,
      }),
    );
  } catch {}
}
