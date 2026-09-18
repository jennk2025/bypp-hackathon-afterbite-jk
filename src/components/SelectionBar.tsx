interface SelectionBarProps {
  selectedCount: number;
  totalCalories: number;
  onConvert: () => void;
}

export function SelectionBar({ selectedCount, totalCalories, onConvert }: SelectionBarProps) {
  const visible = selectedCount > 0;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-3 transition-all duration-300 ${
        visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-4 opacity-0'
      }`}
    >
      <div className="flex w-full max-w-md items-center justify-between gap-4 rounded-2xl border border-navy/10 bg-white/95 px-5 py-3.5 shadow-[0_8px_30px_rgba(31,42,60,0.12)] backdrop-blur">
        <div>
          <p className="text-xs text-navy-soft">{selectedCount}개 선택됨</p>
          <p className="text-lg font-bold text-charcoal">
            {Math.round(totalCalories)} <span className="text-sm font-semibold text-navy-soft">kcal</span>
          </p>
        </div>
        <button
          type="button"
          onClick={onConvert}
          disabled={!visible}
          className="shrink-0 rounded-full bg-charcoal px-5 py-2.5 text-sm font-semibold text-ivory transition-transform active:scale-95"
        >
          움직임으로 바꾸기
        </button>
      </div>
    </div>
  );
}
