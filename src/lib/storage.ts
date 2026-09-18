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
    return {
      snacks: parsed.snacks ?? [],
      completedWorkouts: parsed.completedWorkouts ?? [],
      inProgressWorkout: parsed.inProgressWorkout ?? null,
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
