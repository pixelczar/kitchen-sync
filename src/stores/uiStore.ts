import { create } from 'zustand';
import type { Celebration } from '../types';

interface UIStore {
  // Local optimistic updates - track intended completion state
  optimisticTaskStates: Map<string, boolean>;
  celebrationQueue: Celebration[];
  
  // UI-only state
  isBlurred: boolean;
  activeModal: string | null;
  activeView: 'dashboard' | 'calendar' | 'profile' | 'settings';
  isModalOpen: boolean;
  
  // Transitions
  transitionDirection: 'left' | 'right' | 'up' | 'down';
  
  // Actions
  setOptimisticTaskState: (taskId: string, completed: boolean) => void;
  clearOptimisticTaskState: (taskId: string) => void;
  queueCelebration: (celebration: Celebration) => void;
  clearCelebration: () => void;
  navigateTo: (view: UIStore['activeView'], direction: UIStore['transitionDirection']) => void;
  setBlurred: (isBlurred: boolean) => void;
  setActiveModal: (modal: string | null) => void;
  setModalOpen: (isOpen: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  // Initial state
  optimisticTaskStates: new Map(),
  celebrationQueue: [],
  isBlurred: false,
  activeModal: null,
  activeView: 'dashboard',
  transitionDirection: 'left',
  isModalOpen: false,
  
  // Actions
  setOptimisticTaskState: (taskId: string, completed: boolean) =>
    set((state) => {
      const newMap = new Map(state.optimisticTaskStates);
      newMap.set(taskId, completed);
      return { optimisticTaskStates: newMap };
    }),
  
  clearOptimisticTaskState: (taskId: string) =>
    set((state) => {
      const newMap = new Map(state.optimisticTaskStates);
      newMap.delete(taskId);
      return { optimisticTaskStates: newMap };
    }),
  
  queueCelebration: (celebration: Celebration) =>
    set((state) => ({
      celebrationQueue: [...state.celebrationQueue, celebration],
    })),
  
  clearCelebration: () =>
    set((state) => ({
      celebrationQueue: state.celebrationQueue.slice(1),
    })),
  
  navigateTo: (view, direction) =>
    set({
      activeView: view,
      transitionDirection: direction,
    }),
  
  setBlurred: (isBlurred: boolean) =>
    set({ isBlurred }),
  
  setActiveModal: (modal: string | null) =>
    set({ activeModal: modal }),
  
  setModalOpen: (isOpen: boolean) =>
    set({ isModalOpen: isOpen }),
}));

