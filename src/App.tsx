import { lazy, Suspense, useEffect, useState } from 'react';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import ResultsScreen from './components/ResultsScreen';
import { AppSettings, GameSettings, GameState, Team } from './types/game';
import {
  APP_KEY,
  CURRENT_KEY,
  DEFAULT_APP_SETTINGS,
  GAME_KEY,
  GameSetup,
  isAppSettings,
  isGameSetup,
  isSavedGame,
  load,
  remove,
  save,
  SavedGame,
} from './game/storage';
import { defaultTeams } from './game/teams';
import { soundEngine } from './game/sound';

// three.js is ~150 kB gzipped: load it after the UI is up
const Background = lazy(() => import('./three/Background'));

type Screen = 'setup' | 'game' | 'results';

const PATHS: Record<Screen, string> = { setup: '/', game: '/partie', results: '/resultats' };

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
  // unfinished game found at startup: offer to resume it from the menu
  const [resume, setResume] = useState<SavedGame | null>(() => load<SavedGame | null>(CURRENT_KEY, null, isSavedGame));
  const [resumeState, setResumeState] = useState<GameState | undefined>();

  // push only when entering a game, so Back from results/menu never lands on a dead /partie
  const go = (screen: Screen, push = false) => {
    history[push ? 'pushState' : 'replaceState'](null, '', PATHS[screen]);
    setCurrentScreen(screen);
  };

  // every screen needs in-memory state, so a fresh load always starts on the menu
  useEffect(() => {
    if (location.pathname !== '/') history.replaceState(null, '', '/');
  }, []);

  // Back outside a game returns to the menu (GameScreen handles Back itself)
  useEffect(() => {
    if (currentScreen === 'game') return;
    const onBack = () => go('setup');
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, [currentScreen]);

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
    setResumeState(undefined);
    setResume(null);
    go('game', true);
  };

  const handleGameEnd = (endTeams: Team[], scores: number[][]) => {
    setFinalTeams(endTeams);
    setRoundScores(scores);
    remove(CURRENT_KEY);
    go('results');
  };

  const handleBackToMenu = () => {
    remove(CURRENT_KEY);
    go('setup');
    setGameSettings(null);
    setTeams([]);
    setFinalTeams([]);
    setRoundScores([]);
  };

  const handleResume = () => {
    if (!resume) return;
    setGameSettings(resume.settings);
    setTeams(resume.state.teams);
    setResumeState(resume.state);
    setResume(null);
    go('game', true);
  };

  const handleDiscard = () => {
    remove(CURRENT_KEY);
    setResume(null);
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
          <GameScreen
            settings={gameSettings}
            teams={teams}
            initialState={resumeState}
            onGameEnd={handleGameEnd} onQuit={handleBackToMenu} />
        )}
        {currentScreen === 'setup' && resume && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
          >
            <div
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="resume-title"
              className="sheet-up bg-white rounded-3xl shadow-2xl p-6 w-full max-w-sm text-center"
            >
              <div className="text-5xl mb-3">⏯️</div>
              <h2 id="resume-title" className="text-xl font-black text-gray-800 mb-2">
                Voulez-vous reprendre la partie en cours ?
              </h2>
              <p className="text-sm text-gray-500 mb-6">
                Round {resume.state.currentRound}/3 · {resume.state.teams.map((t) => `${t.name} ${t.score}`).join(' · ')}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={handleDiscard}
                  className="flex-1 py-3 rounded-2xl font-bold bg-gray-100 text-gray-700 active:scale-95 transition-transform"
                >
                  Nouvelle partie
                </button>
                <button
                  autoFocus
                  onClick={handleResume}
                  className="flex-1 py-3 rounded-2xl font-bold bg-gradient-to-r from-sky-400 to-blue-600 text-white active:scale-95 transition-transform"
                >
                  Reprendre
                </button>
              </div>
            </div>
          </div>
        )}
        {currentScreen === 'results' && (
          <ResultsScreen teams={finalTeams} roundScores={roundScores} onBackToMenu={handleBackToMenu} />
        )}
      </div>
    </>
  );
}

export default App;
