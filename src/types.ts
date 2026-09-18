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
  elapsedSeconds: number;
  status: 'running' | 'paused';
  currentStepIndex: number;
  savedAt: string;
}

export interface CompletedWorkoutRecord {
  id: string;
  routineName: string;
  snackIds: string[];
  burnedLowKcal: number;
  burnedHighKcal: number;
  completedAt: string;
}

export interface AppState {
  snacks: Snack[];
  completedWorkouts: CompletedWorkoutRecord[];
  inProgressWorkout: InProgressWorkout | null;
}

export interface SnackDbEntry {
  name: string;
  servingSizeLabel: string;
  caloriesPerServing: number;
  category: string;
}
