import { useEffect, useMemo, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { WaveVisualization, type RunnerCharacter } from './components/WaveVisualization';
import { SnackCard } from './components/SnackCard';
import { SelectionBar } from './components/SelectionBar';
import { AddSnackModal, type SnackFormInput } from './components/AddSnackModal';
import { MoveConditionForm } from './components/MoveConditionForm';
import { RoutineSuggestions } from './components/RoutineSuggestions';
import { WorkoutTimer } from './components/WorkoutTimer';
import { loadState, saveState } from './lib/storage';
import { generateId } from './lib/id';
import { recommendRoutines } from './lib/routineVision';
import type { AppState, ExerciseRoutine, MoveConditions, Snack } from './types';

type Screen = 'tray' | 'conditions' | 'routines' | 'workout';
type ModalState = { type: 'add' } | { type: 'edit'; snackId: string } | null;

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [screen, setScreen] = useState<Screen>('tray');
  const [modal, setModal] = useState<ModalState>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [routines, setRoutines] = useState<ExerciseRoutine[]>([]);
  const [isRecommendingRoutines, setIsRecommendingRoutines] = useState(false);
  const [lastConditions, setLastConditions] = useState<MoveConditions | null>(null);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);
  const [character, setCharacter] = useState<RunnerCharacter>(
    () => (localStorage.getItem('afterbite_character') as RunnerCharacter) || 'male'
  );

  function toggleCharacter() {
    setCharacter((prev) => {
      const next = prev === 'male' ? 'female' : 'male';
      localStorage.setItem('afterbite_character', next);
      return next;
    });
  }

  useEffect(() => {
    saveState(state);
  }, [state]);

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
  }, [screen, state.inProgressWorkout?.status]);

  const totalEatenKcal = useMemo(
    () => state.snacks.reduce((sum, s) => sum + s.totalCalories, 0),
    [state.snacks]
  );
  const totalBurnedMidKcal = useMemo(
    () =>
      state.completedWorkouts.reduce((sum, w) => sum + (w.burnedLowKcal + w.burnedHighKcal) / 2, 0),
    [state.completedWorkouts]
  );
  const currentEnergyKcal = Math.max(0, totalEatenKcal - totalBurnedMidKcal);
  // 간식 한두 개만 기록해도 게이지가 금방 꽉 차 보이지 않도록 기준선을 넉넉하게 잡습니다.
  const referenceMax = Math.max(1500, currentEnergyKcal * 1.6);
  const fillPercent = referenceMax > 0 ? (currentEnergyKcal / referenceMax) * 100 : 0;

  const selectableSnacks = state.snacks.filter((s) => s.exerciseStatus === 'none');
  const allSelected = selectableSnacks.length > 0 && selectableSnacks.every((s) => selectedIds.has(s.id));
  const selectedTotalCalories = state.snacks
    .filter((s) => selectedIds.has(s.id))
    .reduce((sum, s) => sum + s.remainingCalories, 0);

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    setSelectedIds(allSelected ? new Set() : new Set(selectableSnacks.map((s) => s.id)));
  }

  function addSnack(input: SnackFormInput) {
    const totalCalories = input.caloriesPerServing * input.portionMultiplier;
    const snack: Snack = {
      id: generateId(),
      name: input.name,
      caloriesPerServing: input.caloriesPerServing,
      servingSizeLabel: input.servingSizeLabel,
      portionMultiplier: input.portionMultiplier,
      portionLabel: input.portionLabel,
      totalCalories,
      remainingCalories: totalCalories,
      addedAt: new Date().toISOString(),
      source: input.source,
      exerciseStatus: 'none',
    };
    setState((prev) => ({ ...prev, snacks: [snack, ...prev.snacks] }));
    setModal(null);
  }

  function editSnack(id: string, input: SnackFormInput) {
    setState((prev) => ({
      ...prev,
      snacks: prev.snacks.map((s) => {
        if (s.id !== id) return s;
        const totalCalories = input.caloriesPerServing * input.portionMultiplier;
        return {
          ...s,
          name: input.name,
          caloriesPerServing: input.caloriesPerServing,
          servingSizeLabel: input.servingSizeLabel,
          portionMultiplier: input.portionMultiplier,
          portionLabel: input.portionLabel,
          totalCalories,
          // 이미 일부 움직임으로 소모한 만큼은 유지하되, 줄어든 총 칼로리보다 많이 남을 순 없게 합니다.
          remainingCalories: Math.min(s.remainingCalories, totalCalories),
          source: input.source,
        };
      }),
    }));
    setModal(null);
  }

  function deleteSnack(id: string) {
    setState((prev) => ({ ...prev, snacks: prev.snacks.filter((s) => s.id !== id) }));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  function handleConvertSelected() {
    setScreen('conditions');
  }

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
    const snackIds = Array.from(selectedIds);
    setState((prev) => {
      const snackRemainingSnapshot = Object.fromEntries(
        snackIds.map((id) => [id, prev.snacks.find((s) => s.id === id)?.remainingCalories ?? 0])
      );
      return {
        ...prev,
        snacks: prev.snacks.map((s) => (snackIds.includes(s.id) ? { ...s, exerciseStatus: 'in_progress' } : s)),
        inProgressWorkout: {
          routine,
          snackIds,
          snackRemainingSnapshot,
          elapsedSeconds: 0,
          status: 'running',
          currentStepIndex: 0,
          savedAt: new Date().toISOString(),
        },
      };
    });
    setSelectedIds(new Set());
    setScreen('workout');
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

  function nextStep() {
    setState((prev) => {
      if (!prev.inProgressWorkout) return prev;
      const max = prev.inProgressWorkout.routine.steps.length - 1;
      return {
        ...prev,
        inProgressWorkout: {
          ...prev.inProgressWorkout,
          currentStepIndex: Math.min(max, prev.inProgressWorkout.currentStepIndex + 1),
        },
      };
    });
  }

  function completeWorkout() {
    setState((prev) => {
      if (!prev.inProgressWorkout) return prev;
      const { routine, snackIds, snackRemainingSnapshot } = prev.inProgressWorkout;
      const recordId = generateId();
      setJustCompletedId(recordId);

      // 태운 칼로리(중간값)를 선택된 간식 순서대로 다 채울 때까지 나눠 차감합니다.
      // 다 태우지 못한 간식은 완료 처리하지 않고, 남은 만큼만 줄여 다시 선택할 수 있게 둡니다.
      let remainingBurn = (routine.estBurnLowKcal + routine.estBurnHighKcal) / 2;
      const snacks = prev.snacks.map((s) => {
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
        ...prev,
        snacks,
        completedWorkouts: [
          ...prev.completedWorkouts,
          {
            id: recordId,
            routineName: routine.name,
            snackIds,
            snackRemainingSnapshot,
            burnedLowKcal: routine.estBurnLowKcal,
            burnedHighKcal: routine.estBurnHighKcal,
            completedAt: new Date().toISOString(),
          },
        ],
        inProgressWorkout: null,
      };
    });
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

  const editingSnack = modal?.type === 'edit' ? state.snacks.find((s) => s.id === modal.snackId) : undefined;
  const inProgress = state.inProgressWorkout;

  if (screen === 'conditions') {
    return (
      <>
        <div className="bg-decor" aria-hidden="true" />
        <div className="bg-decor-spot" aria-hidden="true" />
        <AppHeader />
        <div className="pt-14">
          <MoveConditionForm
            totalCalories={selectedTotalCalories}
            snackCount={selectedIds.size}
            onBack={() => setScreen('tray')}
            onSubmit={handleConditionsSubmit}
          />
        </div>
      </>
    );
  }

  if (screen === 'routines') {
    return (
      <>
        <div className="bg-decor" aria-hidden="true" />
        <div className="bg-decor-spot" aria-hidden="true" />
        <AppHeader />
        <div className="pt-14">
          <RoutineSuggestions
            routines={routines}
            isLoading={isRecommendingRoutines}
            onBack={() => setScreen('tray')}
            onSelect={handleRoutineSelect}
            onRetry={handleRetryRoutines}
          />
        </div>
      </>
    );
  }

  if (screen === 'workout' && inProgress) {
    return (
      <>
        <div className="bg-decor" aria-hidden="true" />
        <div className="bg-decor-spot" aria-hidden="true" />
        <AppHeader />
        <div className="pt-14">
          <WorkoutTimer
            routine={inProgress.routine}
            elapsedSeconds={inProgress.elapsedSeconds}
            isRunning={inProgress.status === 'running'}
            currentStepIndex={inProgress.currentStepIndex}
            onPauseResume={pauseResumeWorkout}
            onNextStep={nextStep}
            onComplete={completeWorkout}
            onCancel={cancelWorkout}
          />
        </div>
      </>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-32 pt-24">
      <div className="bg-decor" aria-hidden="true" />
      <div className="bg-decor-spot" aria-hidden="true" />
      <AppHeader />
      <header className="mb-6 text-center">
        <h1 className="font-brand bg-gradient-to-r from-teal to-aqua bg-clip-text text-5xl font-extrabold tracking-tight text-transparent sm:text-6xl">
          AFTERBITE
        </h1>
        <p className="mt-2 text-xs text-navy-soft">가볍게 기록하고, 지금 할 수 있는 만큼만 움직여요</p>
      </header>

      <WaveVisualization
        currentEnergyKcal={currentEnergyKcal}
        fillPercent={fillPercent}
        snackCount={state.snacks.length}
        completedWorkoutCount={state.completedWorkouts.length}
        character={character}
        onToggleCharacter={toggleCharacter}
      />

      {inProgress && (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-lavender bg-lavender-soft px-4 py-3.5">
          <div>
            <p className="text-xs font-semibold text-navy">이어서 할 움직임이 있어요</p>
            <p className="text-sm text-navy-soft">
              {inProgress.routine.name} · {formatMmSs(inProgress.elapsedSeconds)}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={cancelWorkout}
              className="rounded-full px-3 py-1.5 text-xs font-medium text-navy-soft"
            >
              그만두기
            </button>
            <button
              type="button"
              onClick={() => setScreen('workout')}
              className="rounded-full bg-charcoal px-3.5 py-1.5 text-xs font-semibold text-ivory"
            >
              이어하기
            </button>
          </div>
        </div>
      )}

      {justCompletedId && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-teal/10 px-4 py-3">
          <p className="text-xs font-medium text-teal">움직임을 완료했어요 🌿</p>
          <div className="flex shrink-0 gap-2">
            <button type="button" onClick={undoLastCompletion} className="text-xs font-semibold text-navy underline">
              완료 취소
            </button>
            <button
              type="button"
              onClick={() => setJustCompletedId(null)}
              aria-label="닫기"
              className="text-xs text-navy-soft"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-sm font-bold text-charcoal">오늘의 간식 트레이</h2>
        <div className="flex gap-2">
          {selectableSnacks.length > 0 && (
            <button
              type="button"
              onClick={toggleSelectAll}
              className="rounded-full border border-navy/15 px-3 py-1.5 text-xs font-medium text-navy-soft"
            >
              {allSelected ? '전체 해제' : '전체 선택'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setModal({ type: 'add' })}
            className="btn-primary rounded-full px-3.5 py-1.5 text-xs font-semibold text-white"
          >
            + 간식 추가
          </button>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {state.snacks.length === 0 && (
          <p className="rounded-2xl border border-dashed border-navy/15 px-4 py-10 text-center text-sm text-navy-soft">
            아직 기록한 간식이 없어요.
            <br />
            방금 먹은 걸 가볍게 남겨보세요.
          </p>
        )}
        {state.snacks.map((snack) => (
          <SnackCard
            key={snack.id}
            snack={snack}
            selected={selectedIds.has(snack.id)}
            selectable={snack.exerciseStatus === 'none'}
            onToggleSelect={toggleSelect}
            onEdit={(id) => setModal({ type: 'edit', snackId: id })}
            onDelete={deleteSnack}
          />
        ))}
      </div>

      <SelectionBar
        selectedCount={selectedIds.size}
        totalCalories={selectedTotalCalories}
        onConvert={handleConvertSelected}
      />

      {modal?.type === 'add' && (
        <AddSnackModal mode="add" onClose={() => setModal(null)} onSave={addSnack} />
      )}
      {modal?.type === 'edit' && editingSnack && (
        <AddSnackModal
          mode="edit"
          initialSnack={editingSnack}
          onClose={() => setModal(null)}
          onSave={(input) => editSnack(editingSnack.id, input)}
        />
      )}
    </div>
  );
}
