interface ConfirmResetModalProps {
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmResetModal({ onConfirm, onCancel }: ConfirmResetModalProps) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-3xl bg-ivory p-5 shadow-2xl">
        <p className="text-sm font-bold text-charcoal">전체 초기화할까요?</p>
        <p className="mt-1.5 text-xs leading-relaxed text-navy-soft">
          기록된 모든 간식과 완료한 움직임을 지우고 처음 상태로 되돌려요. 되돌릴 수 없어요.
        </p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-2xl border border-navy/15 bg-ivory-card py-2.5 text-sm font-semibold text-navy-soft transition-transform active:scale-[0.98]"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-2xl bg-red-500 py-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
          >
            네, 지울게요
          </button>
        </div>
      </div>
    </div>
  );
}
