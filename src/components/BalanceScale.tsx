import { stageOf, STAGE_COPY, STAGE_KCAL_RANGE, REFERENCE_MAX_KCAL, type Stage } from '../lib/energyStage';

interface BalanceScaleProps {
  percent: number;
}

const ZONE_COLOR: Record<Stage, string> = {
  light: '#16A34A',
  rising: '#C2760A',
  heavy: '#E11D48',
};

/** 0~100% 균형 게이지: 낮을수록 건강, 높을수록 아직 못 움직인 만큼이 많이 쌓인 상태. */
export function BalanceScale({ percent }: BalanceScaleProps) {
  const clamped = Math.max(0, Math.min(100, percent));
  const stage = stageOf(clamped);
  const copy = STAGE_COPY[stage];

  return (
    <section className="mt-6 rounded-[22px] border border-navy/10 bg-ivory-card px-5 py-4 shadow-sm">
      <p className="mb-2.5 text-center text-[11px] font-bold tracking-wide" style={{ color: ZONE_COLOR[stage] }}>
        <span aria-hidden="true">{copy.emoji}</span> {copy.label} ({STAGE_KCAL_RANGE[stage]})
      </p>
      <div className="balance-track">
        <div className="balance-marker" style={{ left: `calc(${clamped}% - 7px)` }} aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M7 14 0 4a7 7 0 0 1 14 0z" fill="#FBBF24" />
          </svg>
        </div>
        <div className="balance-bar">
          <div
            className={`zone rounded-l-lg ${stage === 'light' ? 'mid' : ''}`}
            style={{ flexGrow: 34, background: 'linear-gradient(90deg,#4ADE80,#34D399)', opacity: stage === 'light' ? 1 : 0.5 }}
          />
          <div
            className={`zone ${stage === 'rising' ? 'mid' : ''}`}
            style={{ flexGrow: 35, background: 'linear-gradient(90deg,#FBBF24,#FB923C)', opacity: stage === 'rising' ? 1 : 0.5 }}
          />
          <div
            className={`zone rounded-r-lg ${stage === 'heavy' ? 'mid' : ''}`}
            style={{ flexGrow: 31, background: 'linear-gradient(90deg,#FB7185,#F87171)', opacity: stage === 'heavy' ? 1 : 0.5 }}
          />
        </div>
        {/* 구간 기준을 막대 아래에 kcal로 작게 표시 — 색 폭과 같은 비율로 정렬됩니다 */}
        <div className="mt-1.5 flex text-[9.5px] font-semibold text-navy-soft/80">
          <span className="text-left" style={{ flexGrow: 34 }}>
            {STAGE_KCAL_RANGE.light}
          </span>
          <span className="text-center" style={{ flexGrow: 35 }}>
            {STAGE_KCAL_RANGE.rising}
          </span>
          <span className="text-right" style={{ flexGrow: 31 }}>
            {STAGE_KCAL_RANGE.heavy}
          </span>
        </div>
      </div>
      <div className="mt-2.5 flex items-center justify-between text-[11.5px] font-bold">
        <span className="flex items-center gap-1 text-[#16A34A]">
          <span aria-hidden="true">🌱</span> 0kcal · 완전 건강!
        </span>
        <span className="flex items-center gap-1 text-[#E11D48]">
          {REFERENCE_MAX_KCAL}kcal+ · 아직 많이 남았어요 <span aria-hidden="true">🥵</span>
        </span>
      </div>
    </section>
  );
}
