import type { CompletedWorkoutRecord } from '../types';

interface CompletedWorkoutsModalProps {
  workouts: CompletedWorkoutRecord[];
  onDelete: (id: string) => void;
  onClose: () => void;
}

function formatCompletedAt(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function CompletedWorkoutsModal({ workouts, onDelete, onClose }: CompletedWorkoutsModalProps) {
  const sorted = [...workouts].reverse();

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center sm:p-4">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-ivory shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between border-b border-navy/10 px-5 py-4">
          <h2 className="text-base font-bold text-charcoal">완료한 움직임</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="rounded-full p-1.5 text-navy-soft hover:bg-navy/5"
          >
            <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-navy-soft">아직 완료한 움직임이 없어요.</p>
          ) : (
            <ul className="flex flex-col gap-2.5">
              {sorted.map((w) => (
                <li
                  key={w.id}
                  className="flex items-center justify-between gap-3 rounded-2xl border border-navy/10 bg-ivory-card px-4 py-3.5 shadow-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-charcoal">{w.routineName}</p>
                    <p className="mt-0.5 text-xs text-navy-soft">{formatCompletedAt(w.completedAt)}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-sm font-bold text-teal">
                      {w.burnedLowKcal}~{w.burnedHighKcal}
                      <span className="ml-0.5 text-[10px] font-medium text-navy-soft">kcal</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => onDelete(w.id)}
                      aria-label={`${w.routineName} 기록 삭제`}
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
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border-t border-navy/10 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-2xl border border-navy/15 bg-ivory-card py-3 text-sm font-semibold text-charcoal transition-transform active:scale-[0.98]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
