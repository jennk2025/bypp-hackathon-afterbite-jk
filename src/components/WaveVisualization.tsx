interface WaveVisualizationProps {
  currentEnergyKcal: number;
  fillPercent: number;
  snackCount: number;
  completedWorkoutCount: number;
}

export function WaveVisualization({
  currentEnergyKcal,
  fillPercent,
  snackCount,
  completedWorkoutCount,
}: WaveVisualizationProps) {
  const clamped = Math.max(0, Math.min(100, fillPercent));

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative mx-auto h-52 w-52 overflow-hidden rounded-full bg-white shadow-inner ring-1 ring-navy/10 sm:h-60 sm:w-60">
        <div
          className="wave-fill-transition absolute inset-x-0 bottom-0"
          style={{ height: `${clamped}%` }}
        >
          <div className="absolute inset-x-0 -top-3 h-6 overflow-hidden">
            <svg
              className="wave-layer h-6 w-[200%]"
              viewBox="0 0 400 24"
              preserveAspectRatio="none"
            >
              <path
                d="M0 12 C 50 0, 150 24, 200 12 C 250 0, 350 24, 400 12 L 400 24 L 0 24 Z"
                fill="var(--color-aqua)"
                opacity="0.85"
              />
              <path
                d="M200 12 C 250 0, 350 24, 400 12 C 450 0, 550 24, 600 12 L 600 24 L 200 24 Z"
                fill="var(--color-aqua)"
                opacity="0.85"
              />
            </svg>
          </div>
          <div className="wave-layer wave-layer-slow absolute inset-x-0 -top-2 h-5 overflow-hidden opacity-60">
            <svg className="h-5 w-[200%]" viewBox="0 0 400 20" preserveAspectRatio="none">
              <path
                d="M0 10 C 60 20, 140 0, 200 10 C 260 20, 340 0, 400 10 L 400 20 L 0 20 Z"
                fill="var(--color-lavender)"
              />
              <path
                d="M200 10 C 260 20, 340 0, 400 10 C 460 20, 540 0, 600 10 L 600 20 L 200 20 Z"
                fill="var(--color-lavender)"
              />
            </svg>
          </div>
          <div className="absolute inset-x-0 bottom-0 top-3 bg-gradient-to-b from-teal to-aqua" />
        </div>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <span className="text-[11px] font-medium tracking-wide text-navy/60">
            현재 참고 에너지
          </span>
          <span className="text-3xl font-bold text-charcoal drop-shadow-sm sm:text-4xl">
            {Math.round(currentEnergyKcal)}
            <span className="ml-0.5 text-base font-semibold">kcal</span>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-6 text-center">
        <div>
          <p className="text-xl font-bold text-charcoal">{snackCount}</p>
          <p className="text-xs text-navy-soft">오늘 기록한 간식</p>
        </div>
        <div className="h-8 w-px bg-navy/10" />
        <div>
          <p className="text-xl font-bold text-charcoal">{completedWorkoutCount}</p>
          <p className="text-xs text-navy-soft">완료한 움직임</p>
        </div>
      </div>

      <p className="max-w-xs text-center text-[11px] leading-relaxed text-navy-soft/80">
        물결은 음식이나 체지방이 사라진다는 의미가 아니라, 기록된 간식 에너지와 완료한 움직임을
        비교해 보여주는 참고용 표시예요.
      </p>
    </div>
  );
}
