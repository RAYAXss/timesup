import { createContext, useContext, useState, ReactNode } from 'react';
import { GameSettings, Team } from '../types/game';

interface Results {
  teams: Team[];
  roundScores: number[][];
}

interface GameContextValue {
  settings: GameSettings | null;
  teams: Team[];
  results: Results | null;
  /** Démarre une partie : mémorise la configuration et les équipes. */
  startGame: (settings: GameSettings, teams: Team[]) => void;
  /** Termine une partie : mémorise les scores finaux. */
  endGame: (teams: Team[], roundScores: number[][]) => void;
  /** Réinitialise tout (retour au menu). */
  reset: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<GameSettings | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<Results | null>(null);

  const startGame = (nextSettings: GameSettings, nextTeams: Team[]) => {
    setSettings(nextSettings);
    setTeams(nextTeams);
    setResults(null);
  };

  const endGame = (endTeams: Team[], roundScores: number[][]) => {
    setResults({ teams: endTeams, roundScores });
  };

  const reset = () => {
    setSettings(null);
    setTeams([]);
    setResults(null);
  };

  return (
    <GameContext.Provider value={{ settings, teams, results, startGame, endGame, reset }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame doit être utilisé dans un <GameProvider>');
  return ctx;
}
