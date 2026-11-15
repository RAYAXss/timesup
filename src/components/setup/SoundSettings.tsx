import { Volume2, VolumeX, Vibrate, Sparkles } from 'lucide-react';
import { AppSettings } from '../../types/game';
import { soundEngine } from '../../game/sound';

function Toggle({
  checked,
  onChange,
  label,
  icon,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <label className="relative flex items-center justify-between gap-3 bg-white/80 rounded-2xl px-4 py-3.5 cursor-pointer">
      <span className="flex items-center gap-3 font-semibold text-gray-800">
        {icon}
        {label}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={`relative w-12 h-7 rounded-full transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-sky-400 ${
          checked ? 'bg-blue-600' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </span>
    </label>
  );
}

export default function SoundSettings({
  settings,
  onChange,
}: {
  settings: AppSettings;
  onChange: (s: AppSettings) => void;
}) {
  const set = (patch: Partial<AppSettings>) => onChange({ ...settings, ...patch });
  const canVibrate = typeof navigator !== 'undefined' && 'vibrate' in navigator;

  return (
    <div className="space-y-2.5">
      <Toggle
        label="Son"
        icon={settings.soundOn ? <Volume2 className="text-blue-600" /> : <VolumeX className="text-gray-400" />}
        checked={settings.soundOn}
        onChange={(soundOn) => set({ soundOn })}
      />
      <div className={`bg-white/80 rounded-2xl px-4 py-3.5 ${settings.soundOn ? '' : 'opacity-50'}`}>
        <label htmlFor="volume" className="flex justify-between font-semibold text-gray-800 mb-2">
          Volume <span className="tabular-nums text-gray-500">{Math.round(settings.volume * 100)}%</span>
        </label>
        <input
          id="volume"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.volume}
          disabled={!settings.soundOn}
          onChange={(e) => set({ volume: Number(e.target.value) })}
          onPointerUp={() => soundEngine.playSuccess()}
          className="w-full accent-blue-600"
        />
      </div>
      {canVibrate && (
        <Toggle
          label="Vibration"
          icon={<Vibrate className="text-sky-500" />}
          checked={settings.vibration}
          onChange={(vibration) => set({ vibration })}
        />
      )}
      <Toggle
        label="Animations 3D"
        icon={<Sparkles className="text-yellow-500" />}
        checked={settings.animations}
        onChange={(animations) => set({ animations })}
      />
    </div>
  );
}
