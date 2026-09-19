import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { stageOf, STAGE_COPY, type Stage } from '../lib/energyStage';

interface WaveVisualizationProps {
  currentEnergyKcal: number;
  fillPercent: number;
  snackCount: number;
  completedWorkoutCount: number;
  onCompletedWorkoutsClick: () => void;
  // 방금 완료한 운동 기록의 id. 값이 "새로" 들어올 때(=운동을 막 완료했을 때)만
  // 캐릭터가 한 번 통통 튀고 반짝임이 터지는 축하 연출을 재생합니다.
  justCompletedId?: string | null;
}

interface FillTheme {
  stage: Stage;
  label: string;
  emoji: string;
  from: string;
  to: string;
  ripple: string;
  glow: string;
  halo: string;
  waveSeconds: number;
  mouthPath: string;
}

// 웃는 입(가벼움) → 완전 무표정(쌓이는 중) → 처진 입(많이 쌓임)
const MOUTH_PATH: Record<Stage, string> = {
  light: 'M84,123 Q100,148 116,123',
  rising: 'M89,130 L111,130',
  heavy: 'M87,133 Q100,121 113,133',
};

// 균형 막대(BalanceScale)의 초록/주황/빨강 구간과 정확히 같은 색을 씁니다 — 캐릭터 색이
// 구간마다 뚜렷하게 갈려야 "지금 주황 구간이구나"가 한눈에 보입니다. 예전에는 0~100%를
// 하나의 연속된 무지개색으로 보간해서 주황 구간 초반엔 노란빛, 후반엔 붉은빛이 섞여
// 뚜렷한 주황으로 안 보였습니다.
const STAGE_COLORS: Record<Stage, { from: string; to: string; ripple: string; rgb: string }> = {
  light: { from: '#4ADE80', to: '#22C55E', ripple: '#BBF7D0', rgb: '74,222,128' },
  rising: { from: '#FB923C', to: '#EA580C', ripple: '#FED7AA', rgb: '251,146,60' },
  heavy: { from: '#FB7185', to: '#E11D48', ripple: '#FECDD3', rgb: '251,113,133' },
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getDynamicTheme(percent: number): FillTheme {
  const p = Math.max(0, Math.min(100, percent));
  const stage = stageOf(p);
  const copy = STAGE_COPY[stage];
  const colors = STAGE_COLORS[stage];

  return {
    stage,
    label: copy.label,
    emoji: copy.emoji,
    mouthPath: MOUTH_PATH[stage],
    from: colors.from,
    to: colors.to,
    ripple: colors.ripple,
    glow: `rgba(${colors.rgb}, 0.55)`,
    halo: `rgba(${colors.rgb}, 0.32)`,
    waveSeconds: lerp(7, 3.2, p / 100),
  };
}

// 캐릭터 중심(50%,50%) 기준으로 각도·반지름을 지정해 배치합니다. 0°(정위)/180°(정아래)
// 근처는 반지름만큼 그대로 컨테이너 밖(문구 영역)으로 튀어나가 버리므로 피하고, 좌우
// 40°~140° / 220°~320° "안전지대"에서만 위아래로 지그재그가 되도록 각도를 고릅니다.
function polar(angleDeg: number, radius: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { top: `${50 - radius * Math.cos(rad)}%`, left: `${50 + radius * Math.sin(rad)}%` };
}

const STICKERS: { emoji: string; angle: number; radius: number; size: string; bg: string; delay: string }[] = [
  // 오른쪽, 위→아래 지그재그
  { emoji: '🍩', angle: 40, radius: 60, size: 'text-2xl', bg: 'bg-[#FFD9C7]', delay: '0s' },
  { emoji: '🍕', angle: 75, radius: 66, size: 'text-lg', bg: 'bg-[#FFD1A8]', delay: '1.1s' },
  { emoji: '🍔', angle: 105, radius: 66, size: 'text-lg', bg: 'bg-[#F7D9A8]', delay: '1.3s' },
  { emoji: '🍪', angle: 140, radius: 60, size: 'text-2xl', bg: 'bg-[#CFE8FF]', delay: '1.5s' },
  // 왼쪽, 위→아래 지그재그 (오른쪽과 짝을 이루는 대칭 리듬)
  { emoji: '🍗', angle: -40, radius: 60, size: 'text-xl', bg: 'bg-[#FFDDB8]', delay: '0.7s' },
  { emoji: '🍭', angle: -75, radius: 66, size: 'text-lg', bg: 'bg-[#E6DBFF]', delay: '0.5s' },
  { emoji: '🧁', angle: -105, radius: 66, size: 'text-lg', bg: 'bg-[#C8F4E0]', delay: '1s' },
  { emoji: '🍰', angle: -140, radius: 60, size: 'text-lg', bg: 'bg-[#FFE3D3]', delay: '0.9s' },
];

const SPARKLES: { angle: number; radius: number; size: number; color: string; delay: string }[] = [
  { angle: 58, radius: 56, size: 12, color: '#C9B6FF', delay: '0.6s' },
  { angle: 122, radius: 56, size: 11, color: '#34D399', delay: '1.4s' },
  { angle: -122, radius: 56, size: 12, color: '#FF9A76', delay: '0.9s' },
  { angle: -58, radius: 56, size: 11, color: '#7DD3FC', delay: '1.8s' },
];

// 캐릭터 몸통은 svg 좌표계 y=50~190(높이 140) 사각형입니다. percent가 클수록(=아직
// 못 움직인 만큼이 많을수록) 물이 위로 차오르도록 waveY를 아래→위로 옮깁니다.
// 0%여도 완전히 납작하게 붙어있지 않도록 최소 4%만큼은 항상 살짝 찰랑이게 둡니다.
function waveYFor(percent: number) {
  const visual = Math.max(4, Math.min(100, percent));
  return 190 - 1.4 * visual;
}

// 운동 완료 축하 연출: 캐릭터 중심에서 8방향으로 반짝임이 퍼져나갑니다.
const CELEBRATE_SPARKLES: { angle: number; distance: number; size: number; color: string; delay: string }[] = [
  { angle: 0, distance: 70, size: 14, color: '#FFC26B', delay: '0ms' },
  { angle: 45, distance: 78, size: 11, color: '#7DD3FC', delay: '40ms' },
  { angle: 90, distance: 70, size: 13, color: '#C9B6FF', delay: '80ms' },
  { angle: 135, distance: 78, size: 11, color: '#4ADE80', delay: '30ms' },
  { angle: 180, distance: 70, size: 14, color: '#FFC26B', delay: '70ms' },
  { angle: 225, distance: 78, size: 11, color: '#7DD3FC', delay: '10ms' },
  { angle: 270, distance: 70, size: 13, color: '#C9B6FF', delay: '60ms' },
  { angle: 315, distance: 78, size: 11, color: '#4ADE80', delay: '20ms' },
];

const CELEBRATE_MS = 750;

export function WaveVisualization({
  currentEnergyKcal,
  fillPercent,
  snackCount,
  completedWorkoutCount,
  onCompletedWorkoutsClick,
  justCompletedId,
}: WaveVisualizationProps) {
  const clamped = Math.max(0, Math.min(100, fillPercent));
  const theme = getDynamicTheme(clamped);
  const waveY = waveYFor(clamped);
  const haloStyle = {
    '--halo-color': theme.halo,
    '--halo-speed': `${theme.waveSeconds + 1.3}s`,
  } as CSSProperties;

  const [celebrating, setCelebrating] = useState(false);
  const lastCelebratedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!justCompletedId) {
      lastCelebratedIdRef.current = null;
      return;
    }
    if (justCompletedId === lastCelebratedIdRef.current) return;
    lastCelebratedIdRef.current = justCompletedId;
    setCelebrating(true);
    const timer = setTimeout(() => setCelebrating(false), CELEBRATE_MS);
    return () => clearTimeout(timer);
  }, [justCompletedId]);

  return (
    <div id="hero" className="flex scroll-mt-20 flex-col items-center gap-4">
      <div className="relative mb-4 flex w-full flex-col items-center lg:mb-0">
        {/* 캐릭터 주위를 떠다니는 간식 스티커 — 장식용, 데이터 없음 */}
        {STICKERS.map((s, i) => {
          const pos = polar(s.angle, s.radius);
          return (
            <span
              key={i}
              aria-hidden="true"
              className={`float-sticker absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-sm sm:h-11 sm:w-11 ${s.size} ${s.bg}`}
              style={{ top: pos.top, left: pos.left, animationDelay: s.delay }}
            >
              {s.emoji}
            </span>
          );
        })}
        {SPARKLES.map((s, i) => {
          const pos = polar(s.angle, s.radius);
          return (
            <svg
              key={i}
              aria-hidden="true"
              className="sparkle-icon absolute -translate-x-1/2 -translate-y-1/2"
              width={s.size}
              height={s.size}
              viewBox="0 0 20 20"
              fill={s.color}
              style={{ top: pos.top, left: pos.left, animationDelay: s.delay }}
            >
              <path d="M10 0 12.2 7.8 20 10 12.2 12.2 10 20 7.8 12.2 0 10 7.8 7.8Z" />
            </svg>
          );
        })}

        <div
          className={`wave-halo mx-auto h-[clamp(260px,72vw,380px)] w-[clamp(240px,66vw,350px)] lg:h-[340px] lg:w-[310px] xl:h-[400px] xl:w-[360px] 2xl:h-[460px] 2xl:w-[420px] ${
            celebrating ? 'celebrate-bounce' : ''
          }`}
          style={haloStyle}
        >
          <div className="wave-backdrop-glow" aria-hidden="true" />

          {/* 운동 완료 축하 반짝임 — 원샷, 데이터 없음 */}
          {celebrating && (
            <div className="pointer-events-none absolute inset-0 z-10" aria-hidden="true">
              {CELEBRATE_SPARKLES.map((s, i) => {
                const rad = (s.angle * Math.PI) / 180;
                const dx = `${Math.sin(rad) * s.distance}px`;
                const dy = `${-Math.cos(rad) * s.distance}px`;
                return (
                  <svg
                    key={i}
                    className="celebrate-spark absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                    width={s.size}
                    height={s.size}
                    viewBox="0 0 20 20"
                    fill={s.color}
                    style={{ '--spark-dx': dx, '--spark-dy': dy, animationDelay: s.delay } as CSSProperties}
                  >
                    <path d="M10 0 12.2 7.8 20 10 12.2 12.2 10 20 7.8 12.2 0 10 7.8 7.8Z" />
                  </svg>
                );
              })}
            </div>
          )}

          <svg viewBox="0 0 200 220" className="relative h-full w-full" role="img" aria-label="오늘의 에너지 친구">
            <defs>
              <linearGradient id="afterbite-stage-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.from} style={{ transition: 'stop-color 700ms ease' }} />
                <stop offset="100%" stopColor={theme.to} style={{ transition: 'stop-color 700ms ease' }} />
              </linearGradient>
              <clipPath id="afterbite-body-clip">
                <rect x="30" y="50" width="140" height="140" rx="62" />
              </clipPath>
            </defs>

            {/* 그림자 */}
            <ellipse cx="70" cy="196" rx="17" ry="10" fill="#4A3728" opacity="0.12" />
            <ellipse cx="130" cy="196" rx="17" ry="10" fill="#4A3728" opacity="0.12" />

            {/* 몸통 바탕 (아직 안 채워진 부분) */}
            <rect
              x="30"
              y="50"
              width="140"
              height="140"
              rx="62"
              fill="#FFE9D6"
              stroke="rgba(74,55,40,0.14)"
              strokeWidth="3"
            />

            {/* 채워진 만큼 차오르는 물결 (percent가 클수록 많이 참) */}
            <g clipPath="url(#afterbite-body-clip)">
              <rect
                className="wave-rect-transition"
                x="30"
                y={waveY}
                width="140"
                height="160"
                fill="url(#afterbite-stage-grad)"
              />
              <ellipse
                className="ripple-a wave-rect-transition"
                cx="55"
                cy={waveY}
                rx="70"
                ry="6"
                fill="rgba(255,255,255,0.4)"
                style={{ animationDuration: `${theme.waveSeconds}s` }}
              />
              <ellipse
                className="ripple-b wave-rect-transition"
                cx="140"
                cy={waveY}
                rx="70"
                ry="5"
                fill="rgba(255,255,255,0.26)"
                style={{ animationDuration: `${theme.waveSeconds}s` }}
              />
            </g>

            {/* 귀 */}
            <ellipse
              cx="22"
              cy="118"
              rx="13"
              ry="19"
              fill="#FFE9D6"
              stroke="rgba(74,55,40,0.14)"
              strokeWidth="2.5"
              transform="rotate(18 22 118)"
            />
            <ellipse
              cx="178"
              cy="118"
              rx="13"
              ry="19"
              fill="#FFE9D6"
              stroke="rgba(74,55,40,0.14)"
              strokeWidth="2.5"
              transform="rotate(-18 178 118)"
            />

            {/* 얼굴 — 동그랗고 땡글한 눈 + 반짝임은 모든 상태에서 동일하게 유지합니다 */}
            <circle cx="78" cy="108" r="11" fill="#4A3728" />
            <circle cx="81.5" cy="104.5" r="3.4" fill="#ffffff" />
            <circle cx="76" cy="112" r="1.4" fill="#ffffff" opacity="0.8" />
            <circle cx="122" cy="108" r="11" fill="#4A3728" />
            <circle cx="125.5" cy="104.5" r="3.4" fill="#ffffff" />
            <circle cx="120" cy="112" r="1.4" fill="#ffffff" opacity="0.8" />
            <ellipse cx="65" cy="127" rx="11" ry="7" fill="#FF9A8B" opacity="0.6" />
            <ellipse cx="135" cy="127" rx="11" ry="7" fill="#FF9A8B" opacity="0.6" />
            <path
              d={theme.mouthPath}
              fill="none"
              stroke="#4A3728"
              strokeWidth="3.2"
              strokeLinecap="round"
              style={{ transition: 'd 400ms ease' }}
            />

            {/* 가벼운 상태일 때만 보이는 새싹 */}
            {theme.stage === 'light' && (
              <g transform="translate(100,44)" aria-hidden="true">
                <line x1="0" y1="6" x2="0" y2="18" stroke="#16A34A" strokeWidth="3" strokeLinecap="round" />
                <ellipse cx="0" cy="0" rx="9" ry="15" fill="#4ADE80" transform="rotate(-18 0 0)" />
              </g>
            )}

            {/* 많이 쌓였을 때만 보이는 땀방울 2개 */}
            {theme.stage === 'heavy' && (
              <>
                <path d="M150,60 C145,69 145,78 150,80 C155,78 155,69 150,60 Z" fill="#7DD3FC" aria-hidden="true" />
                <path d="M45,72 C42,78 42,84 45,86 C48,84 48,78 45,72 Z" fill="#7DD3FC" opacity="0.85" aria-hidden="true" />
              </>
            )}
          </svg>
        </div>
      </div>

      <div className="text-center">
        <span
          className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide lg:text-sm"
          style={{ color: theme.from }}
        >
          <span aria-hidden="true">{theme.emoji}</span>
          {theme.label}
        </span>
        <p className="mt-1 text-xs font-medium tracking-wide text-navy-soft lg:text-sm">누적 칼로리</p>
        <p className="font-display text-3xl text-charcoal sm:text-4xl lg:text-5xl">
          {Math.round(currentEnergyKcal)}
          <span className="ml-0.5 text-base font-semibold text-navy-soft lg:text-xl">kcal</span>
        </p>
      </div>

      <div className="-mt-[3px] flex items-center gap-6 text-center lg:mt-0 lg:gap-8">
        <div>
          <p className="text-xl font-bold text-charcoal lg:text-2xl">{snackCount}</p>
          <p className="text-xs text-navy-soft lg:text-sm">기록한 간식</p>
        </div>
        <div className="h-8 w-px bg-navy/10 lg:h-10" />
        <button
          type="button"
          onClick={onCompletedWorkoutsClick}
          className="rounded-xl px-2 py-1 transition-colors hover:bg-navy/5 active:scale-95"
        >
          <p className="text-xl font-bold text-charcoal lg:text-2xl">{completedWorkoutCount}</p>
          <p className="text-xs text-navy-soft lg:text-sm">완료한 움직임</p>
        </button>
      </div>
    </div>
  );
}
