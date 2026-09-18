export type SnackSource = 'photo' | 'search' | 'manual';
export type ExerciseStatus = 'none' | 'in_progress' | 'completed';

export interface Snack {
  id: string;
  name: string;
  caloriesPerServing: number;
  servingSizeLabel: string;
  portionMultiplier: number;
  portionLabel: string;
  totalCalories: number;
  // 아직 못 움직인(소모하지 못한) 칼로리. 운동을 완료해도 이만큼을 다 태우지 못하면
  // 남은 만큼만 줄어들고 exerciseStatus는 'none'으로 남아 다시 선택할 수 있습니다.
  remainingCalories: number;
  addedAt: string;
  source: SnackSource;
  exerciseStatus: ExerciseStatus;
}

export type Place = 'narrow_indoor' | 'living_room' | 'outdoor';
export type Intensity = 'low' | 'mid' | 'high';
export type Noise = 'quiet' | 'mid' | 'loud';

export interface ExerciseDef {
  id: string;
  name: string;
  met: number;
  place: Place[];
  intensity: Intensity;
  noise: Noise;
  requiresJump: boolean;
  suitableMinutes: [number, number];
  steps: string[];
}

export interface ExerciseRoutine {
  id: string;
  name: string;
  steps: string[];
  durationMinutes: number;
  estBurnLowKcal: number;
  estBurnHighKcal: number;
}

export interface MoveConditions {
  minutes: number;
  place: Place;
  intensity: Intensity;
  noiseOk: boolean;
  jumpOk: boolean;
}

export interface InProgressWorkout {
  routine: ExerciseRoutine;
  snackIds: string[];
  // 운동을 시작하던 시점의 간식별 남은 칼로리 스냅샷. 완료 시 이 값을 기준으로
  // 소모한 만큼만 차감하고, 취소/완료취소 시 이 값으로 정확히 되돌립니다.
  snackRemainingSnapshot: Record<string, number>;
  elapsedSeconds: number;
  status: 'running' | 'paused';
  savedAt: string;
}

export interface CompletedWorkoutRecord {
  id: string;
  routineName: string;
  snackIds: string[];
  snackRemainingSnapshot: Record<string, number>;
  burnedLowKcal: number;
  burnedHighKcal: number;
  completedAt: string;
}

export interface AppState {
  snacks: Snack[];
  completedWorkouts: CompletedWorkoutRecord[];
  inProgressWorkout: InProgressWorkout | null;
}

export type Screen = 'tray' | 'conditions' | 'routines' | 'workout';

export interface SnackDbEntry {
  name: string;
  servingSizeLabel: string;
  caloriesPerServing: number;
  category: string;
}
