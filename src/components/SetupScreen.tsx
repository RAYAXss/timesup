import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Clock, Target, BookOpen, Settings2, ChevronDown, Rocket, Check } from 'lucide-react';
import { GameSettings, Team, Player, Difficulty } from '../types/game';
import { PRESETS, Preset } from '../data/rounds';
import { useGame } from '../context/GameContext';
import RulesModal from './RulesModal';

/** Génère des noms de joueurs par défaut pour la config donnée, en conservant
 *  autant que possible les noms déjà saisis. */
function buildNames(teams: number, perTeam: number, existing: string[][] = []): string[][] {
  return Array.from({ length: teams }, (_, t) =>
    Array.from({ length: perTeam }, (_, p) =>
      existing[t]?.[p] || `Joueur ${t * perTeam + p + 1}`
    )
  );
}

export default function SetupScreen() {
  const navigate = useNavigate();
  const { startGame } = useGame();

  const [numberOfTeams, setNumberOfTeams] = useState(2);
  const [playersPerTeam, setPlayersPerTeam] = useState(2);
  const [difficulty, setDifficulty] = useState<Difficulty>('moyen');
  const [timePerPlayer, setTimePerPlayer] = useState(30);
  const [playerNames, setPlayerNames] = useState<string[][]>(buildNames(2, 2));
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [showCustom, setShowCustom] = useState(false);

  // Toute modification manuelle « détache » le preset sélectionné.
  const markCustom = () => setSelectedPreset(null);

  const applyPreset = (preset: Preset) => {
    setSelectedPreset(preset.id);
    setNumberOfTeams(preset.numberOfTeams);
    setPlayersPerTeam(preset.playersPerTeam);
    setDifficulty(preset.difficulty);
    setTimePerPlayer(preset.timePerPlayer);
    setPlayerNames((prev) => buildNames(preset.numberOfTeams, preset.playersPerTeam, prev));
  };

  const updatePlayerName = (teamIndex: number, playerIndex: number, name: string) => {
    setPlayerNames((prev) => {
      const next = prev.map((t) => [...t]);
      if (!next[teamIndex]) next[teamIndex] = [];
      next[teamIndex][playerIndex] = name;
      return next;
    });
  };

  const updateTeamCount = (count: number) => {
    markCustom();
    setNumberOfTeams(count);
    setPlayerNames((prev) => buildNames(count, playersPerTeam, prev));
  };

  const updatePlayersCount = (count: number) => {
    markCustom();
    setPlayersPerTeam(count);
    setPlayerNames((prev) => buildNames(numberOfTeams, count, prev));
  };

  const handleStart = () => {
    const teams: Team[] = Array.from({ length: numberOfTeams }, (_, i) => {
      const players: Player[] = Array.from({ length: playersPerTeam }, (_, j) => ({
        id: i * playersPerTeam + j,
        name: playerNames[i]?.[j]?.trim() || `Joueur ${i * playersPerTeam + j + 1}`,
        teamId: i,
      }));
      return { id: i, name: `Équipe ${i + 1}`, score: 0, players };
    });

    const settings: GameSettings = { numberOfTeams, playersPerTeam, difficulty, timePerPlayer };
    startGame(settings, teams);
    navigate('/game');
  };

  const summary = `${numberOfTeams} équipes · ${playersPerTeam} joueurs · ${difficulty} · ${timePerPlayer}s`;

  return (
    <>
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      <div className="menu-bg relative min-h-screen overflow-hidden flex items-center justify-center p-4">
        {/* Blobs décoratifs */}
        <div className="blob bg-amber-300 w-72 h-72 top-[-4rem] left-[-3rem]" />
        <div className="blob bg-fuchsia-400 w-80 h-80 bottom-[-5rem] right-[-4rem]" style={{ animationDelay: '4s' }} />

        <div className="relative w-full max-w-3xl my-6 animate-rise-in">
          {/* En-tête */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur px-4 py-1.5 rounded-full text-white/90 text-xs font-semibold tracking-widest uppercase mb-4">
              ⏳ Le jeu d'ambiance en 3 manches
            </div>
            <h1 className="text-5xl md:text-6xl font-black text-white drop-shadow-lg tracking-tight">
              Time's Up<span className="text-amber-300">!</span>
            </h1>
          </div>

          {/* Carte principale */}
          <div className="bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-5 sm:p-7">
            {/* Barre d'actions */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-xl font-bold text-gray-800">Prêt à jouer ?</h2>
                <p className="text-sm text-gray-500">Choisis une formule et lance-toi.</p>
              </div>
              <button
                onClick={() => setShowRules(true)}
                className="flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl font-semibold text-sm hover:bg-indigo-100 active:scale-95 transition-all shrink-0"
              >
                <BookOpen size={18} />
                <span className="hidden sm:inline">Règles</span>
              </button>
            </div>

            {/* Presets rapides */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 stagger">
              {PRESETS.map((preset) => {
                const active = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => applyPreset(preset)}
                    className={`relative text-left rounded-2xl p-4 border-2 transition-all active:scale-95 ${
                      active
                        ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-[1.02]'
                        : 'border-gray-200 bg-white hover:border-indigo-300 hover:shadow-md'
                    }`}
                  >
                    {active && (
                      <span className="absolute top-3 right-3 bg-indigo-500 text-white rounded-full p-1">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                    <div className="text-3xl mb-2">{preset.emoji}</div>
                    <div className="font-bold text-gray-800">{preset.name}</div>
                    <div className="text-xs text-gray-500 leading-snug mt-1">{preset.tagline}</div>
                    <div className="text-[11px] font-semibold text-indigo-500 mt-2">
                      {preset.numberOfTeams} éq. · {preset.timePerPlayer}s · {preset.difficulty}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Toggle personnalisation */}
            <button
              onClick={() => setShowCustom((v) => !v)}
              className="w-full flex items-center justify-between gap-2 text-sm font-semibold text-gray-600 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 transition-all"
            >
              <span className="flex items-center gap-2">
                <Settings2 size={18} />
                Personnaliser les règles
              </span>
              <span className="flex items-center gap-2">
                {!showCustom && <span className="text-xs text-gray-400 hidden sm:inline">{summary}</span>}
                <ChevronDown size={18} className={`transition-transform ${showCustom ? 'rotate-180' : ''}`} />
              </span>
            </button>

            {/* Config détaillée */}
            {showCustom && (
              <div className="mt-4 space-y-4 animate-fade-in">
                {/* Équipes */}
                <div className="bg-gradient-to-r from-indigo-50 to-sky-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Users className="text-indigo-500" size={20} />
                    <h3 className="font-semibold text-gray-800">Équipes & joueurs</h3>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Nombre d'équipes</label>
                      <div className="flex gap-2">
                        {[2, 3, 4].map((num) => (
                          <button
                            key={num}
                            onClick={() => updateTeamCount(num)}
                            className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                              numberOfTeams === num
                                ? 'bg-indigo-500 text-white shadow scale-105'
                                : 'bg-white text-gray-700 hover:bg-indigo-100 border border-gray-200'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1.5">Joueurs par équipe</label>
                      <div className="flex gap-2">
                        {[2, 3, 4].map((num) => (
                          <button
                            key={num}
                            onClick={() => updatePlayersCount(num)}
                            className={`flex-1 py-2.5 rounded-lg font-semibold transition-all ${
                              playersPerTeam === num
                                ? 'bg-sky-500 text-white shadow scale-105'
                                : 'bg-white text-gray-700 hover:bg-sky-100 border border-gray-200'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Array.from({ length: numberOfTeams }).map((_, teamIndex) => (
                      <div key={teamIndex} className="bg-white rounded-xl p-3 shadow-sm border border-indigo-100">
                        <h4 className="font-semibold text-gray-700 text-sm mb-2">Équipe {teamIndex + 1}</h4>
                        <div className="space-y-2">
                          {Array.from({ length: playersPerTeam }).map((_, playerIndex) => (
                            <input
                              key={playerIndex}
                              type="text"
                              value={playerNames[teamIndex]?.[playerIndex] || ''}
                              onChange={(e) => updatePlayerName(teamIndex, playerIndex, e.target.value)}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-400 focus:border-transparent text-sm"
                              placeholder={`Joueur ${playerIndex + 1}`}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Difficulté */}
                <div className="bg-gradient-to-r from-sky-50 to-fuchsia-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="text-sky-500" size={20} />
                    <h3 className="font-semibold text-gray-800">Difficulté</h3>
                  </div>
                  <div className="flex gap-2">
                    {(['facile', 'moyen', 'difficile'] as Difficulty[]).map((diff) => (
                      <button
                        key={diff}
                        onClick={() => { markCustom(); setDifficulty(diff); }}
                        className={`flex-1 py-2.5 rounded-lg font-semibold capitalize transition-all text-sm ${
                          difficulty === diff
                            ? 'bg-gradient-to-r from-sky-500 to-indigo-500 text-white shadow scale-105'
                            : 'bg-white text-gray-700 hover:bg-sky-100 border border-gray-200'
                        }`}
                      >
                        {diff}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Temps */}
                <div className="bg-gradient-to-r from-fuchsia-50 to-amber-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="text-fuchsia-500" size={20} />
                    <h3 className="font-semibold text-gray-800">Temps par joueur</h3>
                  </div>
                  <div className="flex gap-2">
                    {[30, 45, 60].map((time) => (
                      <button
                        key={time}
                        onClick={() => { markCustom(); setTimePerPlayer(time); }}
                        className={`flex-1 py-2.5 rounded-lg font-semibold transition-all text-sm ${
                          timePerPlayer === time
                            ? 'bg-gradient-to-r from-fuchsia-500 to-pink-500 text-white shadow scale-105'
                            : 'bg-white text-gray-700 hover:bg-fuchsia-100 border border-gray-200'
                        }`}
                      >
                        {time}s
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Bouton lancer */}
            <button
              onClick={handleStart}
              className="mt-5 w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 text-white py-4 rounded-2xl font-bold text-xl shadow-lg hover:shadow-2xl hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Rocket size={22} />
              Lancer la partie
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
