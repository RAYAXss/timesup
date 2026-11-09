export type Difficulty = 'facile' | 'moyen' | 'difficile';

export interface Card {
  id: number;
  facile: string;
  moyen: string;
  difficile: string;
}

export interface Player {
  id: number;
  name: string;
  teamId: number;
}

export interface Team {
  id: number;
  name: string;
  score: number;
  players: Player[];
}

export interface GameSettings {
  difficulty: Difficulty;
  timePerPlayer: number;
}

export interface GameState {
  teams: Team[];
  currentTeamIndex: number;
  playerIdx: number[]; // speaker index per team
  currentRound: number;
  deck: Card[];
  usedCards: Card[];
  roundScores: number[][];
}

export interface AppSettings {
  soundOn: boolean;
  volume: number; // 0..1
  vibration: boolean;
  animations: boolean;
}
