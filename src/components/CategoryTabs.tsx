import clsx from 'clsx';
import { CATEGORIES, type Category } from '@/types/product';

interface Props {
  active: Category | null;
  onChange: (c: Category | null) => void;
}

export function CategoryTabs({ active, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto px-4 py-2 bg-cream/60">
      <button
        onClick={() => onChange(null)}
        className={clsx(
          'shrink-0 px-3 py-2 rounded-full text-sm font-bold transition',
          active === null ? 'bg-primary text-white' : 'bg-white text-primary border border-primary/30'
        )}
      >
        全部
      </button>
      {CATEGORIES.map((c) => (
        <button
          key={c}
          onClick={() => onChange(c)}
          className={clsx(
            'shrink-0 px-3 py-2 rounded-full text-sm font-bold transition',
            active === c ? 'bg-primary text-white' : 'bg-white text-primary border border-primary/30'
          )}
        >
          {c}
        </button>
      ))}
    </div>
  );
}
