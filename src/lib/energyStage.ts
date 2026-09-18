// 캐릭터 표정과 균형 게이지 바가 공유하는 3단계 기준입니다. 두 컴포넌트가 서로 다른
// 경계값을 쓰면 캐릭터는 웃고 있는데 게이지 바는 빨간 구간이라는 식으로 어긋나 보이므로
// 한 곳에서만 정의합니다.
export type Stage = 'light' | 'rising' | 'heavy';

// 이 kcal에 도달하면 100%(빨간 구간)입니다. 이 앱은 끼니가 아닌 "간식"만 기록하는
// 컨셉이라 하루 식사 전체 기준(2000kcal대)보다 낮게, 간식만으로 하루 1200kcal쯤 쌓이면
// "많이 먹었다"로 보이도록 잡았습니다. useEnergyGauge의 fillPercent 계산과 BalanceScale의
// kcal 안내 문구가 이 값을 공유해서 서로 어긋나지 않게 합니다.
export const REFERENCE_MAX_KCAL = 1200;

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

function kcalAt(percent: number): number {
  return Math.round((percent / 100) * REFERENCE_MAX_KCAL);
}

// 퍼센트 구간을 실제 kcal 범위 문구로 바꿔줍니다. (예: "0~874kcal")
export const STAGE_KCAL_RANGE: Record<Stage, string> = {
  light: `0~${kcalAt(STAGE_RISING_AT) - 1}kcal`,
  rising: `${kcalAt(STAGE_RISING_AT)}~${kcalAt(STAGE_HEAVY_AT) - 1}kcal`,
  heavy: `${kcalAt(STAGE_HEAVY_AT)}kcal+`,
};
