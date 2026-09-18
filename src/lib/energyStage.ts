// 캐릭터 표정과 균형 게이지 바가 공유하는 3단계 기준입니다. 두 컴포넌트가 서로 다른
// 경계값을 쓰면 캐릭터는 웃고 있는데 게이지 바는 빨간 구간이라는 식으로 어긋나 보이므로
// 한 곳에서만 정의합니다.
export type Stage = 'light' | 'rising' | 'heavy';

export const STAGE_RISING_AT = 35;
export const STAGE_HEAVY_AT = 70;

export function stageOf(percent: number): Stage {
  if (percent < STAGE_RISING_AT) return 'light';
  if (percent < STAGE_HEAVY_AT) return 'rising';
  return 'heavy';
}

export const STAGE_COPY: Record<Stage, { label: string; emoji: string; range: string }> = {
  light: { label: '가벼운 상태예요, 건강 그 자체예요', emoji: '🌱', range: `0~${STAGE_RISING_AT - 1}%` },
  rising: {
    label: '슬슬 쌓이고 있어요',
    emoji: '⚡',
    range: `${STAGE_RISING_AT}~${STAGE_HEAVY_AT - 1}%`,
  },
  heavy: { label: '많이 쌓였어요, 같이 움직여요', emoji: '🔥', range: `${STAGE_HEAVY_AT}~100%` },
};
