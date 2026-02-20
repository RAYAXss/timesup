import { Trophy, Medal, Home, TrendingUp } from 'lucide-react';
import { Team } from '../types/game';

interface ResultsScreenProps {
  teams: Team[];
  roundScores: number[][];
  onBackToMenu: () => void;
}

export default function ResultsScreen({ teams, roundScores, onBackToMenu }: ResultsScreenProps) {
  const sortedTeams = [...teams].sort((a, b) => b.score - a.score);
  const winner = sortedTeams[0];

  const getRoundName = (round: number) => {
    const names = ['Description', 'Un seul mot', 'Mime'];
    return names[round] || `Round ${round + 1}`;
  };

  const getPositionColor = (index: number) => {
    const colors = [
      'from-yellow-400 to-yellow-600',
      'from-gray-300 to-gray-500',
      'from-orange-400 to-orange-600',
      'from-blue-400 to-blue-600',
    ];
    return colors[index] || 'from-purple-400 to-purple-600';
  };

  const getPositionIcon = (index: number) => {
    if (index === 0) return <Trophy size={32} />;
    if (index === 1) return <Medal size={32} />;
    if (index === 2) return <Medal size={28} />;
    return <Medal size={24} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 p-8 text-center">
            <Trophy className="mx-auto mb-4 text-white" size={64} />
            <h1 className="text-5xl font-bold text-white mb-2">Victoire !</h1>
            <p className="text-2xl text-white font-semibold">{winner.name}</p>
            <p className="text-4xl font-bold text-white mt-4">{winner.score} points</p>
          </div>

          <div className="p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <TrendingUp className="text-purple-600" size={32} />
              Classement final
            </h2>

            <div className="space-y-4 mb-8">
              {sortedTeams.map((team, index) => (
                <div
                  key={team.id}
                  className={`bg-gradient-to-r ${getPositionColor(index)} rounded-2xl p-6 text-white shadow-lg transform transition-all hover:scale-102`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-16 h-16 bg-white bg-opacity-30 rounded-full">
                        {getPositionIcon(index)}
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{team.name}</p>
                        <p className="text-sm opacity-90">
                          {team.players.map((p) => p.name).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-5xl font-bold">{team.score}</p>
                      <p className="text-sm opacity-90">points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-2xl font-bold text-gray-800 mb-4">
              Détails par round
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-purple-100 to-pink-100">
                    <th className="px-4 py-3 text-left font-semibold text-gray-800 rounded-tl-xl">
                      Équipe
                    </th>
                    {[0, 1, 2].map((roundIndex) => (
                      <th
                        key={roundIndex}
                        className={`px-4 py-3 text-center font-semibold text-gray-800 ${
                          roundIndex === 2 ? 'rounded-tr-xl' : ''
                        }`}
                      >
                        {getRoundName(roundIndex)}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-center font-semibold text-gray-800">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedTeams.map((team, teamIndex) => (
                    <tr
                      key={team.id}
                      className={`${
                        teamIndex % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      } hover:bg-purple-50 transition-colors`}
                    >
                      <td className="px-4 py-3 font-medium text-gray-800">
                        {team.name}
                      </td>
                      {[0, 1, 2].map((roundIndex) => {
                        const originalIndex = teams.findIndex((t) => t.id === team.id);
                        const score = roundScores[roundIndex]?.[originalIndex] || 0;
                        return (
                          <td key={roundIndex} className="px-4 py-3 text-center text-gray-700">
                            {score}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-bold text-purple-600">
                        {team.score}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <button
          onClick={onBackToMenu}
          className="w-full bg-white text-purple-600 py-4 rounded-2xl font-bold text-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
        >
          <Home size={24} />
          Retour au menu
        </button>
      </div>
    </div>
  );
}
