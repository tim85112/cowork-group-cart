interface Props {
  ownerName?: string;
  createdAt?: string;
  countdownText?: string;
  onCloseGroup?: () => void;
  showCloseButton?: boolean;
}

export function BrandHeader({ ownerName, createdAt, countdownText, onCloseGroup, showCloseButton }: Props) {
  if (!ownerName) {
    return (
      <header className="bg-primary text-white px-4 py-3 flex items-center justify-center gap-2">
        <span className="text-2xl">🐪</span>
        <h1 className="font-bold text-lg">商辦駝獸 - 順天經貿廣場</h1>
      </header>
    );
  }
  return (
    <header className="bg-primary text-white px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs opacity-80">揪團中 · {createdAt}</p>
          <p className="font-bold truncate">{ownerName}（團主）</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {countdownText && (
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">{countdownText}</span>
          )}
          {showCloseButton && (
            <button
              onClick={onCloseGroup}
              className="text-xs bg-white text-primary font-bold px-3 py-1 rounded-full active:scale-95"
            >
              關閉揪團
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
