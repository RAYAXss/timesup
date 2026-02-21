import { X, BookOpen, Trophy, Clock, RotateCcw, ThumbsUp, ThumbsDown } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

export default function RulesModal({ onClose }: RulesModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-yellow-400 via-sky-400 to-blue-600 p-5 rounded-t-3xl flex items-center justify-between sticky top-0">
          <div className="flex items-center gap-3">
            <BookOpen className="text-white" size={26} />
            <h2 className="text-2xl font-bold text-white">Règles du jeu</h2>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all active:scale-95"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-5">

          {/* Principe */}
          <div className="bg-gradient-to-r from-yellow-50 to-sky-50 rounded-2xl p-4">
            <h3 className="font-bold text-gray-800 text-lg mb-2">🎯 Le principe</h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Time's Up! est un jeu d'équipes en <strong>3 rounds</strong>. Les mêmes cartes sont utilisées à chaque round, mais les règles changent. L'équipe qui marque le plus de points gagne !
            </p>
          </div>

          {/* Déroulement */}
          <div>
            <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
              <RotateCcw className="text-sky-500" size={20} />
              Les 3 rounds
            </h3>
            <div className="space-y-3">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-xl p-4">
                <p className="font-bold text-yellow-700 mb-1">Round 1 — Décris le mot 🗣️</p>
                <p className="text-gray-700 text-sm">Tu peux dire autant de mots que tu veux pour faire deviner, <strong>sauf le mot lui-même</strong> ni ses dérivés. Pas de limite de tentatives !</p>
              </div>
              <div className="bg-sky-50 border-l-4 border-sky-400 rounded-xl p-4">
                <p className="font-bold text-sky-700 mb-1">Round 2 — Un seul mot 🤫</p>
                <p className="text-gray-700 text-sm">Tu n'as droit qu'à <strong>un seul mot</strong> pour faire deviner. Choisis-le bien ! Les mêmes cartes qu'au round 1.</p>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 rounded-xl p-4">
                <p className="font-bold text-blue-700 mb-1">Round 3 — Mime ! 🙌</p>
                <p className="text-gray-700 text-sm"><strong>Aucun mot</strong> autorisé, seulement les gestes et le mime. Toujours les mêmes cartes !</p>
              </div>
            </div>
          </div>

          {/* Tour de jeu */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 rounded-2xl p-4">
            <h3 className="font-bold text-gray-800 text-lg mb-3 flex items-center gap-2">
              <Clock className="text-blue-500" size={20} />
              Le tour de jeu
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 font-bold mt-0.5">1.</span>
                Quand c'est ton tour, appuie sur <strong>"Prêt !"</strong> pour lancer le compte à rebours.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-sky-500 font-bold mt-0.5">2.</span>
                Fais deviner un maximum de cartes à ton équipe avant la fin du temps.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold mt-0.5">3.</span>
                Glisse la carte à droite <ThumbsUp size={14} className="inline text-green-500 mx-1" /> si deviné, à gauche <ThumbsDown size={14} className="inline text-red-500 mx-1" /> pour passer.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-yellow-500 font-bold mt-0.5">4.</span>
                Quand le temps est écoulé, le joueur suivant de l'équipe adverse prend la main.
              </li>
            </ul>
          </div>

          {/* Points */}
          <div className="bg-gradient-to-r from-blue-50 to-yellow-50 rounded-2xl p-4">
            <h3 className="font-bold text-gray-800 text-lg mb-2 flex items-center gap-2">
              <Trophy className="text-yellow-500" size={20} />
              Les points
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Chaque carte correctement devinée rapporte <strong>1 point</strong>. Les cartes passées ou non devinées ne rapportent rien. Les points s'accumulent sur les 3 rounds !
            </p>
          </div>

          {/* Interdictions */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <h3 className="font-bold text-red-700 text-lg mb-2">🚫 Interdit</h3>
            <ul className="space-y-1 text-sm text-red-700">
              <li>❌ Dire le mot ou un mot de la même famille</li>
              <li>❌ Épeler le mot lettre par lettre</li>
              <li>❌ Utiliser une langue étrangère</li>
              <li>❌ Faire des bruits (round 3 uniquement)</li>
            </ul>
          </div>

          {/* Bouton fermer */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-yellow-400 via-sky-400 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl active:scale-95 transition-all duration-200"
          >
            C'est parti ! 🎮
          </button>
        </div>
      </div>
    </div>
  );
}