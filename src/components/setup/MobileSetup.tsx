import { useLayoutEffect, useRef, useState } from 'react';
import { Users, Play, Settings, BookOpen, Clock } from 'lucide-react';
import { SetupProps } from '../SetupScreen';
import TeamsEditor from './TeamsEditor';
import SoundSettings from './SoundSettings';
import { DifficultyPicker, TimePicker } from './Pickers';
import RulesModal from '../RulesModal';
import { canStart } from '../../game/teams';

const TABS = [
  { label: 'Partie', icon: Users },
  { label: 'Jouer', icon: Play },
  { label: 'Paramètres', icon: Settings },
];

function PanelTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-2xl font-black text-white drop-shadow mb-4">{children}</h2>;
}

export default function MobileSetup(props: SetupProps) {
  const { teams, setTeams, difficulty, setDifficulty, timePerPlayer, setTimePerPlayer, appSettings, setAppSettings, onPlay } =
    props;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState(1);
  const [showRules, setShowRules] = useState(false);
  const ready = canStart(teams);
  const playerCount = teams.reduce((n, t) => n + t.players.length, 0);

  // open on the main menu (middle panel)
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollLeft = el.clientWidth;
  }, []);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    el?.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' });
  };

  const onScroll = () => {
    const el = scrollerRef.current;
    if (el) setTab(Math.round(el.scrollLeft / el.clientWidth));
  };

  const panel = 'w-full shrink-0 snap-center overflow-y-auto overscroll-contain px-4 pt-6 pb-32';

  return (
    <div className="h-[100dvh] flex flex-col">
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="flex-1 flex overflow-x-auto snap-x snap-mandatory no-scrollbar"
      >
        {/* ── Partie ─────────────────────────────────────────── */}
        <section className={panel} aria-label="Réglages de la partie">
          <PanelTitle>Équipes</PanelTitle>
          <TeamsEditor teams={teams} setTeams={setTeams} />
          <h3 className="flex items-center gap-2 text-lg font-bold text-white drop-shadow mt-6 mb-3">
            <Clock size={20} /> Temps par tour
          </h3>
          <TimePicker value={timePerPlayer} onChange={setTimePerPlayer} />
        </section>

        {/* ── Menu principal ─────────────────────────────────── */}
        <section className={`${panel} flex flex-col items-center justify-center text-center`} aria-label="Menu principal">
          <h1 className="title-pop text-6xl font-black leading-none mb-2">
            <span className="block text-yellow-300 title-stroke">Time's</span>
            <span className="block text-white title-stroke">Up!</span>
          </h1>
          <p className="text-white/90 font-semibold mb-8 drop-shadow">
            {playerCount} joueurs · {teams.length} équipes · {timePerPlayer}s
          </p>

          <div className="w-full max-w-sm mb-6">
            <p className="text-white font-bold mb-2 drop-shadow">Difficulté</p>
            <DifficultyPicker value={difficulty} onChange={setDifficulty} />
          </div>

          <button
            onClick={onPlay}
            disabled={!ready}
            className="play-pulse w-44 h-44 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-orange-400 text-blue-800 font-black text-3xl shadow-[0_12px_40px_rgba(37,99,235,0.5)] border-8 border-white/80 active:scale-95 transition-transform disabled:opacity-50 disabled:animate-none flex flex-col items-center justify-center"
          >
            <Play size={48} fill="currentColor" />
            Jouer
          </button>
          {!ready && (
            <button onClick={() => goTo(0)} className="mt-4 text-white underline font-semibold drop-shadow">
              Ajoute des joueurs dans l'onglet Partie
            </button>
          )}

          <button
            onClick={() => setShowRules(true)}
            className="mt-8 flex items-center gap-2 bg-white/90 text-blue-700 px-5 py-3 rounded-full font-bold shadow-lg active:scale-95 transition-transform"
          >
            <BookOpen size={20} /> Règles du jeu
          </button>
        </section>

        {/* ── Paramètres ─────────────────────────────────────── */}
        <section className={panel} aria-label="Paramètres">
          <PanelTitle>Paramètres</PanelTitle>
          <SoundSettings settings={appSettings} onChange={setAppSettings} />
        </section>
      </div>

      <nav
        className="fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-gray-200 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {TABS.map(({ label, icon: Icon }, i) => (
          <button
            key={label}
            onClick={() => goTo(i)}
            aria-current={tab === i ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-bold transition-colors ${
              tab === i ? 'text-blue-600' : 'text-gray-400'
            }`}
          >
            <span
              className={`p-1.5 rounded-full transition-all ${
                tab === i ? 'bg-gradient-to-br from-yellow-300 to-sky-300 scale-110' : ''
              }`}
            >
              <Icon size={22} />
            </span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  );
}
