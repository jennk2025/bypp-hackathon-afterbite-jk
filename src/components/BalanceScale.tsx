interface BalanceScaleProps {
  percent: number;
}

/** 0~100% 균형 게이지: 낮을수록 건강, 높을수록 아직 못 움직인 만큼이 많이 쌓인 상태. */
export function BalanceScale({ percent }: BalanceScaleProps) {
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <section className="mt-6 rounded-[22px] border border-navy/10 bg-ivory-card px-5 py-4 shadow-sm">
      <p className="mb-2.5 text-center text-[11px] font-bold tracking-wide text-[#C2760A]">
        <span aria-hidden="true">⚡</span> 35~69% 구간은 슬슬 쌓이는 중이에요
      </p>
      <div className="balance-track">
        <div className="balance-marker" style={{ left: `calc(${clamped}% - 7px)` }} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M7 14 0 4a7 7 0 0 1 14 0z" fill="#FBBF24" />
          </svg>
        </div>
        <div className="balance-bar">
          <div
            className="zone rounded-l-lg"
            style={{ flexGrow: 34, background: 'linear-gradient(90deg,#4ADE80,#34D399)', opacity: 0.6 }}
          />
          <div
            className="zone mid"
            style={{ flexGrow: 35, background: 'linear-gradient(90deg,#FBBF24,#FB923C)', opacity: 0.85 }}
          />
          <div
            className="zone rounded-r-lg"
            style={{ flexGrow: 31, background: 'linear-gradient(90deg,#FB7185,#F87171)', opacity: 0.6 }}
          />
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between text-[11.5px] font-bold">
        <span className="flex items-center gap-1 text-[#16A34A]">
          <span aria-hidden="true">🌱</span> 0% · 완전 건강!
        </span>
        <span className="flex items-center gap-1 text-[#E11D48]">
          100% · 아직 많이 남았어요 <span aria-hidden="true">🥵</span>
        </span>
      </div>
    </section>
  );
}
