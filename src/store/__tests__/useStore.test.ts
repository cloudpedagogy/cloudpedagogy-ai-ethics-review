import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from '../useStore';
import type { Review } from '../../models/types';
import { defaultFrameworks } from '../defaultData';

describe('useStore State Management & Persistence', () => {
  beforeEach(() => {
    useStore.getState().resetToDefaults();
  });

  it('initializes with default frameworks and active framework id', () => {
    const state = useStore.getState();
    expect(state.frameworks).toHaveLength(defaultFrameworks.length);
    expect(state.activeFrameworkId).toBe(defaultFrameworks[0].id);
    expect(state.reviews).toHaveLength(0);
  });

  it('adds, updates, and deletes reviews without affecting framework state', () => {
    const newReview: Review = {
      id: 'rev-test-1',
      frameworkId: defaultFrameworks[0].id,
      title: 'Grading AI Review',
      description: 'Test evaluation',
      aiSystem: 'AutoGrader v1',
      purpose: 'Grading',
      context: 'Higher Ed',
      stakeholders: ['Students', 'Instructors'],
      reviewer: 'Ethics Committee',
      reviewDate: '2026-03-01T00:00:00.000Z',
      scores: { 'crit-privacy': 2, 'crit-human-oversight': 3 },
      notes: { 'crit-privacy': 'Enforced role checks' },
      overallRecommendation: 'Low Risk',
      status: 'completed',
    };

    useStore.getState().addReview(newReview);
    expect(useStore.getState().reviews).toHaveLength(1);
    expect(useStore.getState().reviews[0].title).toBe('Grading AI Review');

    // Update
    useStore.getState().updateReview('rev-test-1', { title: 'Updated Title' });
    expect(useStore.getState().reviews[0].title).toBe('Updated Title');

    // Delete
    useStore.getState().deleteReview('rev-test-1');
    expect(useStore.getState().reviews).toHaveLength(0);
  });

  it('duplicates review with a new UUID and distinct copy title', () => {
    const originalReview: Review = {
      id: 'rev-orig',
      frameworkId: defaultFrameworks[0].id,
      title: 'Original Review',
      description: '',
      aiSystem: '',
      purpose: '',
      context: '',
      stakeholders: [],
      reviewer: '',
      reviewDate: '2026-01-01T00:00:00.000Z',
      scores: { 'crit-privacy': 3 },
      notes: {},
      status: 'completed',
    };

    useStore.getState().addReview(originalReview);
    useStore.getState().duplicateReview('rev-orig');

    const reviews = useStore.getState().reviews;
    expect(reviews).toHaveLength(2);
    const copy = reviews.find((r) => r.id !== 'rev-orig');
    expect(copy).toBeDefined();
    expect(copy?.title).toBe('Original Review (Copy)');
    expect(copy?.scores).toEqual(originalReview.scores);
  });

  it('safely imports valid data and maintains consistent activeFrameworkId', () => {
    const customFramework = {
      ...defaultFrameworks[0],
      id: 'custom-framework-999',
      name: 'Custom High-Stakes Framework',
      isDefault: false,
    };

    useStore.getState().importData({
      frameworks: [customFramework],
      activeFrameworkId: 'custom-framework-999',
    });

    const state = useStore.getState();
    expect(state.frameworks).toHaveLength(1);
    expect(state.frameworks[0].id).toBe('custom-framework-999');
    expect(state.activeFrameworkId).toBe('custom-framework-999');
  });

  it('resets invalid activeFrameworkId to the first available framework upon import', () => {
    const customFramework = {
      ...defaultFrameworks[0],
      id: 'custom-framework-1',
      name: 'Custom Framework 1',
    };

    useStore.getState().importData({
      frameworks: [customFramework],
      activeFrameworkId: 'non-existent-id',
    });

    expect(useStore.getState().activeFrameworkId).toBe('custom-framework-1');
  });
});
