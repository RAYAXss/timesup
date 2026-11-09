import { lazy, Suspense, useEffect, useState } from 'react';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import ResultsScreen from './components/ResultsScreen';
import { AppSettings, GameSettings, Team } from './types/game';
import {
  APP_KEY,
  DEFAULT_APP_SETTINGS,
  GAME_KEY,
  GameSetup,
  isAppSettings,
  isGameSetup,
  load,
  save,
} from './game/storage';
import { defaultTeams } from './game/teams';
import { soundEngine } from './game/sound';

// three.js is ~150 kB gzipped: load it after the UI is up
const Background = lazy(() => import('./three/Background'));

type Screen = 'setup' | 'game' | 'results';

const DEFAULT_SETUP: GameSetup = { teams: defaultTeams(), difficulty: 'moyen', timePerPlayer: 30 };

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('setup');
  const [setup, setSetup] = useState<GameSetup>(() => load(GAME_KEY, DEFAULT_SETUP, isGameSetup));
  const [appSettings, setAppSettings] = useState<AppSettings>(() =>
    load(APP_KEY, DEFAULT_APP_SETTINGS, isAppSettings)
  );
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [finalTeams, setFinalTeams] = useState<Team[]>([]);
  const [roundScores, setRoundScores] = useState<number[][]>([]);

  useEffect(() => save(GAME_KEY, setup), [setup]);
  useEffect(() => {
    save(APP_KEY, appSettings);
    soundEngine.setSettings(appSettings);
  }, [appSettings]);

  const handleStartGame = () => {
    let n = 0;
    const startTeams = setup.teams.map((t) => ({
      ...t,
      score: 0,
      players: t.players.map((p) => ({ ...p, name: p.name.trim() || `Joueur ${++n}` })),
    }));
    setGameSettings({ difficulty: setup.difficulty, timePerPlayer: setup.timePerPlayer });
    setTeams(startTeams);
    setCurrentScreen('game');
  };

  const handleGameEnd = (endTeams: Team[], scores: number[][]) => {
    setFinalTeams(endTeams);
    setRoundScores(scores);
    setCurrentScreen('results');
  };

  const handleBackToMenu = () => {
    setCurrentScreen('setup');
    setGameSettings(null);
    setTeams([]);
    setFinalTeams([]);
    setRoundScores([]);
  };

  return (
    <>
      <Suspense fallback={null}>
        <Background mode={currentScreen === 'game' ? 'game' : 'menu'} enabled={appSettings.animations} />
      </Suspense>
      <div className="relative z-10">
        {currentScreen === 'setup' && (
          <SetupScreen
            teams={setup.teams}
            setTeams={(t) => setSetup((s) => ({ ...s, teams: t }))}
            difficulty={setup.difficulty}
            setDifficulty={(difficulty) => setSetup((s) => ({ ...s, difficulty }))}
            timePerPlayer={setup.timePerPlayer}
            setTimePerPlayer={(timePerPlayer) => setSetup((s) => ({ ...s, timePerPlayer }))}
            appSettings={appSettings}
            setAppSettings={setAppSettings}
            onPlay={handleStartGame}
          />
        )}
        {currentScreen === 'game' && gameSettings && (
          <GameScreen settings={gameSettings} teams={teams} onGameEnd={handleGameEnd} />
        )}
        {currentScreen === 'results' && (
          <ResultsScreen teams={finalTeams} roundScores={roundScores} onBackToMenu={handleBackToMenu} />
        )}
      </div>
    </>
  );
}

export default App;
