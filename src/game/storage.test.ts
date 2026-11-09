import { describe, it, expect, beforeEach, vi } from 'vitest';
import { load, save, isAppSettings, isGameSetup, DEFAULT_APP_SETTINGS, GameSetup } from './storage';
import { defaultTeams } from './teams';

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
  });
});

const fallback: GameSetup = { teams: defaultTeams(), difficulty: 'moyen', timePerPlayer: 30 };

describe('storage', () => {
  it('returns fallback on invalid JSON', () => {
    store.set('timesup.game', '{oops');
    expect(load('timesup.game', fallback, isGameSetup)).toBe(fallback);
  });

  it('returns fallback for the old setup shape', () => {
    store.set('timesup.game', JSON.stringify({ numberOfTeams: 2, playersPerTeam: 2 }));
    expect(load('timesup.game', fallback, isGameSetup)).toBe(fallback);
  });

  it('round-trips a valid value', () => {
    const value: GameSetup = { teams: defaultTeams(), difficulty: 'difficile', timePerPlayer: 45 };
    save('timesup.game', value);
    expect(load('timesup.game', fallback, isGameSetup)).toEqual(value);
  });

  it('returns fallback when localStorage throws', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
    });
    expect(() => save('timesup.app', DEFAULT_APP_SETTINGS)).not.toThrow();
    expect(load('timesup.app', DEFAULT_APP_SETTINGS, isAppSettings)).toBe(DEFAULT_APP_SETTINGS);
  });

  it('rejects app settings with a bad volume', () => {
    store.set('timesup.app', JSON.stringify({ ...DEFAULT_APP_SETTINGS, volume: 7 }));
    expect(load('timesup.app', DEFAULT_APP_SETTINGS, isAppSettings)).toBe(DEFAULT_APP_SETTINGS);
  });
});
