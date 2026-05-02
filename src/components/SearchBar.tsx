interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = '搜尋餐點…' }: Props) {
  return (
    <div className="px-4 py-2 bg-cream/60">
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="input-field pl-10"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-primary/60">🔍</span>
      </div>
    </div>
  );
}
