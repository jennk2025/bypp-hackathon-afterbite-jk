import type { ExerciseRoutine } from '../types';

interface WorkoutTimerProps {
  routine: ExerciseRoutine;
  elapsedSeconds: number;
  isRunning: boolean;
  currentStepIndex: number;
  onPauseResume: () => void;
  onBrowseRoutines: () => void;
  onNextStep: () => void;
  onComplete: () => void;
  onCancel: () => void;
}

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function WorkoutTimer({
  routine,
  elapsedSeconds,
  isRunning,
  currentStepIndex,
  onPauseResume,
  onBrowseRoutines,
  onNextStep,
  onComplete,
  onCancel,
}: WorkoutTimerProps) {
  const currentStep = routine.steps[currentStepIndex] ?? routine.steps[routine.steps.length - 1];
  const remainingSteps = routine.steps.slice(currentStepIndex + 1);
  const isLastStep = currentStepIndex >= routine.steps.length - 1;
  const targetSeconds = routine.durationMinutes * 60;
  const isGoalReached = elapsedSeconds >= targetSeconds;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-6">
      {/* 상단 루틴 목록 바로가기 */}
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onBrowseRoutines}
          className="flex items-center gap-1.5 rounded-full border border-navy/15 bg-ivory-card px-3 py-1.5 text-xs font-semibold text-navy-soft shadow-sm hover:text-charcoal active:scale-95"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none">
            <path d="M12.5 4.5L6 10l6.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          다른 운동 목록
        </button>
        <span className="rounded-full bg-navy/5 px-2.5 py-1 text-[11px] font-medium text-navy-soft">
          {isRunning ? '운동 진행 중' : '일시정지 중'}
        </span>
      </div>

      <p className="text-center text-xs font-medium text-navy-soft">{routine.name}</p>
      <p className="mt-1 text-center text-[11px] text-navy-soft">
        목표 약 {routine.durationMinutes}분 · 예상 {routine.estBurnLowKcal}~{routine.estBurnHighKcal} kcal
      </p>

      <div className="my-6 flex flex-col items-center">
        {isGoalReached && (
          <p className="mb-3 rounded-full bg-teal/15 px-3 py-1 text-xs font-semibold text-teal">
            🎉 목표 시간 달성! 완료 버튼을 눌러 기록해요
          </p>
        )}
        <div
          className={`flex h-48 w-48 items-center justify-center rounded-full bg-ivory-card shadow-inner ring-4 sm:h-56 sm:w-56 ${
            isGoalReached ? 'ring-teal' : isRunning ? 'ring-teal/30' : 'ring-navy/15'
          }`}
        >
          {isGoalReached ? (
            <span className="font-display text-3xl font-bold text-teal sm:text-4xl">DONE</span>
          ) : (
            <span className="font-display text-5xl tabular-nums text-charcoal sm:text-6xl">
              {formatTime(elapsedSeconds)}
            </span>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-teal/10 px-4 py-4">
        <p className="text-[11px] font-semibold text-teal">지금 동작</p>
        <p className="mt-1 text-base font-bold text-charcoal">{currentStep}</p>
      </div>

      {remainingSteps.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-[11px] font-semibold text-navy-soft">다음 동작</p>
          <ul className="space-y-1.5">
            {remainingSteps.map((step, idx) => (
              <li key={idx} className="text-sm text-navy-soft">
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={onNextStep}
        disabled={isLastStep}
        className="mt-4 self-start rounded-full border border-navy/15 px-4 py-1.5 text-xs font-medium text-navy-soft disabled:opacity-30"
      >
        다음 동작으로 →
      </button>

      <div className="mt-auto flex flex-col gap-2.5 pt-6">
        <button
          type="button"
          onClick={onPauseResume}
          className={`w-full rounded-2xl py-3.5 text-sm font-semibold transition-transform active:scale-[0.98] ${
            isRunning
              ? 'border border-navy/15 bg-ivory-card text-charcoal'
              : 'btn-primary text-white shadow-md'
          }`}
        >
          {isRunning ? '일시정지' : '다시 시작'}
        </button>

        {/* 일시정지 상태일 때 다른 운동으로 즉시 전환할 수 있는 안내 버튼 */}
        {!isRunning && (
          <button
            type="button"
            onClick={onBrowseRoutines}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-teal bg-teal/10 py-3 text-sm font-bold text-teal transition-transform active:scale-[0.98]"
          >
            <span>🔄</span>
            다른 운동도 해보기 (루틴 목록으로)
          </button>
        )}

        <button
          type="button"
          onClick={onComplete}
          className={`w-full rounded-2xl py-3 text-sm font-semibold transition-transform active:scale-[0.98] ${
            isGoalReached ? 'btn-primary text-white animate-pulse' : 'border border-navy/15 bg-ivory-card text-navy'
          }`}
        >
          {isGoalReached ? '✅ 운동 완료로 기록하기' : '지금까지 한 만큼 운동 완료'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-2xl py-2 text-xs font-medium text-navy-soft"
        >
          취소하고 트레이로 돌아가기
        </button>
      </div>
    </div>
  );
}
