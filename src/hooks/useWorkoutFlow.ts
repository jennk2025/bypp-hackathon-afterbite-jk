import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { generateId } from '../lib/id';
import { recommendRoutines } from '../lib/routineVision';
import type { AppState, CompletedWorkoutRecord, ExerciseRoutine, MoveConditions, Screen, Snack } from '../types';

// completeWorkout(타이머로 진행 중이던 운동 완료)과 completeRoutineWithoutTimer(타이머 없이 바로
// 완료 기록)가 공유하는 계산: 태운 칼로리(중간값)를 선택된 간식 순서대로 다 채울 때까지 나눠
// 차감합니다. 다 태우지 못한 간식은 완료 처리하지 않고, 남은 만큼만 줄여 다시 선택할 수 있게 둡니다.
function applyRoutineCompletion(
  snacks: Snack[],
  routine: ExerciseRoutine,
  snackIds: string[],
  snackRemainingSnapshot: Record<string, number>
): { snacks: Snack[]; completedWorkout: CompletedWorkoutRecord } {
  let remainingBurn = (routine.estBurnLowKcal + routine.estBurnHighKcal) / 2;
  const updatedSnacks = snacks.map((s) => {
    if (!snackIds.includes(s.id)) return s;
    const before = snackRemainingSnapshot[s.id] ?? s.remainingCalories;
    if (remainingBurn <= 0) {
      return { ...s, exerciseStatus: 'none' as const, remainingCalories: before };
    }
    if (remainingBurn >= before) {
      remainingBurn -= before;
      return { ...s, exerciseStatus: 'completed' as const, remainingCalories: 0 };
    }
    const after = before - remainingBurn;
    remainingBurn = 0;
    return { ...s, exerciseStatus: 'none' as const, remainingCalories: after };
  });

  return {
    snacks: updatedSnacks,
    completedWorkout: {
      id: generateId(),
      routineName: routine.name,
      snackIds,
      snackRemainingSnapshot,
      burnedLowKcal: routine.estBurnLowKcal,
      burnedHighKcal: routine.estBurnHighKcal,
      completedAt: new Date().toISOString(),
    },
  };
}

interface UseWorkoutFlowParams {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  screen: Screen;
  setScreen: (screen: Screen) => void;
  selectedIds: Set<string>;
  selectedTotalCalories: number;
  clearSelection: () => void;
}

/** 조건 입력 → AI/규칙 기반 루틴 추천 → 운동 타이머 → 완료(부분 소모 반영)까지의 흐름을 관리합니다. */
export function useWorkoutFlow({
  state,
  setState,
  screen,
  setScreen,
  selectedIds,
  selectedTotalCalories,
  clearSelection,
}: UseWorkoutFlowParams) {
  const [routines, setRoutines] = useState<ExerciseRoutine[]>([]);
  const [isRecommendingRoutines, setIsRecommendingRoutines] = useState(false);
  const [lastConditions, setLastConditions] = useState<MoveConditions | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

  // 의도적으로 status만 의존성에 넣습니다: inProgressWorkout 객체 전체를 넣으면
  // elapsedSeconds가 바뀔 때마다(매초) 이 이펙트가 재실행되어 인터벌이 계속 재생성됩니다.
  useEffect(() => {
    if (screen !== 'workout') return;
    if (!state.inProgressWorkout || state.inProgressWorkout.status !== 'running') return;
    const interval = setInterval(() => {
      setState((prev) =>
        prev.inProgressWorkout
          ? {
              ...prev,
              inProgressWorkout: {
                ...prev.inProgressWorkout,
                elapsedSeconds: prev.inProgressWorkout.elapsedSeconds + 1,
              },
            }
          : prev
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [screen, state.inProgressWorkout?.status, setState]);

  async function fetchRoutines(cond: MoveConditions) {
    setIsRecommendingRoutines(true);
    setRoutines([]);
    const result = await recommendRoutines(cond, selectedTotalCalories);
    setRoutines(result);
    setIsRecommendingRoutines(false);
  }

  async function handleConditionsSubmit(cond: MoveConditions) {
    setLastConditions(cond);
    setScreen('routines');
    await fetchRoutines(cond);
  }

  function handleRetryRoutines() {
    if (lastConditions) fetchRoutines(lastConditions);
  }

  function handleRoutineSelect(routine: ExerciseRoutine) {
    setState((prev) => {
      let snackIds = Array.from(selectedIds);
      let snackRemainingSnapshot: Record<string, number> = {};

      if (snackIds.length === 0 && prev.inProgressWorkout) {
        snackIds = prev.inProgressWorkout.snackIds;
        snackRemainingSnapshot = prev.inProgressWorkout.snackRemainingSnapshot;
      } else {
        snackRemainingSnapshot = Object.fromEntries(
          snackIds.map((id) => [id, prev.snacks.find((s) => s.id === id)?.remainingCalories ?? 0])
        );
      }

      return {
        ...prev,
        snacks: prev.snacks.map((s) => (snackIds.includes(s.id) ? { ...s, exerciseStatus: 'in_progress' } : s)),
        inProgressWorkout: {
          routine,
          snackIds,
          snackRemainingSnapshot,
          elapsedSeconds: 0,
          status: 'running',
          savedAt: new Date().toISOString(),
        },
      };
    });
    clearSelection();
    setScreen('workout');
  }

  function pauseAndBrowseRoutines() {
    setState((prev) =>
      prev.inProgressWorkout
        ? {
            ...prev,
            inProgressWorkout: {
              ...prev.inProgressWorkout,
              status: 'paused',
            },
          }
        : prev
    );
    setScreen('routines');
  }

  function pauseResumeWorkout() {
    setState((prev) =>
      prev.inProgressWorkout
        ? {
            ...prev,
            inProgressWorkout: {
              ...prev.inProgressWorkout,
              status: prev.inProgressWorkout.status === 'running' ? 'paused' : 'running',
            },
          }
        : prev
    );
  }

  function completeWorkout() {
    setState((prev) => {
      if (!prev.inProgressWorkout) return prev;
      const { routine, snackIds, snackRemainingSnapshot } = prev.inProgressWorkout;
      const { snacks, completedWorkout } = applyRoutineCompletion(
        prev.snacks,
        routine,
        snackIds,
        snackRemainingSnapshot
      );
      setJustCompletedId(completedWorkout.id);
      return {
        ...prev,
        snacks,
        completedWorkouts: [...prev.completedWorkouts, completedWorkout],
        inProgressWorkout: null,
      };
    });
    setScreen('tray');
  }

  // 타이머를 켜고 기다리기 귀찮을 때, 루틴 추천 화면에서 바로 "완료로 기록"할 수 있는 지름길입니다.
  // 실제로 운동을 진행하지 않으므로 완료 배너의 "완료 취소"로 언제든 되돌릴 수 있음을 함께 알립니다.
  function completeRoutineWithoutTimer(routine: ExerciseRoutine) {
    const snackIds = Array.from(selectedIds);
    setState((prev) => {
      const snackRemainingSnapshot = Object.fromEntries(
        snackIds.map((id) => [id, prev.snacks.find((s) => s.id === id)?.remainingCalories ?? 0])
      );
      const { snacks, completedWorkout } = applyRoutineCompletion(
        prev.snacks,
        routine,
        snackIds,
        snackRemainingSnapshot
      );
      setJustCompletedId(completedWorkout.id);
      return {
        ...prev,
        snacks,
        completedWorkouts: [...prev.completedWorkouts, completedWorkout],
      };
    });
    clearSelection();
    setScreen('tray');
  }

  function cancelWorkout() {
    setState((prev) => {
      if (!prev.inProgressWorkout) return prev;
      const { snackIds } = prev.inProgressWorkout;
      return {
        ...prev,
        snacks: prev.snacks.map((s) => (snackIds.includes(s.id) ? { ...s, exerciseStatus: 'none' } : s)),
        inProgressWorkout: null,
      };
    });
    setScreen('tray');
  }

  function undoLastCompletion() {
    setState((prev) => {
      const last = prev.completedWorkouts[prev.completedWorkouts.length - 1];
      if (!last || last.id !== justCompletedId) return prev;
      return {
        ...prev,
        snacks: prev.snacks.map((s) =>
          last.snackIds.includes(s.id)
            ? {
                ...s,
                exerciseStatus: 'none',
                remainingCalories: last.snackRemainingSnapshot[s.id] ?? s.remainingCalories,
              }
            : s
        ),
        completedWorkouts: prev.completedWorkouts.slice(0, -1),
      };
    });
    setJustCompletedId(null);
  }

  // 완료 기록 화면에서 개별 기록을 지울 때 사용합니다. 이미 지난 완료 기록이라 간식의
  // remainingCalories는 되돌리지 않고, 기록 목록에서만 제거합니다.
  function deleteCompletedWorkout(id: string) {
    setState((prev) => ({
      ...prev,
      completedWorkouts: prev.completedWorkouts.filter((w) => w.id !== id),
    }));
    if (justCompletedId === id) setJustCompletedId(null);
  }

  return {
    routines,
    isRecommendingRoutines,
    justCompletedId,
    setJustCompletedId,
    handleConditionsSubmit,
    handleRetryRoutines,
    handleRoutineSelect,
    completeRoutineWithoutTimer,
    pauseResumeWorkout,
    pauseAndBrowseRoutines,
    completeWorkout,
    cancelWorkout,
    undoLastCompletion,
    deleteCompletedWorkout,
  };
}
