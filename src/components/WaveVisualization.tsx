import type { CSSProperties } from 'react';
import { stageOf, STAGE_COPY, type Stage } from '../lib/energyStage';

interface WaveVisualizationProps {
  currentEnergyKcal: number;
  fillPercent: number;
  snackCount: number;
  completedWorkoutCount: number;
  onCompletedWorkoutsClick: () => void;
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

// 웃는 입(가벼움) → 살짝 무표정(쌓이는 중) → 처진 입(많이 쌓임)
const MOUTH_PATH: Record<Stage, string> = {
  light: 'M84,123 Q100,148 116,123',
  rising: 'M89,130 Q100,133 111,130',
  heavy: 'M87,133 Q100,121 113,133',
};

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getDynamicTheme(percent: number): FillTheme {
  const p = Math.max(0, Math.min(100, percent));
  const stage = stageOf(p);
  const copy = STAGE_COPY[stage];

  let h: number, s: number, l: number;
  if (p < 50) {
    const t = p / 50;
    // Teal (172, 77%, 50%) to Amber (45, 96%, 56%)
    h = lerp(172, 45, t);
    s = lerp(77, 96, t);
    l = lerp(50, 56, t);
  } else {
    const t = (p - 50) / 50;
    // Amber (45, 96%, 56%) to Rose (-13, 89%, 60%)
    h = lerp(45, -13, t);
    s = lerp(96, 89, t);
    l = lerp(56, 60, t);
  }

  const hNorm = (h + 360) % 360;
  const baseColor = `hsl(${hNorm}, ${s}%, ${l}%)`;
  const darkColor = `hsl(${hNorm}, ${s}%, ${l - 12}%)`;
  const lightColor = `hsl(${hNorm}, ${s}%, ${l + 25}%)`;

  return {
    stage,
    label: copy.label,
    emoji: copy.emoji,
    mouthPath: MOUTH_PATH[stage],
    from: baseColor,
    to: darkColor,
    ripple: lightColor,
    glow: `hsla(${hNorm}, ${s}%, ${l}%, 0.55)`,
    halo: `hsla(${hNorm}, ${s}%, ${l}%, 0.32)`,
    waveSeconds: lerp(7, 3.2, p / 100),
  };
}

const STICKERS: { emoji: string; top: string; left: string; size: string; bg: string; delay: string }[] = [
  { emoji: '🍩', top: '0%', left: '2%', size: 'text-2xl', bg: 'bg-[#FFD9C7]', delay: '0s' },
  { emoji: '🍭', top: '8%', left: '84%', size: 'text-xl', bg: 'bg-[#E6DBFF]', delay: '0.5s' },
  { emoji: '🍕', top: '34%', left: '90%', size: 'text-2xl', bg: 'bg-[#FFD1A8]', delay: '1.1s' },
  { emoji: '🍔', top: '70%', left: '0%', size: 'text-xl', bg: 'bg-[#F7D9A8]', delay: '1.3s' },
  { emoji: '🧁', top: '46%', left: '-2%', size: 'text-2xl', bg: 'bg-[#C8F4E0]', delay: '1s' },
  { emoji: '🍪', top: '50%', left: '86%', size: 'text-xl', bg: 'bg-[#CFE8FF]', delay: '1.5s' },
  { emoji: '🍿', top: '86%', left: '10%', size: 'text-lg', bg: 'bg-[#FFEFB0]', delay: '0.3s' },
  { emoji: '🍰', top: '90%', left: '78%', size: 'text-xl', bg: 'bg-[#FFE3D3]', delay: '0.9s' },
];

const SPARKLES: { top: string; left: string; size: number; color: string; delay: string }[] = [
  { top: '-2%', left: '38%', size: 16, color: '#C9B6FF', delay: '0.6s' },
  { top: '78%', left: '18%', size: 13, color: '#34D399', delay: '1.2s' },
  { top: '18%', left: '62%', size: 12, color: '#FF9A76', delay: '1.6s' },
];

// 캐릭터 몸통은 svg 좌표계 y=50~190(높이 140) 사각형입니다. percent가 클수록(=아직
// 못 움직인 만큼이 많을수록) 물이 위로 차오르도록 waveY를 아래→위로 옮깁니다.
// 0%여도 완전히 납작하게 붙어있지 않도록 최소 4%만큼은 항상 살짝 찰랑이게 둡니다.
function waveYFor(percent: number) {
  const visual = Math.max(4, Math.min(100, percent));
  return 190 - 1.4 * visual;
}

export function WaveVisualization({
  currentEnergyKcal,
  fillPercent,
  snackCount,
  completedWorkoutCount,
  onCompletedWorkoutsClick,
}: WaveVisualizationProps) {
  const clamped = Math.max(0, Math.min(100, fillPercent));
  const theme = getDynamicTheme(clamped);
  const waveY = waveYFor(clamped);
  const haloStyle = {
    '--halo-color': theme.halo,
    '--halo-speed': `${theme.waveSeconds + 1.3}s`,
  } as CSSProperties;

  return (
    <div id="hero" className="flex scroll-mt-20 flex-col items-center gap-4">
      <div className="relative flex w-full flex-col items-center">
        {/* 캐릭터 주위를 떠다니는 간식 스티커 — 장식용, 데이터 없음 */}
        {STICKERS.map((s, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={`float-sticker absolute flex h-9 w-9 items-center justify-center rounded-full shadow-sm sm:h-11 sm:w-11 ${s.size} ${s.bg}`}
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          >
            {s.emoji}
          </span>
        ))}
        {SPARKLES.map((s, i) => (
          <svg
            key={i}
            aria-hidden="true"
            className="sparkle-icon absolute"
            width={s.size}
            height={s.size}
            viewBox="0 0 20 20"
            fill={s.color}
            style={{ top: s.top, left: s.left, animationDelay: s.delay }}
          >
            <path d="M10 0 12.2 7.8 20 10 12.2 12.2 10 20 7.8 12.2 0 10 7.8 7.8Z" />
          </svg>
        ))}

        <div
          className="wave-halo mx-auto h-[clamp(260px,72vw,380px)] w-[clamp(240px,66vw,350px)]"
          style={haloStyle}
        >
          <div className="wave-backdrop-glow" aria-hidden="true" />

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

            {/* 슬슬 쌓이는 중일 때만 보이는 번개(활기) 디테일 */}
            {theme.stage === 'rising' && (
              <path
                d="M154,58 L144,74 L151,74 L147,90 L162,70 L154,70 Z"
                fill="#FBBF24"
                stroke="#F59E0B"
                strokeWidth="1"
                strokeLinejoin="round"
                aria-hidden="true"
              />
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
          className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wide"
          style={{ color: theme.from }}
        >
          <span aria-hidden="true">{theme.emoji}</span>
          {theme.label}
        </span>
        <p className="mt-1 text-xs font-medium tracking-wide text-navy-soft">현재 참고 에너지</p>
        <p className="font-display text-3xl text-charcoal sm:text-4xl">
          {Math.round(currentEnergyKcal)}
          <span className="ml-0.5 text-base font-semibold text-navy-soft">kcal</span>
        </p>
      </div>

      <div className="flex items-center gap-6 text-center">
        <div>
          <p className="text-xl font-bold text-charcoal">{snackCount}</p>
          <p className="text-xs text-navy-soft">오늘 기록한 간식</p>
        </div>
        <div className="h-8 w-px bg-navy/10" />
        <button
          type="button"
          onClick={onCompletedWorkoutsClick}
          className="rounded-xl px-2 py-1 transition-colors hover:bg-navy/5 active:scale-95"
        >
          <p className="text-xl font-bold text-charcoal">{completedWorkoutCount}</p>
          <p className="text-xs text-navy-soft">완료한 움직임</p>
        </button>
      </div>

      <p className="max-w-xs text-center text-[11px] leading-relaxed text-navy-soft">
        물결은 음식이나 체지방이 사라진다는 의미가 아니라, 기록된 간식 에너지와 완료한 움직임을
        비교해 보여주는 참고용 표시예요. 많이 채워질수록 아직 못 움직인 만큼이 쌓였다는 뜻이에요.
      </p>
    </div>
  );
}
