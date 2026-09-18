import type { CSSProperties } from 'react';
import runnerMale from '../assets/runner-male.jpg';
import runnerFemale from '../assets/runner-female.jpg';

export type RunnerCharacter = 'male' | 'female';

interface WaveVisualizationProps {
  currentEnergyKcal: number;
  fillPercent: number;
  snackCount: number;
  completedWorkoutCount: number;
  character: RunnerCharacter;
  onToggleCharacter: () => void;
}

const RUNNER_IMAGE: Record<RunnerCharacter, string> = {
  male: runnerMale,
  female: runnerFemale,
};

const RUNNER_SCALE: Record<RunnerCharacter, number> = {
  male: 1.15,
  female: 1,
};

// 남성 실루엣은 확대하면서 머리가 위쪽 버튼과 겹치지 않도록 아래로 살짝 내려줍니다.
const RUNNER_SHIFT_PERCENT: Record<RunnerCharacter, number> = {
  male: 7,
  female: 0,
};

// 에너지가 많이 쌓일수록(=아직 못 움직인 만큼 많을수록) "안 좋은" 방향이라는 걸
// 색과 속도로 드러내기 위한 3단계 테마입니다. calm(가벼움) → building(쌓이는 중) → heavy(많이 쌓임)
interface FillTheme {
  label: string;
  emoji: string;
  from: string;
  to: string;
  crest: string;
  ripple: string;
  glow: string;
  halo: string;
  waveSeconds: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function getDynamicTheme(percent: number): FillTheme {
  const p = Math.max(0, Math.min(100, percent));
  
  let h, s, l;
  let emoji, label;
  
  if (p < 50) {
    const t = p / 50;
    // Teal (172, 77%, 50%) to Amber (45, 96%, 56%)
    h = lerp(172, 45, t);
    s = lerp(77, 96, t);
    l = lerp(50, 56, t);
    emoji = p < 25 ? '🌱' : '⚡';
    label = p < 25 ? '가벼운 상태예요' : '슬슬 쌓이고 있어요';
  } else {
    const t = (p - 50) / 50;
    // Amber (45, 96%, 56%) to Rose (-13, 89%, 60%)
    h = lerp(45, -13, t);
    s = lerp(96, 89, t);
    l = lerp(56, 60, t);
    emoji = p < 80 ? '🔥' : '🚨';
    label = p < 80 ? '많이 쌓였어요' : '최대치예요!';
  }
  
  const hNorm = (h + 360) % 360;
  const baseColor = `hsl(${hNorm}, ${s}%, ${l}%)`;
  const darkColor = `hsl(${hNorm}, ${s}%, ${l - 12}%)`;
  const lightColor = `hsl(${hNorm}, ${s}%, ${l + 25}%)`;
  
  return {
    label,
    emoji,
    from: baseColor,
    to: darkColor,
    crest: baseColor,
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
];

export function WaveVisualization({
  currentEnergyKcal,
  fillPercent,
  snackCount,
  completedWorkoutCount,
  character,
  onToggleCharacter,
}: WaveVisualizationProps) {
  const clamped = Math.max(0, Math.min(100, fillPercent));
  const theme = getDynamicTheme(clamped);
  const haloStyle = {
    '--halo-color': theme.halo,
    '--halo-speed': `${theme.waveSeconds + 1.3}s`,
  } as CSSProperties;

  return (
    <div id="hero" className="flex scroll-mt-20 flex-col items-center gap-4">
      <div className="relative flex w-full flex-col items-center gap-4">
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

        <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          {/* 실루엣 원본 배경이 흰색이든 체크무늬(투명 미리보기)든 밝기만으로
              보이는 부분을 가르도록 흑백 변환 + 임계값 처리 — 배경이 얼룩덜룩해도
              루미넌스 마스크가 안정적으로 동작함 */}
          <filter id="afterbite-silhouette-filter" colorInterpolationFilters="sRGB">
            <feColorMatrix
              type="matrix"
              values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0"
            />
            <feComponentTransfer>
              <feFuncR type="discrete" tableValues="1 1 1 1 1 0 0 0 0 0" />
              <feFuncG type="discrete" tableValues="1 1 1 1 1 0 0 0 0 0" />
              <feFuncB type="discrete" tableValues="1 1 1 1 1 0 0 0 0 0" />
            </feComponentTransfer>
          </filter>
          <mask id="afterbite-runner-mask" maskContentUnits="objectBoundingBox">
            <image
              href={RUNNER_IMAGE[character]}
              x="0"
              y="0"
              width="1"
              height="1"
              preserveAspectRatio="xMidYMax meet"
              filter="url(#afterbite-silhouette-filter)"
              style={{
                transformBox: 'fill-box',
                transformOrigin: '50% 100%',
                transform: `translateY(${RUNNER_SHIFT_PERCENT[character]}%) scale(${RUNNER_SCALE[character]})`,
              }}
            />
          </mask>
        </defs>
      </svg>

      <button
        type="button"
        onClick={onToggleCharacter}
        data-on={character === 'female'}
        aria-label={character === 'male' ? '여성 캐릭터로 전환' : '남성 캐릭터로 전환'}
        className="gender-switch"
      >
        <span className="gender-switch-thumb" aria-hidden="true" />
      </button>

      <div
        className="wave-halo mx-auto h-[clamp(260px,72vw,380px)] w-[clamp(240px,66vw,350px)]"
        style={haloStyle}
      >
        <div className="wave-backdrop-glow" aria-hidden="true" />
        <div
          className="wave-glow relative h-full w-full bg-white/12"
          style={
            {
              maskImage: 'url(#afterbite-runner-mask)',
              WebkitMaskImage: 'url(#afterbite-runner-mask)',
              '--glow-color': theme.glow,
            } as CSSProperties
          }
        >
          <div
            className="wave-fill-transition absolute inset-x-0 bottom-0"
            style={{ height: `${clamped}%` }}
          >
            <div className="absolute inset-x-0 -top-3 h-6 overflow-hidden">
              <svg
                className="wave-layer h-6 w-[200%]"
                viewBox="0 0 400 24"
                preserveAspectRatio="none"
                style={{ animationDuration: `${theme.waveSeconds}s` }}
              >
                <path
                  d="M0 12 C 50 0, 150 24, 200 12 C 250 0, 350 24, 400 12 L 400 24 L 0 24 Z"
                  fill={theme.crest}
                  opacity="0.85"
                />
                <path
                  d="M200 12 C 250 0, 350 24, 400 12 C 450 0, 550 24, 600 12 L 600 24 L 200 24 Z"
                  fill={theme.crest}
                  opacity="0.85"
                />
              </svg>
            </div>
            <div
              className="wave-layer wave-layer-slow absolute inset-x-0 -top-2 h-5 overflow-hidden opacity-60"
              style={{ animationDuration: `${theme.waveSeconds * 1.6}s` }}
            >
              <svg className="h-5 w-[200%]" viewBox="0 0 400 20" preserveAspectRatio="none">
                <path
                  d="M0 10 C 60 20, 140 0, 200 10 C 260 20, 340 0, 400 10 L 400 20 L 0 20 Z"
                  fill={theme.ripple}
                />
                <path
                  d="M200 10 C 260 20, 340 0, 400 10 C 460 20, 540 0, 600 10 L 600 20 L 200 20 Z"
                  fill={theme.ripple}
                />
              </svg>
            </div>
            <div
              className="absolute inset-x-0 bottom-0 top-3"
              style={{ backgroundImage: `linear-gradient(180deg, ${theme.from}, ${theme.to})` }}
            />
          </div>
        </div>
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
        <div>
          <p className="text-xl font-bold text-charcoal">{completedWorkoutCount}</p>
          <p className="text-xs text-navy-soft">완료한 움직임</p>
        </div>
      </div>

      <p className="max-w-xs text-center text-[11px] leading-relaxed text-navy-soft">
        물결은 음식이나 체지방이 사라진다는 의미가 아니라, 기록된 간식 에너지와 완료한 움직임을
        비교해 보여주는 참고용 표시예요. 많이 채워질수록 아직 못 움직인 만큼이 쌓였다는 뜻이에요.
      </p>
    </div>
  );
}
