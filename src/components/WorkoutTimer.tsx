import type { ExerciseRoutine } from '../types';

interface WorkoutTimerProps {
  routine: ExerciseRoutine;
  elapsedSeconds: number;
  isRunning: boolean;
  currentStepIndex: number;
  onPauseResume: () => void;
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
  onNextStep,
  onComplete,
  onCancel,
}: WorkoutTimerProps) {
  const currentStep = routine.steps[currentStepIndex] ?? routine.steps[routine.steps.length - 1];
  const remainingSteps = routine.steps.slice(currentStepIndex + 1);
  const isLastStep = currentStepIndex >= routine.steps.length - 1;

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-8">
      <p className="text-center text-xs font-medium text-navy-soft">{routine.name}</p>
      <p className="mt-1 text-center text-[11px] text-navy-soft/70">
        목표 약 {routine.durationMinutes}분 · 예상 {routine.estBurnLowKcal}~{routine.estBurnHighKcal} kcal
      </p>

      <div className="my-8 flex flex-col items-center">
        <div
          className={`flex h-48 w-48 items-center justify-center rounded-full bg-white shadow-inner ring-4 sm:h-56 sm:w-56 ${
            isRunning ? 'ring-teal/30' : 'ring-navy/10'
          }`}
        >
          <span className="text-5xl font-bold tabular-nums text-charcoal sm:text-6xl">
            {formatTime(elapsedSeconds)}
          </span>
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

      <div className="mt-auto flex flex-col gap-3 pt-8">
        <button
          type="button"
          onClick={onPauseResume}
          className="w-full rounded-2xl border border-navy/15 bg-white py-3.5 text-sm font-semibold text-charcoal transition-transform active:scale-[0.98]"
        >
          {isRunning ? '일시정지' : '다시 시작'}
        </button>
        <button
          type="button"
          onClick={onComplete}
          className="w-full rounded-2xl bg-charcoal py-3.5 text-sm font-semibold text-ivory transition-transform active:scale-[0.98]"
        >
          운동 완료
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-2xl py-2.5 text-sm font-medium text-navy-soft/70"
        >
          취소하고 나가기
        </button>
      </div>
    </div>
  );
}
