import { useState } from 'react';
import SetupScreen from './components/SetupScreen';
import GameScreen from './components/GameScreen';
import ResultsScreen from './components/ResultsScreen';
import { GameSettings, Team } from './types/game';

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
    </>
  );
}

export default App;
