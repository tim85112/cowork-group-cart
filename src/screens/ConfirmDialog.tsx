interface Props {
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({ onCancel, onConfirm }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-6">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm">
        <h2 className="text-lg font-bold text-primary mb-2">確認收單？</h2>
        <p className="text-sm text-red-600 mb-1 font-bold">⚠️ 收單後將無法更改餐點</p>
        <p className="text-sm text-gray-600 mb-5">請確認所有人已完成點餐</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="btn-ghost flex-1">取消</button>
          <button onClick={onConfirm} className="btn-primary flex-1">確認收單</button>
        </div>
      </div>
    </div>
  );
}
