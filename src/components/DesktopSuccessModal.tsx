interface Props {
  onClose?: () => void;
}

export function DesktopSuccessModal({ onClose }: Props) {
  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl w-full max-w-sm px-6 py-8 text-center shadow-xl">
        <h2 className="text-2xl font-bold text-primary mb-3">點餐成功！</h2>
        <p className="text-base text-gray-700 leading-relaxed">
          請至 LINE 查看付款資訊<span className="ml-0.5">🐫</span>
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="mt-6 btn-primary w-full"
          >
            我知道了
          </button>
        )}
      </div>
    </div>
  );
}
