interface Props {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
}

export function QtyStepper({ value, onChange, min = 1, max = 99 }: Props) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="inline-flex items-center gap-3 bg-cream rounded-full p-1">
      <button
        onClick={dec}
        disabled={value <= min}
        className="w-9 h-9 rounded-full bg-white text-primary font-bold text-xl disabled:opacity-30"
      >
        −
      </button>
      <span className="w-6 text-center font-bold">{value}</span>
      <button
        onClick={inc}
        disabled={value >= max}
        className="w-9 h-9 rounded-full bg-white text-primary font-bold text-xl disabled:opacity-30"
      >
        +
      </button>
    </div>
  );
}
