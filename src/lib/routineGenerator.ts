import { EXERCISES } from '../data/exerciseDatabase';
import { estimateBurnRange } from './calorieEstimator';
import type { ExerciseDef, ExerciseRoutine, MoveConditions } from '../types';

const INTENSITY_ORDER: Record<ExerciseDef['intensity'], number> = { low: 0, mid: 1, high: 2 };

function matchesFull(ex: ExerciseDef, cond: MoveConditions): boolean {
  return (
    ex.place.includes(cond.place) &&
    (cond.jumpOk || !ex.requiresJump) &&
    (cond.noiseOk || ex.noise === 'quiet') &&
    INTENSITY_ORDER[ex.intensity] <= INTENSITY_ORDER[cond.intensity]
  );
}

function matchesRelaxIntensity(ex: ExerciseDef, cond: MoveConditions): boolean {
  return ex.place.includes(cond.place) && (cond.jumpOk || !ex.requiresJump) && (cond.noiseOk || ex.noise === 'quiet');
}

function matchesRelaxNoise(ex: ExerciseDef, cond: MoveConditions): boolean {
  return ex.place.includes(cond.place) && (cond.jumpOk || !ex.requiresJump);
}

function matchesRelaxPlace(ex: ExerciseDef, cond: MoveConditions): boolean {
  return cond.jumpOk || !ex.requiresJump;
}

function pickDuration(ex: ExerciseDef, minutes: number): number {
  const [min, max] = ex.suitableMinutes;
  return Math.min(Math.max(minutes, min), max);
}

function toRoutine(ex: ExerciseDef, minutes: number): ExerciseRoutine {
  const duration = pickDuration(ex, minutes);
  const { low, high } = estimateBurnRange(ex.met, duration);
  return {
    id: ex.id,
    name: ex.name,
    steps: ex.steps,
    durationMinutes: duration,
    estBurnLowKcal: low,
    estBurnHighKcal: high,
  };
}

function pickDiverse(candidates: ExerciseDef[], count: number): ExerciseDef[] {
  const sorted = [...candidates].sort((a, b) => a.met - b.met);
  const bucketSize = Math.ceil(sorted.length / count) || 1;
  const picks: ExerciseDef[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < count; i++) {
    const bucket = sorted.slice(i * bucketSize, (i + 1) * bucketSize);
    const pick = bucket.find((ex) => !seen.has(ex.id));
    if (pick) {
      picks.push(pick);
      seen.add(pick.id);
    }
  }

  for (const ex of sorted) {
    if (picks.length >= count) break;
    if (!seen.has(ex.id)) {
      picks.push(ex);
      seen.add(ex.id);
    }
  }

  return picks.slice(0, count);
}

export function generateRoutines(cond: MoveConditions): ExerciseRoutine[] {
  const filters = [matchesFull, matchesRelaxIntensity, matchesRelaxNoise, matchesRelaxPlace];

  let candidates: ExerciseDef[] = [];
  for (const filter of filters) {
    candidates = EXERCISES.filter((ex) => filter(ex, cond));
    if (candidates.length >= 3) break;
  }
  if (candidates.length < 3) candidates = EXERCISES;

  const picks = pickDiverse(candidates, 3);
  return picks.map((ex) => toRoutine(ex, cond.minutes));
}
