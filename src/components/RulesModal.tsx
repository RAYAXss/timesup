import { useEffect } from 'react';
import { X, BookOpen, Trophy, RotateCcw, ThumbsUp, ThumbsDown, Timer } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

const ROUNDS = [
  {
    n: 1,
    name: 'Description',
    emoji: '🗣️',
    text: 'Parle autant que tu veux, sauf le mot lui-même.',
    cls: 'from-yellow-300 to-yellow-400 text-yellow-900',
  },
  {
    n: 2,
    name: 'Un seul mot',
    emoji: '🤫',
    text: 'Un seul mot pour faire deviner. Choisis-le bien !',
    cls: 'from-sky-300 to-sky-400 text-sky-950',
  },
  {
    n: 3,
    name: 'Mime',
    emoji: '🙌',
    text: 'Aucun mot, aucun bruit : seulement des gestes.',
    cls: 'from-blue-500 to-blue-700 text-white',
  },
];

// Example rotation: team 1 = A B C, team 2 = D E
const ROTATION = [
  { p: 'A', t: 0 },
  { p: 'D', t: 1 },
  { p: 'B', t: 0 },
  { p: 'E', t: 1 },
  { p: 'C', t: 0 },
  { p: 'D', t: 1 },
];

function Step({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="font-black text-gray-800 text-lg mb-3 flex items-center gap-2">
        {icon}
        {title}
      </h3>
      {children}
    </section>
  );
}

export default function RulesModal({ onClose }: RulesModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Règles du jeu"
        className="sheet-up bg-white rounded-t-3xl md:rounded-3xl shadow-2xl w-full max-w-lg max-h-[92dvh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-yellow-400 via-sky-400 to-blue-600 p-5 rounded-t-3xl flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <BookOpen className="text-white" size={26} />
            <h2 className="text-2xl font-black text-white">Règles du jeu</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="bg-white/20 hover:bg-white/40 text-white rounded-full p-2 transition-all active:scale-95"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-5 md:p-6 space-y-7">
          <p className="text-gray-700 leading-relaxed text-center">
            Des équipes, <strong>un paquet de cartes</strong>, <strong>3 manches</strong>.
            <br />
            Les mêmes cartes reviennent à chaque manche, mais c'est de plus en plus dur !
          </p>

          {/* 3 manches */}
          <Step icon={<RotateCcw className="text-sky-500" size={20} />} title="Les 3 manches">
            <ol className="grid grid-cols-3 gap-2">
              {ROUNDS.map((r) => (
                <li
                  key={r.n}
                  className={`rounded-2xl p-3 bg-gradient-to-br ${r.cls} flex flex-col items-center text-center shadow-md`}
                >
                  <span className="text-xs font-black opacity-70">MANCHE {r.n}</span>
                  <span className="text-4xl my-1">{r.emoji}</span>
                  <span className="font-black text-sm leading-tight">{r.name}</span>
                  <span className="text-[11px] leading-snug mt-1 opacity-90">{r.text}</span>
                </li>
              ))}
            </ol>
          </Step>

          {/* Swipe */}
          <Step icon={<Timer className="text-blue-500" size={20} />} title="Ton tour">
            <div className="bg-gradient-to-br from-sky-50 to-yellow-50 rounded-2xl p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col items-center text-red-500 font-bold text-xs w-16">
                  <ThumbsDown size={22} />
                  <span className="text-lg">←</span>
                  Passer
                </div>
                <div className="swipe-demo bg-white rounded-2xl shadow-lg border-2 border-sky-200 w-28 h-36 flex flex-col items-center justify-center">
                  <span className="text-[10px] font-bold text-sky-500">CARTE</span>
                  <span className="font-black text-gray-800 text-lg">Pizza</span>
                </div>
                <div className="flex flex-col items-center text-green-600 font-bold text-xs w-16">
                  <ThumbsUp size={22} />
                  <span className="text-lg">→</span>
                  Trouvé !
                </div>
              </div>
              <p className="text-sm text-gray-700 text-center mt-3">
                Fais deviner un max de cartes à ton équipe avant la fin du chrono. Une carte passée retourne dans le paquet.
              </p>
            </div>
          </Step>

          {/* Rotation */}
          <Step icon={<RotateCcw className="text-yellow-500" size={20} />} title="Qui fait deviner ?">
            <div className="bg-gray-50 rounded-2xl p-4">
              <div className="flex gap-3 justify-center mb-3 text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-yellow-400" /> Équipe 1 : A B C
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-sky-400" /> Équipe 2 : D E
                </span>
              </div>
              <div className="flex items-center justify-center gap-1 flex-wrap">
                {ROTATION.map((r, i) => (
                  <span key={i} className="flex items-center gap-1">
                    <span
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-black shadow ${
                        r.t === 0 ? 'bg-yellow-400 text-yellow-900' : 'bg-sky-400 text-white'
                      }`}
                    >
                      {r.p}
                    </span>
                    {i < ROTATION.length - 1 && <span className="text-gray-400">›</span>}
                  </span>
                ))}
                <span className="text-gray-400 ml-1">…</span>
              </div>
              <p className="text-sm text-gray-700 text-center mt-3">
                Les équipes jouent chacune leur tour, et chaque équipe fait tourner ses joueurs.
              </p>
            </div>
          </Step>

          {/* Points */}
          <Step icon={<Trophy className="text-yellow-500" size={20} />} title="Les points">
            <div className="flex items-center gap-4 bg-gradient-to-r from-blue-50 to-yellow-50 rounded-2xl p-4">
              <span className="text-4xl font-black text-blue-600">+1</span>
              <p className="text-sm text-gray-700">
                par carte trouvée. Les points s'additionnent sur les 3 manches : la meilleure équipe gagne !
              </p>
            </div>
          </Step>

          {/* Interdictions */}
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <h3 className="font-black text-red-700 text-lg mb-2">🚫 Interdit</h3>
            <ul className="space-y-1 text-sm text-red-700">
              <li>❌ Dire le mot ou un mot de la même famille</li>
              <li>❌ Épeler le mot lettre par lettre</li>
              <li>❌ Utiliser une langue étrangère</li>
              <li>❌ Faire des bruits (manche 3)</li>
            </ul>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-yellow-400 via-sky-400 to-blue-600 text-white py-4 rounded-2xl font-bold text-lg hover:shadow-xl active:scale-95 transition-all duration-200"
            style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
          >
            C'est parti ! 🎮
          </button>
        </div>
      </div>
    </div>
  );
}
