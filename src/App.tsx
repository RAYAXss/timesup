import { lazy, Suspense, useState } from 'react';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import ResultsScreen from './components/ResultsScreen';
import { GameSettings, Team } from './types/game';

// three.js is ~150 kB gzipped: load it after the UI is up
const Background = lazy(() => import('./three/Background'));

type Screen = 'setup' | 'game' | 'results';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('setup');
  const [gameSettings, setGameSettings] = useState<GameSettings | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [finalTeams, setFinalTeams] = useState<Team[]>([]);
  const [roundScores, setRoundScores] = useState<number[][]>([]);

  const handleStartGame = (settings: GameSettings, initialTeams: Team[]) => {
    setGameSettings(settings);
    setTeams(initialTeams);
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
        <Background mode={currentScreen === 'game' ? 'game' : 'menu'} enabled />
      </Suspense>
      <div className="relative z-10">
      {currentScreen === 'setup' && <SetupScreen onStart={handleStartGame} />}
      {currentScreen === 'game' && gameSettings && (
        <GameScreen settings={gameSettings} teams={teams} onGameEnd={handleGameEnd} />
      )}
      {currentScreen === 'results' && (
        <ResultsScreen
          teams={finalTeams}
          roundScores={roundScores}
          onBackToMenu={handleBackToMenu}
        />
      )}
      </div>
    </>
  );
}

export default App;
