import { useMemo } from 'react';
import type { CompletedWorkoutRecord, Snack } from '../types';

/** 기록된 간식 에너지 대비 완료한 움직임을 비교해 웨이브 게이지에 보여줄 값을 계산합니다. */
export function useEnergyGauge(snacks: Snack[], completedWorkouts: CompletedWorkoutRecord[]) {
  const totalEatenKcal = useMemo(() => snacks.reduce((sum, s) => sum + s.totalCalories, 0), [snacks]);
  const totalBurnedMidKcal = useMemo(
    () => completedWorkouts.reduce((sum, w) => sum + (w.burnedLowKcal + w.burnedHighKcal) / 2, 0),
    [completedWorkouts]
  );
  const currentEnergyKcal = Math.max(0, totalEatenKcal - totalBurnedMidKcal);
  // 간식 한두 개만 기록해도 게이지가 금방 꽉 차 보이지 않도록 기준선을 넉넉하게 잡습니다.
  // 예전엔 이 기준선이 currentEnergyKcal에 비례해서 같이 커지는 바람에(currentEnergyKcal * 1.6)
  // 퍼센트가 항상 1/1.6 ≈ 62.5%에 수렴해버려 아무리 많이 먹어도 주황 구간을 못 벗어났습니다.
  // 기준선은 고정값으로 둬야 실제로 0~100% 전 구간을 오갈 수 있습니다.
  const referenceMax = 1500;
  const fillPercent = (currentEnergyKcal / referenceMax) * 100;

  return { currentEnergyKcal, fillPercent };
}
