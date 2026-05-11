interface Props {
  onCancel: () => void;
  onConfirm: () => void;
}

export function GroupStartDialog({ onCancel, onConfirm }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-7 relative shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute -top-3 -right-3 bg-white rounded-full w-9 h-9 flex items-center justify-center shadow border border-gray-200 text-gray-500 text-lg"
          aria-label="關閉"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-20 h-20 rounded-full bg-accent/30 flex items-center justify-center mb-5">
            <span className="text-5xl">⚠️</span>
          </div>
          <p className="text-base leading-relaxed text-gray-800 font-medium">
            您即將開啟「團訂功能」，
            <br />
            將點餐連結分享給好友吧！
          </p>
        </div>

        <div className="mt-7 flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1 py-3 text-base font-bold">
            返回
          </button>
          <button onClick={onConfirm} className="btn-primary flex-1 py-3 text-base font-bold">
            確定
          </button>
        </div>
      </div>
    </div>
  );
}
