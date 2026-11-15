import { AppSettings, Difficulty, GameSettings, GameState, Team } from '../types/game';

export const APP_KEY = 'timesup.app';
export const GAME_KEY = 'timesup.game';
export const CURRENT_KEY = 'timesup.current';

// game in progress, saved at the start of each turn so a reload can resume it
export interface SavedGame {
  settings: GameSettings;
  state: GameState;
}

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

export function isSavedGame(v: unknown): v is SavedGame {
  if (!isObj(v) || !isObj(v.settings) || !isObj(v.state)) return false;
  const s = v.settings;
  const g = v.state;
  if (!Array.isArray(g.teams) || !g.teams.every((t) => isTeam(t) && typeof t.score === 'number')) return false;
  const teams = g.teams as Team[];
  return (
    DIFFICULTIES.includes(s.difficulty as Difficulty) &&
    TIME_CHOICES.includes(s.timePerPlayer as number) &&
    teams.length >= 2 &&
    Number.isInteger(g.currentTeamIndex) &&
    (g.currentTeamIndex as number) >= 0 &&
    (g.currentTeamIndex as number) < teams.length &&
    Array.isArray(g.playerIdx) &&
    g.playerIdx.length === teams.length &&
    g.playerIdx.every((i, k) => Number.isInteger(i) && i >= 0 && i < teams[k].players.length) &&
    [1, 2, 3].includes(g.currentRound as number) &&
    Array.isArray(g.deck) &&
    g.deck.length > 0 &&
    g.deck.every(isObj) &&
    Array.isArray(g.usedCards) &&
    Array.isArray(g.roundScores) &&
    g.roundScores.length === 3
  );
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // storage blocked: nothing to remove
  }
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
