import { useMemo } from 'react';
import { REFERENCE_MAX_KCAL } from '../lib/energyStage';
import type { CompletedWorkoutRecord, Snack } from '../types';

/** 기록된 간식 에너지 대비 완료한 움직임을 비교해 웨이브 게이지에 보여줄 값을 계산합니다. */
export function useEnergyGauge(snacks: Snack[], completedWorkouts: CompletedWorkoutRecord[]) {
  const totalEatenKcal = useMemo(() => snacks.reduce((sum, s) => sum + s.totalCalories, 0), [snacks]);
  const totalBurnedMidKcal = useMemo(
    () => completedWorkouts.reduce((sum, w) => sum + (w.burnedLowKcal + w.burnedHighKcal) / 2, 0),
    [completedWorkouts]
  );
  const currentEnergyKcal = Math.max(0, totalEatenKcal - totalBurnedMidKcal);
  const fillPercent = (currentEnergyKcal / REFERENCE_MAX_KCAL) * 100;

  return { currentEnergyKcal, fillPercent };
}
