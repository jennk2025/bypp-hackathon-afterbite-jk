import type { AppState } from '../types';

const STORAGE_KEY = 'afterbite_state_v1';

const defaultState: AppState = {
  snacks: [],
  completedWorkouts: [],
  inProgressWorkout: null,
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    // 예전 버전 데이터엔 remainingCalories가 없을 수 있어, 상태에 맞게 채워줍니다.
    const snacks = (parsed.snacks ?? []).map((s) => ({
      ...s,
      remainingCalories:
        typeof s.remainingCalories === 'number'
          ? s.remainingCalories
          : s.exerciseStatus === 'completed'
            ? 0
            : s.totalCalories,
    }));

    const inProgressWorkout = parsed.inProgressWorkout ?? null;
    if (inProgressWorkout && !inProgressWorkout.snackRemainingSnapshot) {
      inProgressWorkout.snackRemainingSnapshot = Object.fromEntries(
        inProgressWorkout.snackIds.map((id) => [
          id,
          snacks.find((s) => s.id === id)?.remainingCalories ?? 0,
        ])
      );
    }

    return {
      snacks,
      completedWorkouts: (parsed.completedWorkouts ?? []).map((w) => ({
        ...w,
        snackRemainingSnapshot: w.snackRemainingSnapshot ?? {},
      })),
      inProgressWorkout,
    };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage 접근 실패 시에도 앱이 계속 동작하도록 조용히 무시
  }
}

// "전체 초기화" — 저장된 기록을 완전히 지우고 빈 상태를 돌려줍니다.
export function clearState(): AppState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage 접근 실패 시에도 앱이 계속 동작하도록 조용히 무시
  }
  return defaultState;
}
