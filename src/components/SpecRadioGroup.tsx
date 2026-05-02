import clsx from 'clsx';

interface Props {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}

export function SpecRadioGroup({ label, options, value, onChange }: Props) {
  return (
    <div>
      <p className="font-bold mb-2 text-sm">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onChange(opt)}
            className={clsx(
              'px-3 py-2 rounded-xl text-sm font-bold border-2 transition',
              value === opt
                ? 'border-primary bg-primary text-white'
                : 'border-cream bg-white text-gray-700'
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

export function parseSpecOptions(specStr: string): string[] {
  if (!specStr || specStr.trim() === '無' || specStr.trim() === '') return [];
  return specStr
    .split(/[、,，;；/]/)
    .map((s) => s.trim())
    .filter(Boolean);
}
