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
    <div className="min-h-screen bg-gradient-to-br from-yellow-400 via-sky-300 to-blue-600 p-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden mb-6">
          <div className="bg-gradient-to-r from-yellow-400 via-sky-400 to-blue-600 p-6 md:p-8 text-center">
            <Trophy className="mx-auto mb-4 text-white" size={64} />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Victoire !</h1>
            <p className="text-xl md:text-2xl text-white font-semibold">{winner.name}</p>
            <p className="text-3xl md:text-4xl font-bold text-white mt-4">{winner.score} points</p>
          </div>

          <div className="p-5 md:p-8">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 flex items-center gap-3">
              <TrendingUp className="text-blue-600" size={32} />
              Classement final
            </h2>

            <div className="space-y-4 mb-8">
              {sortedTeams.map((team, index) => (
                <div
                  key={team.id}
                  className={`bg-gradient-to-r ${getPositionColor(index)} rounded-2xl p-4 md:p-6 text-white shadow-lg transform transition-all hover:scale-102`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                      <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16 bg-white bg-opacity-30 rounded-full flex-shrink-0">
                        {getPositionIcon(index)}
                      </div>
                      <div>
                        <p className="text-xl md:text-2xl font-bold">{team.name}</p>
                        <p className="text-xs md:text-sm opacity-90">
                          {team.players.map((p) => p.name).join(', ')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl md:text-5xl font-bold">{team.score}</p>
                      <p className="text-xs md:text-sm opacity-90">points</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <h3 className="text-xl md:text-2xl font-bold text-gray-800 mb-4">
              Détails par round
            </h3>

            <div className="overflow-x-auto rounded-xl">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-yellow-100 to-sky-100">
                    <th className="px-3 md:px-4 py-3 text-left font-semibold text-gray-800 rounded-tl-xl text-sm md:text-base">
                      Équipe
                    </th>
                    {[0, 1, 2].map((roundIndex) => (
                      <th
                        key={roundIndex}
                        className={`px-3 md:px-4 py-3 text-center font-semibold text-gray-800 text-sm md:text-base ${
                          roundIndex === 2 ? 'rounded-tr-xl' : ''
                        }`}
                      >
                        {getRoundName(roundIndex)}
                      </th>
                    ))}
                    <th className="px-3 md:px-4 py-3 text-center font-semibold text-gray-800 text-sm md:text-base">
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
                      } hover:bg-sky-50 transition-colors`}
                    >
                      <td className="px-3 md:px-4 py-3 font-medium text-gray-800 text-sm md:text-base">
                        {team.name}
                      </td>
                      {[0, 1, 2].map((roundIndex) => {
                        const originalIndex = teams.findIndex((t) => t.id === team.id);
                        const score = roundScores[roundIndex]?.[originalIndex] || 0;
                        return (
                          <td key={roundIndex} className="px-3 md:px-4 py-3 text-center text-gray-700 text-sm md:text-base">
                            {score}
                          </td>
                        );
                      })}
                      <td className="px-3 md:px-4 py-3 text-center font-bold text-blue-600 text-sm md:text-base">
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
          className="w-full bg-white text-blue-600 py-4 rounded-2xl font-bold text-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200 flex items-center justify-center gap-3"
        >
          <Home size={24} />
          Retour au menu
        </button>
      </div>
    </div>
  );
}