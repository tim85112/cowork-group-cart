interface Props {
  onCancel: () => void;
  onConfirm: () => void;
}

export function GroupStartDialog({ onCancel, onConfirm }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-6"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-3xl w-full max-w-sm p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute -top-3 -right-3 bg-white rounded-full w-8 h-8 flex items-center justify-center shadow border border-gray-200 text-gray-500"
          aria-label="關閉"
        >
          ✕
        </button>

        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-accent/30 flex items-center justify-center mb-4">
            <span className="text-3xl text-accent">⚠️</span>
          </div>
          <p className="text-sm leading-relaxed text-gray-800">
            您即將開啟「團訂功能」，
            <br />
            將點餐連結分享給好友吧！
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1">
            返回
          </button>
          <button onClick={onConfirm} className="btn-primary flex-1">
            確定
          </button>
        </div>
      </div>
    </div>
  );
}
