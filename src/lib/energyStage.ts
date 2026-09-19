// 캐릭터 표정과 균형 게이지 바가 공유하는 3단계 기준입니다. 두 컴포넌트가 서로 다른
// 경계값을 쓰면 캐릭터는 웃고 있는데 게이지 바는 빨간 구간이라는 식으로 어긋나 보이므로
// 한 곳에서만 정의합니다.
export type Stage = 'light' | 'rising' | 'heavy';

// 이 kcal에 도달하면 100%(빨간 구간)입니다. 이 앱은 끼니가 아닌 "간식"만 기록하는
// 컨셉이라 하루 식사 전체 기준(2000kcal대)보다 낮게 잡되, 조금 더 여유 있게 1400kcal로
// 뒀습니다. useEnergyGauge의 fillPercent 계산과 BalanceScale의 kcal 안내 문구가 이 값을
// 공유해서 서로 어긋나지 않게 합니다.
export const REFERENCE_MAX_KCAL = 1400;

export const STAGE_RISING_AT = 35;
export const STAGE_HEAVY_AT = 70;

export function stageOf(percent: number): Stage {
  if (percent < STAGE_RISING_AT) return 'light';
  if (percent < STAGE_HEAVY_AT) return 'rising';
  return 'heavy';
}

export const STAGE_COPY: Record<Stage, { label: string; emoji: string }> = {
  light: { label: '가벼운 상태예요, 건강 그 자체예요', emoji: '🌱' },
  rising: { label: '슬슬 쌓이고 있어요', emoji: '⚡' },
  heavy: { label: '많이 쌓였어요, 같이 움직여요', emoji: '🔥' },
};

// REFERENCE_MAX_KCAL(100%)를 실제로 넘어섰을 때만 쓰는 문구입니다. 막 빨간 구간에
// 들어섰을 때("많이 쌓였어요")와 그보다 훨씬 더 쌓였을 때를 구분해서 보여줍니다.
const OVERFLOW_COPY = { label: '아직 많이 남았어요', emoji: '🥵' };

// 색상/표정(캐릭터, 게이지 막대의 진한 정도)은 clamp된 값 기준 stageOf를 그대로 쓰고,
// 문구만 이 함수로 별도 계산합니다 — clamp 전의 원래 퍼센트를 받아야 100% 초과를
// 구분할 수 있기 때문입니다.
export function labelFor(rawPercent: number): { label: string; emoji: string } {
  if (rawPercent > 100) return OVERFLOW_COPY;
  return STAGE_COPY[stageOf(rawPercent)];
}

function kcalAt(percent: number): number {
  return Math.round((percent / 100) * REFERENCE_MAX_KCAL);
}

// 퍼센트 구간을 실제 kcal 범위 문구로 바꿔줍니다. (예: "0~874kcal")
export const STAGE_KCAL_RANGE: Record<Stage, string> = {
  light: `0~${kcalAt(STAGE_RISING_AT) - 1}kcal`,
  rising: `${kcalAt(STAGE_RISING_AT)}~${kcalAt(STAGE_HEAVY_AT) - 1}kcal`,
  heavy: `${kcalAt(STAGE_HEAVY_AT)}kcal+`,
};
