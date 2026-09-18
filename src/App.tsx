import { useEffect, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { BackgroundSparkles } from './components/BackgroundSparkles';
import { WaveVisualization } from './components/WaveVisualization';
import { BalanceScale } from './components/BalanceScale';
import { SnackCard } from './components/SnackCard';
import { SelectionBar } from './components/SelectionBar';
import { AddSnackModal } from './components/AddSnackModal';
import { MoveConditionForm } from './components/MoveConditionForm';
import { RoutineSuggestions } from './components/RoutineSuggestions';
import { WorkoutTimer } from './components/WorkoutTimer';
import { CompletedWorkoutsModal } from './components/CompletedWorkoutsModal';
import { loadState, saveState, clearState } from './lib/storage';
import { useEnergyGauge } from './hooks/useEnergyGauge';
import { useSnackTray } from './hooks/useSnackTray';
import { useWorkoutFlow } from './hooks/useWorkoutFlow';
import type { AppState, Screen } from './types';

type ModalState =
  | { type: 'add' }
  | { type: 'edit'; snackId: string }
  | { type: 'completedWorkouts' }
  | null;

function formatMmSs(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [screen, setScreen] = useState<Screen>('tray');
  const [modal, setModal] = useState<ModalState>(null);

  useEffect(() => {
    saveState(state);
  }, [state]);

  // 헤더 로고를 누르면 어느 화면에 있든 홈으로 돌아가 메인 캐릭터가 있는 위치로 스크롤합니다.
  function goHome() {
    setScreen('tray');
    requestAnimationFrame(() => {
      document.getElementById('hero')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // 도움말 안의 "전체 초기화" — 저장된 간식/운동 기록을 전부 지우고 홈으로 돌아갑니다.
  function resetAll() {
    setState(clearState());
    setModal(null);
    setScreen('tray');
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
        <BackgroundSparkles />
        <AppHeader onLogoClick={goHome} onResetAll={resetAll} />
        <div className="pt-14 lg:pt-16">
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
        <BackgroundSparkles />
        <AppHeader onLogoClick={goHome} onResetAll={resetAll} />
        <div className="pt-14 lg:pt-16">
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
        <BackgroundSparkles />
        <AppHeader onLogoClick={goHome} onResetAll={resetAll} />
        <div className="pt-14 lg:pt-16">
          <WorkoutTimer
            routine={inProgress.routine}
            elapsedSeconds={inProgress.elapsedSeconds}
            isRunning={inProgress.status === 'running'}
            onPauseResume={workout.pauseResumeWorkout}
            onBrowseRoutines={workout.pauseAndBrowseRoutines}
            onComplete={workout.completeWorkout}
            onCancel={workout.cancelWorkout}
          />
        </div>
      </>
    );
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-32 pt-24 sm:max-w-xl lg:max-w-4xl lg:pt-20 xl:max-w-5xl 2xl:max-w-6xl">
      <div className="bg-decor" aria-hidden="true" />
      <div className="bg-decor-spot" aria-hidden="true" />
      <BackgroundSparkles />
      <AppHeader onLogoClick={goHome} onResetAll={resetAll} />

      {/* 좁은 화면(폰)에서는 그냥 위→아래(타이틀→캐릭터→균형막대→트레이) 문서 순서 그대로
          쌓이고, 넓은 화면(lg+)에서만 home-grid가 4개 영역(title/gauge/char/tray)으로 재배치합니다.
          균형막대는 폭 제한 없이 전체 너비를 쓰도록 캐릭터 열 밖으로 뺐고, 캐릭터는 왼쪽에
          고정(sticky)해서 오른쪽 트레이를 스크롤해도 계속 보이게 했습니다. */}
      <div className="home-grid">
        <header className="home-grid-title mb-2 text-center lg:mb-0">
          <p className="text-xs font-bold uppercase tracking-[2px] text-navy-soft sm:text-sm lg:text-base">
            오늘의 밸런스
          </p>
          <h1 className="font-brand mt-1 bg-gradient-to-r from-teal to-aqua bg-clip-text text-6xl tracking-tight text-transparent drop-shadow-[0_6px_18px_rgba(255,122,89,0.4)] sm:text-7xl lg:text-8xl">
            AFTERBITE
          </h1>
          <p className="mx-auto mt-2 max-w-xs text-xs leading-relaxed text-navy-soft sm:text-sm lg:max-w-sm lg:text-base">
            죄책감은 내려놓고, 가볍게 기록하고 비워내요.
            <br />
            0%가 되면 완전 건강한 상태예요! 🌱
          </p>
        </header>

        <div className="home-grid-char">
          <WaveVisualization
            currentEnergyKcal={currentEnergyKcal}
            fillPercent={fillPercent}
            snackCount={state.snacks.length}
            completedWorkoutCount={state.completedWorkouts.length}
            onCompletedWorkoutsClick={() => setModal({ type: 'completedWorkouts' })}
          />
        </div>

        <div className="home-grid-gauge">
          <BalanceScale percent={fillPercent} />
        </div>

        <div className="home-grid-tray mt-8 lg:mt-0">
          {inProgress && (
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-lavender bg-lavender-soft px-4 py-3.5 lg:px-5 lg:py-4">
              <div>
                <p className="text-xs font-semibold text-navy lg:text-sm">
                  {inProgress.status === 'running' ? '진행 중인 움직임이 있어요' : '일시정지된 움직임이 있어요'}
                </p>
                <p className="text-sm text-navy-soft lg:text-base">
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
            <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-teal/10 px-4 py-3 lg:px-5 lg:py-3.5">
              <p className="text-xs font-medium text-teal lg:text-sm">움직임을 완료했어요 🌿</p>
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

          <div className={`flex items-center justify-between ${inProgress || workout.justCompletedId ? 'mt-6' : ''}`}>
            <h2 className="text-sm font-bold text-charcoal lg:text-base">나의 간식 트레이</h2>
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
        </div>
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
      {modal?.type === 'completedWorkouts' && (
        <CompletedWorkoutsModal
          workouts={state.completedWorkouts}
          onDelete={workout.deleteCompletedWorkout}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
