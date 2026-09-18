import { useEffect, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { WaveVisualization, type RunnerCharacter } from './components/WaveVisualization';
import { SnackCard } from './components/SnackCard';
import { SelectionBar } from './components/SelectionBar';
import { AddSnackModal } from './components/AddSnackModal';
import { MoveConditionForm } from './components/MoveConditionForm';
import { RoutineSuggestions } from './components/RoutineSuggestions';
import { WorkoutTimer } from './components/WorkoutTimer';
import { loadState, saveState } from './lib/storage';
import { useEnergyGauge } from './hooks/useEnergyGauge';
import { useSnackTray } from './hooks/useSnackTray';
import { useWorkoutFlow } from './hooks/useWorkoutFlow';
import type { AppState, Screen } from './types';

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
  const [character, setCharacter] = useState<RunnerCharacter>(
    () => (localStorage.getItem('afterbite_character') as RunnerCharacter) || 'male'
  );

  useEffect(() => {
    saveState(state);
  }, [state]);

  function toggleCharacter() {
    setCharacter((prev) => {
      const next = prev === 'male' ? 'female' : 'male';
      localStorage.setItem('afterbite_character', next);
      return next;
    });
  }

  const { currentEnergyKcal, fillPercent } = useEnergyGauge(state.snacks, state.completedWorkouts);

  const tray = useSnackTray(setState, state.snacks);

  const workout = useWorkoutFlow({
    state,
    setState,
    screen,
    setScreen,
    selectedIds: tray.selectedIds,
    selectedTotalCalories: tray.selectedTotalCalories,
    clearSelection: tray.clearSelection,
  });

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
            totalCalories={tray.selectedTotalCalories}
            snackCount={tray.selectedIds.size}
            onBack={() => setScreen('tray')}
            onSubmit={workout.handleConditionsSubmit}
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
            routines={workout.routines}
            isLoading={workout.isRecommendingRoutines}
            inProgressWorkout={inProgress}
            onResumeInProgress={() => setScreen('workout')}
            onBack={() => setScreen('tray')}
            onSelect={workout.handleRoutineSelect}
            onCompleteWithoutTimer={workout.completeRoutineWithoutTimer}
            onRetry={workout.handleRetryRoutines}
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
            onPauseResume={workout.pauseResumeWorkout}
            onBrowseRoutines={workout.pauseAndBrowseRoutines}
            onNextStep={workout.nextStep}
            onComplete={workout.completeWorkout}
            onCancel={workout.cancelWorkout}
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
            <p className="text-xs font-semibold text-navy">
              {inProgress.status === 'running' ? '진행 중인 움직임이 있어요' : '일시정지된 움직임이 있어요'}
            </p>
            <p className="text-sm text-navy-soft">
              {inProgress.routine.name} · {formatMmSs(inProgress.elapsedSeconds)}
            </p>
          </div>
          <div className="flex shrink-0 gap-1.5">
            {workout.routines.length > 0 && (
              <button
                type="button"
                onClick={() => setScreen('routines')}
                className="rounded-full border border-navy/15 bg-ivory-card px-2.5 py-1.5 text-xs font-medium text-navy-soft active:scale-95"
              >
                루틴 목록
              </button>
            )}
            <button
              type="button"
              onClick={workout.cancelWorkout}
              className="rounded-full px-2.5 py-1.5 text-xs font-medium text-navy-soft active:scale-95"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => setScreen('workout')}
              className="rounded-full bg-charcoal px-3 py-1.5 text-xs font-semibold text-ivory active:scale-95"
            >
              이어하기
            </button>
          </div>
        </div>
      )}

      {workout.justCompletedId && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-teal/10 px-4 py-3">
          <p className="text-xs font-medium text-teal">움직임을 완료했어요 🌿</p>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={workout.undoLastCompletion}
              className="text-xs font-semibold text-navy underline"
            >
              완료 취소
            </button>
            <button
              type="button"
              onClick={() => workout.setJustCompletedId(null)}
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
          {tray.selectableSnacks.length > 0 && (
            <button
              type="button"
              onClick={tray.toggleSelectAll}
              className="rounded-full border border-navy/15 px-3 py-1.5 text-xs font-medium text-navy-soft"
            >
              {tray.allSelected ? '전체 해제' : '전체 선택'}
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
            selected={tray.selectedIds.has(snack.id)}
            selectable={snack.remainingCalories > 0}
            onToggleSelect={tray.toggleSelect}
            onEdit={(id) => setModal({ type: 'edit', snackId: id })}
            onDelete={tray.deleteSnack}
          />
        ))}
      </div>

      <SelectionBar
        selectedCount={tray.selectedIds.size}
        totalCalories={tray.selectedTotalCalories}
        onConvert={() => setScreen('conditions')}
      />

      {modal?.type === 'add' && (
        <AddSnackModal
          mode="add"
          onClose={() => setModal(null)}
          onSave={(input) => {
            tray.addSnack(input);
            setModal(null);
          }}
        />
      )}
      {modal?.type === 'edit' && editingSnack && (
        <AddSnackModal
          mode="edit"
          initialSnack={editingSnack}
          onClose={() => setModal(null)}
          onSave={(input) => {
            tray.editSnack(editingSnack.id, input);
            setModal(null);
          }}
        />
      )}
    </div>
  );
}
