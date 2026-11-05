import { describe, it, expect } from 'vitest';
import { validateImportPayload } from '../validation';
import { defaultFrameworks } from '../../store/defaultData';
import type { RecommendationLevel } from '../../models/types';

describe('Import & Persistence Validation', () => {
  it('accepts valid framework export payload', () => {
    const validPayload = {
      frameworks: defaultFrameworks,
      reviews: [
        {
          id: 'rev-1',
          frameworkId: 'default-framework',
          title: 'Test AI System',
          description: 'A test review',
          aiSystem: 'GPT-4',
          purpose: 'Testing',
          context: 'Lab',
          stakeholders: [],
          reviewer: 'Auditor',
          reviewDate: new Date().toISOString(),
          scores: { 'crit-privacy': 2, 'crit-human-oversight': 3 },
          notes: { 'crit-privacy': 'Adequate safeguards' },
          overallRecommendation: 'Low Risk',
          status: 'completed',
        },
      ],
      activeFrameworkId: 'default-framework',
    };

    const outcome = validateImportPayload(validPayload);
    expect(outcome.isValid).toBe(true);
    expect(outcome.error).toBeUndefined();
    expect(outcome.data?.frameworks).toHaveLength(defaultFrameworks.length);
    expect(outcome.data?.reviews).toHaveLength(1);
    expect(outcome.data?.activeFrameworkId).toBe('default-framework');
  });

  it('accepts stringified JSON format', () => {
    const jsonStr = JSON.stringify({
      frameworks: defaultFrameworks,
    });

    const outcome = validateImportPayload(jsonStr);
    expect(outcome.isValid).toBe(true);
    expect(outcome.data?.frameworks).toHaveLength(defaultFrameworks.length);
  });

  it('rejects malformed JSON strings', () => {
    const badJson = '{ frameworks: [ invalid }';
    const outcome = validateImportPayload(badJson);
    expect(outcome.isValid).toBe(false);
    expect(outcome.error).toMatch(/failed to parse/i);
  });

  it('rejects non-object payloads', () => {
    expect(validateImportPayload(null).isValid).toBe(false);
    expect(validateImportPayload(undefined).isValid).toBe(false);
    expect(validateImportPayload([]).isValid).toBe(false);
    expect(validateImportPayload(12345).isValid).toBe(false);
  });

  it('rejects payloads missing both frameworks and reviews', () => {
    const emptyObject = { unrelatedKey: 'hello' };
    const outcome = validateImportPayload(emptyObject);
    expect(outcome.isValid).toBe(false);
    expect(outcome.error).toMatch(/must contain at least "frameworks" or "reviews"/i);
  });

  it('rejects frameworks missing required fields or having invalid criteria', () => {
    const invalidFramework = {
      frameworks: [
        {
          id: 'fw-1',
          // missing name
          criteria: 'not-an-array',
        },
      ],
    };

    const outcome = validateImportPayload(invalidFramework);
    expect(outcome.isValid).toBe(false);
    expect(outcome.error).toMatch(/missing a valid "name"/i);
  });

  it('rejects criteria with negative weights or invalid scoring scales', () => {
    const badWeightPayload = {
      frameworks: [
        {
          id: 'fw-1',
          name: 'Custom',
          description: '',
          thresholds: [],
          rules: [],
          safeguards: [],
          criteria: [
            {
              id: 'c1',
              title: 'C1',
              weight: -5,
              scoringScale: { min: 0, max: 3 },
            },
          ],
        },
      ],
    };

    const outcome = validateImportPayload(badWeightPayload);
    expect(outcome.isValid).toBe(false);
    expect(outcome.error).toMatch(/non-negative weight/i);
  });

  it('rejects thresholds with unrecognized recommendation levels', () => {
    const badThresholdPayload = {
      frameworks: [
        {
          id: 'fw-1',
          name: 'Custom',
          description: '',
          criteria: [],
          rules: [],
          safeguards: [],
          thresholds: [
            {
              id: 't1',
              minScore: 0,
              maxScore: 50,
              recommendation: 'Extreme Danger' as unknown as RecommendationLevel,
            },
          ],
        },
      ],
    };

    const outcome = validateImportPayload(badThresholdPayload);
    expect(outcome.isValid).toBe(false);
    expect(outcome.error).toMatch(/unrecognized recommendation level/i);
  });

  it('rejects reviews with non-numeric scores', () => {
    const badReviewPayload = {
      reviews: [
        {
          id: 'r1',
          frameworkId: 'default-framework',
          title: 'Review 1',
          notes: {},
          scores: {
            'crit-1': 'high' as unknown as number, // should be a number
          },
        },
      ],
    };

    const outcome = validateImportPayload(badReviewPayload);
    expect(outcome.isValid).toBe(false);
    expect(outcome.error).toMatch(/must be a number/i);
  });
});
