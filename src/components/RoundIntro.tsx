import { Play, User2, Layers } from 'lucide-react';
import { RoundInfo } from '../data/rounds';

interface RoundIntroProps {
  roundInfo: RoundInfo;
  totalRounds: number;
  playerName: string;
  teamName: string;
  cardsRemaining: number;
  /** true au tout premier tour d'une manche : on met en avant la nouvelle règle. */
  isNewRound: boolean;
  onReady: () => void;
}

/**
 * Écran de transition affiché avant chaque tour, sur le thème immersif du jeu.
 * Il rappelle clairement la règle de la manche en cours pour que personne ne
 * soit perdu, puis qui doit jouer, avant de lancer le compte à rebours.
 */
export default function RoundIntro({
  roundInfo,
  totalRounds,
  playerName,
  teamName,
  cardsRemaining,
  isNewRound,
  onReady,
}: RoundIntroProps) {
  return (
    <div className="game-bg min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-rise-in">
        {/* Bandeau manche */}
        <div className="text-center mb-4">
          <span className="inline-block text-white/60 text-sm font-semibold tracking-widest uppercase">
            {isNewRound ? '✨ Nouvelle manche' : 'Manche en cours'}
          </span>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Explication de la règle du round */}
          <div className={`bg-gradient-to-br ${roundInfo.accent} p-6 text-white text-center`}>
            <div className="text-5xl mb-2 animate-pop-in">{roundInfo.emoji}</div>
            <p className="text-white/80 text-xs font-bold tracking-widest uppercase">
              Manche {roundInfo.round} / {totalRounds}
            </p>
            <h2 className="text-3xl font-black mt-1">{roundInfo.title}</h2>
            <p className="text-white/95 text-sm leading-relaxed mt-3 px-2">{roundInfo.rule}</p>
          </div>

          {/* Qui joue */}
          <div className="p-6">
            <div className="flex items-center gap-3 bg-gray-50 rounded-2xl p-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                <User2 className="text-white" size={24} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">C'est au tour de</p>
                <p className="font-bold text-gray-800 text-lg leading-tight truncate">{playerName}</p>
                <p className="text-sm text-indigo-500 font-medium truncate">{teamName}</p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-sm text-gray-500 mb-5">
              <Layers size={16} />
              {cardsRemaining} carte{cardsRemaining > 1 ? 's' : ''} dans la manche
            </div>

            <button
              onClick={onReady}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 text-white py-4 rounded-2xl font-bold text-xl shadow-lg hover:shadow-2xl hover:brightness-110 active:scale-[0.98] transition-all"
            >
              <Play size={22} fill="currentColor" />
              Prêt !
            </button>
          </div>
        </div>

        <p className="text-center text-white/50 text-xs mt-4">
          Le compte à rebours démarre dès que tu es prêt.
        </p>
      </div>
    </div>
  );
}
