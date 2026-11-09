import { Difficulty } from '../../types/game';
import { TIME_CHOICES } from '../../game/storage';

const DIFFICULTIES: { value: Difficulty; label: string; emoji: string }[] = [
  { value: 'facile', label: 'Facile', emoji: '🙂' },
  { value: 'moyen', label: 'Moyen', emoji: '😎' },
  { value: 'difficile', label: 'Difficile', emoji: '🔥' },
];

function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; content: React.ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2 p-1.5 bg-white/60 rounded-2xl">
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <button
            key={String(o.value)}
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(o.value)}
            className={`flex-1 py-3 px-2 rounded-xl font-bold transition-all duration-200 ${
              selected
                ? 'bg-gradient-to-r from-sky-400 to-blue-600 text-white shadow-lg scale-[1.03]'
                : 'text-gray-600 hover:bg-white'
            }`}
          >
            {o.content}
          </button>
        );
      })}
    </div>
  );
}

export function DifficultyPicker({ value, onChange }: { value: Difficulty; onChange: (d: Difficulty) => void }) {
  return (
    <Segmented
      label="Difficulté"
      value={value}
      onChange={onChange}
      options={DIFFICULTIES.map((d) => ({
        value: d.value,
        content: (
          <span className="flex flex-col items-center leading-tight">
            <span className="text-xl">{d.emoji}</span>
            <span className="text-sm">{d.label}</span>
          </span>
        ),
      }))}
    />
  );
}

export function TimePicker({ value, onChange }: { value: number; onChange: (t: number) => void }) {
  return (
    <Segmented
      label="Temps par tour"
      value={value}
      onChange={onChange}
      options={TIME_CHOICES.map((t) => ({ value: t, content: `${t}s` }))}
    />
  );
}
