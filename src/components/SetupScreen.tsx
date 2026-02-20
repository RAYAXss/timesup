import { useState } from 'react';
import { Users, Clock, Target } from 'lucide-react';
import { GameSettings, Team, Player, Difficulty } from '../types/game';

interface SetupScreenProps {
  onStart: (settings: GameSettings, teams: Team[]) => void;
}

export default function SetupScreen({ onStart }: SetupScreenProps) {
  const [numberOfTeams, setNumberOfTeams] = useState(2);
  const [playersPerTeam, setPlayersPerTeam] = useState(2);
  const [difficulty, setDifficulty] = useState<Difficulty>('moyen');
  const [timePerPlayer, setTimePerPlayer] = useState(30);
  const [playerNames, setPlayerNames] = useState<string[][]>([
    ['Joueur 1', 'Joueur 2'],
    ['Joueur 3', 'Joueur 4'],
  ]);

  const updatePlayerName = (teamIndex: number, playerIndex: number, name: string) => {
    const newNames = [...playerNames];
    if (!newNames[teamIndex]) {
      newNames[teamIndex] = [];
    }
    newNames[teamIndex][playerIndex] = name;
    setPlayerNames(newNames);
  };

  const handleStart = () => {
    const teams: Team[] = [];
    for (let i = 0; i < numberOfTeams; i++) {
      const players: Player[] = [];
      for (let j = 0; j < playersPerTeam; j++) {
        players.push({
          id: i * playersPerTeam + j,
          name: playerNames[i]?.[j] || `Joueur ${i * playersPerTeam + j + 1}`,
          teamId: i,
        });
      }
      teams.push({
        id: i,
        name: `Équipe ${i + 1}`,
        score: 0,
        players,
      });
    }

    const settings: GameSettings = {
      numberOfTeams,
      playersPerTeam,
      difficulty,
      timePerPlayer,
    };

    onStart(settings, teams);
  };

  const updateTeamCount = (count: number) => {
    setNumberOfTeams(count);
    const newNames = [...playerNames];
    while (newNames.length < count) {
      const teamIndex = newNames.length;
      const teamPlayers = [];
      for (let i = 0; i < playersPerTeam; i++) {
        teamPlayers.push(`Joueur ${teamIndex * playersPerTeam + i + 1}`);
      }
      newNames.push(teamPlayers);
    }
    setPlayerNames(newNames);
  };

  const updatePlayersCount = (count: number) => {
    setPlayersPerTeam(count);
    const newNames = playerNames.map((team, teamIndex) => {
      const newTeam = [...team];
      while (newTeam.length < count) {
        newTeam.push(`Joueur ${teamIndex * count + newTeam.length + 1}`);
      }
      return newTeam.slice(0, count);
    });
    setPlayerNames(newNames);
  };

  return (
    <div className="min-h-screen bg -500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-4xl w-full">
        <h1 className="text-5xl font-bold text-center mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Time's Up!
        </h1>
        <p className="text-center text-gray-600 mb-8">Configurez votre partie</p>

        <div className="space-y-6">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Users className="text-purple-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Équipes</h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre d'équipes
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => updateTeamCount(num)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                        numberOfTeams === num
                          ? 'bg-purple-600 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-700 hover:bg-purple-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Joueurs par équipe
                </label>
                <div className="flex gap-2">
                  {[2, 3, 4].map((num) => (
                    <button
                      key={num}
                      onClick={() => updatePlayersCount(num)}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-all ${
                        playersPerTeam === num
                          ? 'bg-pink-600 text-white shadow-lg scale-105'
                          : 'bg-white text-gray-700 hover:bg-pink-100'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: numberOfTeams }).map((_, teamIndex) => (
                <div key={teamIndex} className="bg-white rounded-xl p-4 shadow">
                  <h3 className="font-semibold text-gray-800 mb-3">
                    Équipe {teamIndex + 1}
                  </h3>
                  <div className="space-y-2">
                    {Array.from({ length: playersPerTeam }).map((_, playerIndex) => (
                      <input
                        key={playerIndex}
                        type="text"
                        value={playerNames[teamIndex]?.[playerIndex] || ''}
                        onChange={(e) =>
                          updatePlayerName(teamIndex, playerIndex, e.target.value)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={`Joueur ${playerIndex + 1}`}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-pink-50 to-red-50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Target className="text-pink-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Difficulté</h2>
            </div>
            <div className="flex gap-3">
              {(['facile', 'moyen', 'difficile'] as Difficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setDifficulty(diff)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium capitalize transition-all ${
                    difficulty === diff
                      ? 'bg-gradient-to-r from-pink-600 to-red-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-pink-100'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="text-red-600" size={24} />
              <h2 className="text-xl font-semibold text-gray-800">Temps par joueur</h2>
            </div>
            <div className="flex gap-3">
              {[30, 45, 60].map((time) => (
                <button
                  key={time}
                  onClick={() => setTimePerPlayer(time)}
                  className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
                    timePerPlayer === time
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg scale-105'
                      : 'bg-white text-gray-700 hover:bg-red-100'
                  }`}
                >
                  {time}s
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white py-4 rounded-2xl font-bold text-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          >
            Lancer la partie 🎮
          </button>
        </div>
      </div>
    </div>
  );
}
