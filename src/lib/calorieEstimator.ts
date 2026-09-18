// 개인정보(체중)를 수집하지 않는 대신, 대표 체중 구간으로 소모 칼로리 "범위"를 추정합니다.
const REFERENCE_WEIGHT_LOW_KG = 50;
const REFERENCE_WEIGHT_HIGH_KG = 80;

export function estimateBurnRange(met: number, minutes: number): { low: number; high: number } {
  const hours = minutes / 60;
  const low = Math.round(met * REFERENCE_WEIGHT_LOW_KG * hours);
  const high = Math.round(met * REFERENCE_WEIGHT_HIGH_KG * hours);
  return { low, high };
}
