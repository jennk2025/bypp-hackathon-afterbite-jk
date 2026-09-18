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
  const referenceMax = Math.max(1500, currentEnergyKcal * 1.6);
  const fillPercent = referenceMax > 0 ? (currentEnergyKcal / referenceMax) * 100 : 0;

  return { currentEnergyKcal, fillPercent };
}
