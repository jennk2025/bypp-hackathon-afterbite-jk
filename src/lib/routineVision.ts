import { generateRoutines } from './routineGenerator';
import { generateId } from './id';
import type { ExerciseRoutine, MoveConditions } from '../types';

interface GeminiRoutine {
  name?: unknown;
  durationMinutes?: unknown;
  estBurnLowKcal?: unknown;
  estBurnHighKcal?: unknown;
  steps?: unknown;
}

async function tryGeminiRoutines(
  cond: MoveConditions,
  totalCalories: number
): Promise<ExerciseRoutine[] | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const response = await fetch('/api/recommend-routine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...cond, totalCalories }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) return null;

    const data = await response.json();
    const list: GeminiRoutine[] = Array.isArray(data?.routines) ? data.routines : [];

    const routines: ExerciseRoutine[] = list
      .filter((r) => typeof r.name === 'string' && Array.isArray(r.steps))
      .map((r) => {
        const low = typeof r.estBurnLowKcal === 'number' ? Math.max(0, Math.round(r.estBurnLowKcal)) : 0;
        const high = typeof r.estBurnHighKcal === 'number' ? Math.max(0, Math.round(r.estBurnHighKcal)) : 0;
        return {
          id: generateId(),
          name: r.name as string,
          steps: (r.steps as unknown[]).filter((s): s is string => typeof s === 'string').slice(0, 4),
          durationMinutes:
            typeof r.durationMinutes === 'number' && r.durationMinutes > 0
              ? Math.round(r.durationMinutes)
              : cond.minutes,
          estBurnLowKcal: Math.min(low, high),
          estBurnHighKcal: Math.max(low, high),
        };
      })
      .filter((r) => r.name && r.steps.length > 0)
      .slice(0, 3);

    return routines.length > 0 ? routines : null;
  } catch {
    return null;
  }
}

/**
 * 1) Gemini에게 지금 조건(시간·장소·강도·소음·점프 가능 여부)에 맞는 맞춤 루틴을 먼저 요청하고
 * 2) 실패하면(네트워크 문제·서버 설정 안 됨·한도 초과 등) 기존 규칙 기반 추천(routineGenerator)으로
 *    자동 전환합니다. 간식 사진 인식과 동일한 "AI 우선, 실패 시 로컬 대체" 패턴입니다.
 */
export async function recommendRoutines(
  cond: MoveConditions,
  totalCalories: number
): Promise<ExerciseRoutine[]> {
  const geminiRoutines = await tryGeminiRoutines(cond, totalCalories);
  if (geminiRoutines) return geminiRoutines;
  return generateRoutines(cond);
}
