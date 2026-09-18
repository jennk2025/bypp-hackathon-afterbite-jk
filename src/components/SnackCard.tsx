import { getSnackEmoji } from '../lib/snackVisuals';
import type { Snack } from '../types';

interface SnackCardProps {
  snack: Snack;
  selected: boolean;
  selectable: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

const STATUS_LABEL: Record<Snack['exerciseStatus'], string> = {
  none: '아직 안 바꿈',
  in_progress: '움직이는 중',
  completed: '움직임 완료',
};

const STATUS_STYLE: Record<Snack['exerciseStatus'], string> = {
  none: 'bg-navy/5 text-navy-soft',
  in_progress: 'bg-lavender-soft text-navy',
  completed: 'bg-teal/15 text-teal',
};

export function SnackCard({ snack, selected, selectable, onToggleSelect, onEdit, onDelete }: SnackCardProps) {
  // 움직임을 일부만 완료해서 아직 못 태운 칼로리가 남아있는 상태 — 완료는 아니지만
  // '아직 안 바꿈'과는 구분해서 보여줍니다. 이만큼만 다시 선택해서 움직일 수 있어요.
  const isPartiallyBurned =
    snack.remainingCalories < snack.totalCalories - 0.5 && snack.remainingCalories > 0;
  const statusLabel =
    snack.remainingCalories <= 0
      ? '소모 완료 🎉'
      : isPartiallyBurned
        ? '일부 소모됨'
        : STATUS_LABEL[snack.exerciseStatus];
  const statusStyle =
    snack.remainingCalories <= 0
      ? 'bg-teal/15 text-teal'
      : isPartiallyBurned
        ? 'bg-aqua/15 text-aqua'
        : STATUS_STYLE[snack.exerciseStatus];

  return (
    <div
      className={`relative rounded-2xl border bg-ivory-card px-4 py-3.5 shadow-sm transition-all duration-300 ${
        selected ? 'border-teal ring-2 ring-teal/30' : 'border-navy/10'
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label={selected ? '선택 해제' : '선택'}
          disabled={!selectable}
          onClick={() => onToggleSelect(snack.id)}
          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            selected
              ? 'border-teal bg-teal text-white'
              : selectable
                ? 'border-navy/25'
                : 'border-navy/10 opacity-40'
          }`}
        >
          {selected && (
            <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none">
              <path d="M2 6.5L4.5 9L10 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>

        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-teal/20 to-lavender-soft text-lg">
          {getSnackEmoji(snack.name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-[15px] font-semibold text-charcoal">{snack.name}</h3>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${statusStyle}`}>
              {statusLabel}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-navy-soft">
            {snack.portionLabel} · {snack.servingSizeLabel}
          </p>

          <div className="my-2 border-t border-dashed border-navy/15" />

          <div className="flex items-end justify-between">
            <div>
              <span className="text-2xl font-bold text-charcoal">
                {Math.round(isPartiallyBurned ? snack.remainingCalories : snack.totalCalories)}
                <span className="ml-0.5 text-sm font-semibold text-navy-soft">
                  kcal{isPartiallyBurned ? ' 남음' : ''}
                </span>
              </span>
              {isPartiallyBurned && (
                <p className="mt-0.5 text-[11px] text-navy-soft">
                  전체 {Math.round(snack.totalCalories)}kcal 중
                </p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onEdit(snack.id)}
                aria-label="수정"
                className="rounded-full p-2 text-navy-soft transition-colors hover:bg-navy/5 hover:text-navy"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
                  <path
                    d="M13.5 3.5l3 3L7 16l-3.5.5.5-3.5 9.5-9.5z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => onDelete(snack.id)}
                aria-label="삭제"
                className="rounded-full p-2 text-navy-soft transition-colors hover:bg-red-500/10 hover:text-red-400"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
                  <path
                    d="M4 6h12M8 6V4.5a1 1 0 011-1h2a1 1 0 011 1V6m-7 0l.7 9.1a1 1 0 001 .9h4.6a1 1 0 001-.9L15 6"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
