import { useState, type Dispatch, type SetStateAction } from 'react';
import { generateId } from '../lib/id';
import type { SnackFormInput } from '../components/AddSnackModal';
import type { AppState, Snack } from '../types';

/** 간식 트레이의 CRUD와, 움직임으로 바꿀 간식을 고르는 선택 상태를 함께 관리합니다. */
export function useSnackTray(setState: Dispatch<SetStateAction<AppState>>, snacks: Snack[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectableSnacks = snacks.filter((s) => s.exerciseStatus === 'none');
  const allSelected = selectableSnacks.length > 0 && selectableSnacks.every((s) => selectedIds.has(s.id));
  const selectedTotalCalories = snacks
    .filter((s) => selectedIds.has(s.id))
    .reduce((sum, s) => sum + s.remainingCalories, 0);

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
  }

  function deleteSnack(id: string) {
    setState((prev) => ({ ...prev, snacks: prev.snacks.filter((s) => s.id !== id) }));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

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

  function clearSelection() {
    setSelectedIds(new Set());
  }

  return {
    selectedIds,
    selectableSnacks,
    allSelected,
    selectedTotalCalories,
    addSnack,
    editSnack,
    deleteSnack,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
  };
}
