import { useState } from 'react';
import { Users, Clock, Target, BookOpen, Volume2 } from 'lucide-react';
import { SetupProps } from '../SetupScreen';
import TeamsEditor from './TeamsEditor';
import SoundSettings from './SoundSettings';
import { DifficultyPicker, TimePicker } from './Pickers';
import RulesModal from '../RulesModal';
import { canStart } from '../../game/teams';

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gradient-to-r from-yellow-50 to-sky-50 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        {icon}
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function DesktopSetup(props: SetupProps) {
  const { teams, setTeams, difficulty, setDifficulty, timePerPlayer, setTimePerPlayer, appSettings, setAppSettings, onPlay } =
    props;
  const [showRules, setShowRules] = useState(false);
  const ready = canStart(teams);

  return (
    <>
      {showRules && <RulesModal onClose={() => setShowRules(false)} />}

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl p-8 max-w-4xl w-full my-4">
          <div className="flex items-start justify-between mb-2 gap-3">
            <h1 className="title-pop text-5xl font-black bg-gradient-to-r from-yellow-500 to-blue-600 bg-clip-text text-transparent">
              Time's Up!
            </h1>
            <button
              onClick={() => setShowRules(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-sky-400 to-blue-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:shadow-lg active:scale-95 transition-all duration-200 shrink-0 mt-1"
            >
              <BookOpen size={18} />
              Règles du jeu
            </button>
          </div>
          <p className="text-center text-gray-600 mb-8">Configurez votre partie</p>

          <div className="space-y-5">
            <Section icon={<Users className="text-yellow-500" size={24} />} title="Équipes">
              <TeamsEditor teams={teams} setTeams={setTeams} />
            </Section>

            <div className="grid grid-cols-2 gap-5">
              <Section icon={<Target className="text-sky-500" size={24} />} title="Difficulté">
                <DifficultyPicker value={difficulty} onChange={setDifficulty} />
              </Section>
              <Section icon={<Clock className="text-blue-600" size={24} />} title="Temps par tour">
                <TimePicker value={timePerPlayer} onChange={setTimePerPlayer} />
              </Section>
            </div>

            <Section icon={<Volume2 className="text-blue-600" size={24} />} title="Son & animations">
              <SoundSettings settings={appSettings} onChange={setAppSettings} />
            </Section>

            <button
              onClick={onPlay}
              disabled={!ready}
              className="w-full bg-gradient-to-r from-yellow-400 via-sky-400 to-blue-600 text-white py-4 rounded-2xl font-bold text-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
            >
              Lancer la partie 🎮
            </button>
            {!ready && (
              <p className="text-center text-sm text-red-500 -mt-2">Chaque équipe doit avoir au moins un joueur.</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
