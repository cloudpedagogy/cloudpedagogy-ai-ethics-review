import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppState, Framework, Review } from '../models/types';
import { defaultFrameworks } from './defaultData';

const safeBrowserStorage = {
  getItem: (name: string): string | null => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem(name);
      }
    } catch {
      // Storage disabled or blocked
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(name, value);
      }
    } catch {
      // Storage quota exceeded or blocked
    }
  },
  removeItem: (name: string): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(name);
      }
    } catch {
      // Storage unavailable
    }
  },
};

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      frameworks: defaultFrameworks,
      activeFrameworkId: defaultFrameworks[0].id,
      reviews: [],

      setActiveFrameworkId: (id) => set({ activeFrameworkId: id }),

      addFramework: (framework) =>
        set((state) => ({ frameworks: [...state.frameworks, framework] })),

      updateFramework: (id, updates) =>
        set((state) => ({
          frameworks: state.frameworks.map((fw) =>
            fw.id === id ? { ...fw, ...updates } : fw
          ),
        })),

      deleteFramework: (id) =>
        set((state) => ({
          frameworks: state.frameworks.filter((fw) => fw.id !== id),
          activeFrameworkId:
            state.activeFrameworkId === id
              ? state.frameworks.find((fw) => fw.id !== id)?.id || ''
              : state.activeFrameworkId,
        })),

      duplicateFramework: (id, newName) =>
        set((state) => {
          const fwToDuplicate = state.frameworks.find((fw) => fw.id === id);
          if (!fwToDuplicate) return state;
          
          const duplicated: Framework = {
            ...fwToDuplicate,
            id: crypto.randomUUID(),
            name: newName,
            isDefault: false,
          };
          return { frameworks: [...state.frameworks, duplicated] };
        }),

      addReview: (review) =>
        set((state) => ({ reviews: [...state.reviews, review] })),

      updateReview: (id, updates) =>
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      deleteReview: (id) =>
        set((state) => ({
          reviews: state.reviews.filter((r) => r.id !== id),
        })),

      duplicateReview: (id) =>
        set((state) => {
          const revToDuplicate = state.reviews.find((r) => r.id === id);
          if (!revToDuplicate) return state;
          
          const duplicated: Review = {
            ...revToDuplicate,
            id: crypto.randomUUID(),
            title: `${revToDuplicate.title} (Copy)`,
            reviewDate: new Date().toISOString(),
            status: 'draft',
            isRevisionOf: revToDuplicate.id,
          };
          return { reviews: [...state.reviews, duplicated] };
        }),

      resetToDefaults: () =>
        set({
          frameworks: defaultFrameworks,
          activeFrameworkId: defaultFrameworks[0].id,
          reviews: [],
        }),

      importData: (data) =>
        set((state) => {
          const nextFrameworks = data.frameworks || state.frameworks;
          let nextActiveId = data.activeFrameworkId || state.activeFrameworkId;
          if (!nextFrameworks.some((fw) => fw.id === nextActiveId)) {
            nextActiveId = nextFrameworks[0]?.id || '';
          }
          return {
            frameworks: nextFrameworks,
            reviews: data.reviews || state.reviews,
            activeFrameworkId: nextActiveId,
          };
        }),
    }),
    {
      name: 'ethics-review-storage',
      storage: createJSONStorage(() => safeBrowserStorage),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.warn('Failed to rehydrate ethics-review-storage from storage, recovering defaults:', error);
        }
        if (state) {
          if (!Array.isArray(state.frameworks) || state.frameworks.length === 0) {
            state.frameworks = defaultFrameworks;
          }
          if (!state.activeFrameworkId || !state.frameworks.some((f) => f.id === state.activeFrameworkId)) {
            state.activeFrameworkId = state.frameworks[0]?.id || '';
          }
          if (!Array.isArray(state.reviews)) {
            state.reviews = [];
          }
        }
      },
    }
  )
);
