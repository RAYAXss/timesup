import { AppSettings, Difficulty, Team } from '../types/game';

export const APP_KEY = 'timesup.app';
export const GAME_KEY = 'timesup.game';

export const DEFAULT_APP_SETTINGS: AppSettings = {
  soundOn: true,
  volume: 0.8,
  vibration: true,
  animations: true,
};

export interface GameSetup {
  teams: Team[];
  difficulty: Difficulty;
  timePerPlayer: number;
}

export const TIME_CHOICES = [30, 45, 60];
const DIFFICULTIES: Difficulty[] = ['facile', 'moyen', 'difficile'];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;

export function isAppSettings(v: unknown): v is AppSettings {
  return (
    isObj(v) &&
    typeof v.soundOn === 'boolean' &&
    typeof v.vibration === 'boolean' &&
    typeof v.animations === 'boolean' &&
    typeof v.volume === 'number' &&
    v.volume >= 0 &&
    v.volume <= 1
  );
}

const isTeam = (t: unknown) =>
  isObj(t) &&
  typeof t.id === 'number' &&
  typeof t.name === 'string' &&
  Array.isArray(t.players) &&
  t.players.every((p) => isObj(p) && typeof p.id === 'number' && typeof p.name === 'string');

export function isGameSetup(v: unknown): v is GameSetup {
  return (
    isObj(v) &&
    Array.isArray(v.teams) &&
    v.teams.length >= 2 &&
    v.teams.length <= 4 &&
    v.teams.every(isTeam) &&
    DIFFICULTIES.includes(v.difficulty as Difficulty) &&
    TIME_CHOICES.includes(v.timePerPlayer as number)
  );
}

export function load<T>(key: string, fallback: T, isValid: (v: unknown) => v is T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const parsed: unknown = JSON.parse(raw);
    return isValid(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or blocked: settings just won't persist
  }
}
