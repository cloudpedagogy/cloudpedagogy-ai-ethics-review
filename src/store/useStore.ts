import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Framework, Review } from '../models/types';
import { defaultFrameworks } from './defaultData';

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
        set((state) => ({
          frameworks: data.frameworks || state.frameworks,
          reviews: data.reviews || state.reviews,
          activeFrameworkId: data.activeFrameworkId || state.activeFrameworkId,
        })),
    }),
    {
      name: 'ethics-review-storage',
    }
  )
);
