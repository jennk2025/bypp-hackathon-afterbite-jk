import type { ExerciseRoutine } from '../types';

interface RoutineSuggestionsProps {
  routines: ExerciseRoutine[];
  isLoading: boolean;
  onBack: () => void;
  onSelect: (routine: ExerciseRoutine) => void;
  onRetry: () => void;
}

export function RoutineSuggestions({ routines, isLoading, onBack, onSelect, onRetry }: RoutineSuggestionsProps) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-6">
      <div className="mb-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="뒤로"
          className="rounded-full p-2 text-navy-soft hover:bg-navy/5"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none">
            <path d="M12.5 4.5L6 10l6.5 5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h2 className="text-base font-bold text-charcoal">지금 할 수 있는 움직임 3가지</h2>
      </div>

      <p className="mb-5 rounded-xl bg-lavender-soft px-3.5 py-2.5 text-xs leading-relaxed text-navy">
        AI가 지금 상황(시간·장소·강도·소음·점프 가능 여부)에 맞춰 추천해요. 예상 소모 칼로리는
        정확한 값이 아닌 참고용 범위이니, 체력·속도 등에 따라 개인차가 있을 수 있어요.
      </p>

      {isLoading && routines.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-teal border-t-transparent" />
          <p className="text-sm text-navy-soft">AI가 지금 상황에 맞는 움직임을 찾고 있어요...</p>
        </div>
      )}

      <div className="flex flex-col gap-3.5">
        {routines.map((routine) => (
          <div key={routine.id} className="rounded-2xl border border-navy/10 bg-ivory-card px-4 py-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-charcoal">{routine.name}</h3>
                <p className="mt-0.5 text-xs text-navy-soft">약 {routine.durationMinutes}분</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-teal">
                  {routine.estBurnLowKcal}~{routine.estBurnHighKcal}
                </p>
                <p className="text-[10px] text-navy-soft">kcal 범위</p>
              </div>
            </div>

            <ul className="mt-3 space-y-1">
              {routine.steps.slice(0, 3).map((step, idx) => (
                <li key={idx} className="text-xs text-navy-soft">
                  {idx + 1}. {step}
                </li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => onSelect(routine)}
              className="btn-primary mt-4 w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-transform active:scale-[0.98]"
            >
              이 루틴 시작하기
            </button>
          </div>
        ))}
      </div>

      {routines.length > 0 && !isLoading && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-2xl border border-navy/15 py-3 text-sm font-medium text-navy-soft transition-colors active:scale-[0.98]"
        >
          <span aria-hidden="true">🔄</span>
          마음에 안 들면 다시 추천받기
        </button>
      )}
    </div>
  );
}
