import { describe, it, expect } from 'vitest';
import {
  calculateScoreExplanation,
  calculatePercentage,
  evaluateThresholds,
  evaluateConditionalRules,
  escalateRecommendation,
  validateReviewCompletion,
  evaluateAssessment,
} from '../assessmentEngine';
import type { Criterion, Threshold, Rule } from '../../models/types';
import { defaultFrameworks } from '../../store/defaultData';

describe('Assessment Calculation Engine', () => {
  const defaultFramework = defaultFrameworks[0];

  describe('calculateScoreExplanation & calculatePercentage', () => {
    it('correctly calculates weighted scores and percentage', () => {
      // Human Oversight (wt 5, max 3), Privacy (wt 5, max 3), Transparency (wt 4, max 3)
      const criteria: Criterion[] = [
        {
          id: 'crit-1',
          title: 'Human Oversight',
          description: '',
          weight: 5,
          scoringScale: { type: 'numeric', min: 0, max: 3 },
          guidanceNotes: '',
          displayOrder: 1,
        },
        {
          id: 'crit-2',
          title: 'Privacy',
          description: '',
          weight: 3,
          scoringScale: { type: 'numeric', min: 0, max: 3 },
          guidanceNotes: '',
          displayOrder: 2,
        },
      ];

      const scores = { 'crit-1': 2, 'crit-2': 3 };
      const explanation = calculateScoreExplanation(criteria, scores);

      // crit-1: 2 * 5 = 10; crit-2: 3 * 3 = 9 => total = 19
      // maxPossible: (3 * 5) + (3 * 3) = 15 + 9 = 24
      expect(explanation.totalScore).toBe(19);
      expect(explanation.maxPossibleScore).toBe(24);
      expect(explanation.criterionContributions).toHaveLength(2);
      expect(explanation.criterionContributions[0]).toEqual({
        criterionId: 'crit-1',
        score: 2,
        weight: 5,
        contribution: 10,
      });

      const percentage = calculatePercentage(explanation.totalScore, explanation.maxPossibleScore);
      expect(percentage).toBeCloseTo((19 / 24) * 100, 4);
    });

    it('handles zero total score and empty criteria safely', () => {
      expect(calculatePercentage(0, 100)).toBe(0);
      expect(calculatePercentage(0, 0)).toBe(0);
      expect(calculatePercentage(50, 0)).toBe(0);
    });
  });

  describe('Score-Zero Handling', () => {
    it('distinguishes score 0 from an unanswered criterion', () => {
      const criteria: Criterion[] = [
        {
          id: 'c1',
          title: 'Ethics',
          description: '',
          weight: 2,
          scoringScale: { type: 'numeric', min: 0, max: 3 },
          guidanceNotes: '',
          displayOrder: 1,
        },
      ];

      // Score 0 is valid and answered
      const validZeroScores = { c1: 0 };
      const validationZero = validateReviewCompletion({ criteria }, validZeroScores);
      expect(validationZero.isValid).toBe(true);
      expect(validationZero.missingCriterionIds).toHaveLength(0);

      // Unanswered (undefined or null) is invalid
      const missingScores = {};
      const validationMissing = validateReviewCompletion({ criteria }, missingScores);
      expect(validationMissing.isValid).toBe(false);
      expect(validationMissing.missingCriterionIds).toContain('c1');

      const nullScores = { c1: null as unknown as number };
      const validationNull = validateReviewCompletion({ criteria }, nullScores);
      expect(validationNull.isValid).toBe(false);
      expect(validationNull.missingCriterionIds).toContain('c1');
    });

    it('includes score 0 in total points calculation without treating it as unassigned', () => {
      const criteria: Criterion[] = [
        {
          id: 'c1',
          title: 'Crit 1',
          description: '',
          weight: 5,
          scoringScale: { type: 'numeric', min: 0, max: 3 },
          guidanceNotes: '',
          displayOrder: 1,
        },
        {
          id: 'c2',
          title: 'Crit 2',
          description: '',
          weight: 5,
          scoringScale: { type: 'numeric', min: 0, max: 3 },
          guidanceNotes: '',
          displayOrder: 2,
        },
      ];

      const scores = { c1: 0, c2: 3 };
      const result = calculateScoreExplanation(criteria, scores);
      // c1: 0 * 5 = 0; c2: 3 * 5 = 15; total = 15; max = 30
      expect(result.totalScore).toBe(15);
      expect(result.maxPossibleScore).toBe(30);
      expect(calculatePercentage(result.totalScore, result.maxPossibleScore)).toBe(50);
    });

    it('rejects out-of-scale scores as invalid', () => {
      const criteria: Criterion[] = [
        {
          id: 'c1',
          title: 'Crit 1',
          description: '',
          weight: 1,
          scoringScale: { type: 'numeric', min: 0, max: 3 },
          guidanceNotes: '',
          displayOrder: 1,
        },
      ];

      const negativeScore = { c1: -1 };
      const valNegative = validateReviewCompletion({ criteria }, negativeScore);
      expect(valNegative.isValid).toBe(false);
      expect(valNegative.invalidCriterionIds).toContain('c1');

      const exceededScore = { c1: 4 };
      const valExceeded = validateReviewCompletion({ criteria }, exceededScore);
      expect(valExceeded.isValid).toBe(false);
      expect(valExceeded.invalidCriterionIds).toContain('c1');
    });
  });

  describe('Incomplete Assessment Handling', () => {
    it('refuses to produce overall recommendations for incomplete assessments', () => {
      const scores = {
        'crit-human-oversight': 2,
        // other 5 criteria omitted
      };

      const result = evaluateAssessment(defaultFramework, scores);
      expect(result.isComplete).toBe(false);
      expect(result.missingCriterionIds.length).toBeGreaterThan(0);
      expect(result.overallRecommendation).toBeNull();
      expect(result.scoreExplanation).toBeNull();
      expect(result.percentage).toBeNull();
      expect(result.triggeredRules).toHaveLength(0);
    });

    it('ensures unanswered criteria never trigger conditional red-flag rules', () => {
      // The default framework rule triggers if crit-privacy < 2.
      // If crit-privacy is unanswered (undefined), rule must NOT trigger.
      const scoresWithUnansweredPrivacy = {
        'crit-human-oversight': 3,
        // 'crit-privacy' is missing
      };

      const triggered = evaluateConditionalRules(
        defaultFramework.rules,
        scoresWithUnansweredPrivacy,
        defaultFramework.criteria
      );

      expect(triggered).toHaveLength(0);
    });
  });

  describe('Threshold Evaluation & Boundary Testing', () => {
    const thresholds: Threshold[] = [
      { id: 't1', minScore: 0, maxScore: 25, recommendation: 'Critical Risk' },
      { id: 't2', minScore: 26, maxScore: 50, recommendation: 'High Risk' },
      { id: 't3', minScore: 51, maxScore: 75, recommendation: 'Moderate Risk' },
      { id: 't4', minScore: 76, maxScore: 100, recommendation: 'Low Risk' },
    ];

    it('evaluates exact boundary points correctly', () => {
      expect(evaluateThresholds(thresholds, 0)).toBe('Critical Risk');
      expect(evaluateThresholds(thresholds, 25)).toBe('Critical Risk');
      expect(evaluateThresholds(thresholds, 26)).toBe('High Risk');
      expect(evaluateThresholds(thresholds, 50)).toBe('High Risk');
      expect(evaluateThresholds(thresholds, 51)).toBe('Moderate Risk');
      expect(evaluateThresholds(thresholds, 75)).toBe('Moderate Risk');
      expect(evaluateThresholds(thresholds, 76)).toBe('Low Risk');
      expect(evaluateThresholds(thresholds, 100)).toBe('Low Risk');
    });

    it('resolves fractional percentage gaps using the deterministic midpoint convention', () => {
      // Gap between 25 and 26: midpoint is 25.5
      expect(evaluateThresholds(thresholds, 25.4)).toBe('Critical Risk');
      expect(evaluateThresholds(thresholds, 25.5)).toBe('High Risk');

      // Gap between 50 and 51: midpoint is 50.5
      expect(evaluateThresholds(thresholds, 50.49)).toBe('High Risk');
      expect(evaluateThresholds(thresholds, 50.5)).toBe('Moderate Risk');

      // Gap between 75 and 76: midpoint is 75.5
      expect(evaluateThresholds(thresholds, 75.4)).toBe('Moderate Risk');
      expect(evaluateThresholds(thresholds, 75.5)).toBe('Low Risk');
    });

    it('clamps percentages below 0 and above 100 to the outermost risk bands', () => {
      expect(evaluateThresholds(thresholds, -5)).toBe('Critical Risk');
      expect(evaluateThresholds(thresholds, 102.5)).toBe('Low Risk');
    });

    it('supports custom frameworks with contiguous touching intervals', () => {
      const touchingThresholds: Threshold[] = [
        { id: 'ct1', minScore: 0, maxScore: 25, recommendation: 'Critical Risk' },
        { id: 'ct2', minScore: 25, maxScore: 50, recommendation: 'High Risk' },
        { id: 'ct3', minScore: 50, maxScore: 75, recommendation: 'Moderate Risk' },
        { id: 'ct4', minScore: 75, maxScore: 100, recommendation: 'Low Risk' },
      ];

      expect(evaluateThresholds(touchingThresholds, 12.5)).toBe('Critical Risk');
      expect(evaluateThresholds(touchingThresholds, 25)).toBe('Critical Risk');
      expect(evaluateThresholds(touchingThresholds, 25.1)).toBe('High Risk');
      expect(evaluateThresholds(touchingThresholds, 75)).toBe('Moderate Risk');
      expect(evaluateThresholds(touchingThresholds, 75.1)).toBe('Low Risk');
    });

    it('throws when thresholds array is empty rather than silently returning Moderate Risk', () => {
      expect(() => evaluateThresholds([], 50)).toThrow(/no thresholds configured/i);
    });
  });

  describe('Non-Mutating State Invariance', () => {
    it('does not mutate framework, criteria, or threshold arrays', () => {
      // Clone original thresholds array order
      const originalThresholdIds = defaultFramework.thresholds.map((t) => t.id);
      const thresholdsCopy = JSON.parse(JSON.stringify(defaultFramework.thresholds));

      evaluateThresholds(defaultFramework.thresholds, 30);

      const currentThresholdIds = defaultFramework.thresholds.map((t) => t.id);
      expect(currentThresholdIds).toEqual(originalThresholdIds);
      expect(defaultFramework.thresholds).toEqual(thresholdsCopy);
    });
  });

  describe('Conditional Rule Evaluation & Escalation', () => {
    it('evaluates rules with custom UUID-based criterion identifiers', () => {
      const customCriterionId = 'd8924f3e-5f99-4a4b-b27b-99f8d9737119';
      const criteria: Criterion[] = [
        {
          id: customCriterionId,
          title: 'Algorithmic Fairness',
          description: '',
          weight: 4,
          scoringScale: { type: 'numeric', min: 0, max: 3 },
          guidanceNotes: '',
          displayOrder: 1,
        },
      ];

      const rules: Rule[] = [
        {
          id: 'rule-custom-bias',
          description: 'Custom bias violation',
          outcomeLevel: 'Critical Risk',
          conditionGroup: {
            id: 'cg-1',
            logic: 'AND',
            conditions: [
              {
                id: 'c-1',
                field: customCriterionId,
                operator: 'lessThan',
                value: 2,
              },
            ],
          },
        },
      ];

      // Custom criterion score 1 < 2 should trigger rule
      const scoresTriggered = { [customCriterionId]: 1 };
      const triggered = evaluateConditionalRules(rules, scoresTriggered, criteria);
      expect(triggered).toHaveLength(1);
      expect(triggered[0].id).toBe('rule-custom-bias');

      // Score 2 should not trigger
      const scoresPass = { [customCriterionId]: 2 };
      expect(evaluateConditionalRules(rules, scoresPass, criteria)).toHaveLength(0);
    });

    it('escalates to the most severe outcome when multiple rules trigger', () => {
      const rules: Rule[] = [
        {
          id: 'r1',
          description: '',
          outcomeLevel: 'Moderate Risk',
          conditionGroup: { id: '', logic: 'AND', conditions: [] },
        },
        {
          id: 'r2',
          description: '',
          outcomeLevel: 'Critical Risk',
          conditionGroup: { id: '', logic: 'AND', conditions: [] },
        },
        {
          id: 'r3',
          description: '',
          outcomeLevel: 'High Risk',
          conditionGroup: { id: '', logic: 'AND', conditions: [] },
        },
      ];

      const escalated = escalateRecommendation('Low Risk', rules);
      expect(escalated).toBe('Critical Risk');
    });

    it('does not downgrade risk if baseline is more severe than triggered rules', () => {
      const rules: Rule[] = [
        {
          id: 'r1',
          description: '',
          outcomeLevel: 'Moderate Risk',
          conditionGroup: { id: '', logic: 'AND', conditions: [] },
        },
      ];

      const result = escalateRecommendation('Critical Risk', rules);
      expect(result).toBe('Critical Risk');
    });
  });

  describe('Full Assessment Pipeline', () => {
    it('computes complete review and applies red-flag escalation correctly', () => {
      // Provide valid scores for all 6 default criteria
      // Privacy is given 0 (< 2), triggering the Critical Risk red-flag rule
      // Even though overall score percentage is high, Privacy rule escalates to Critical Risk.
      const scores = {
        'crit-human-oversight': 3,
        'crit-privacy': 0, // Triggers Critical Risk
        'crit-transparency': 3,
        'crit-equity-fairness': 3,
        'crit-accessibility': 3,
        'crit-accountability': 3,
      };

      const result = evaluateAssessment(defaultFramework, scores);

      expect(result.isComplete).toBe(true);
      expect(result.scoreExplanation).not.toBeNull();
      // Total max is 26 * 3 = 78 pts. Score without privacy: 21 * 3 = 63 pts.
      // 63/78 * 100 = 80.76% (Baseline would be Low Risk > 76%)
      expect(result.percentage).toBeCloseTo(80.769, 2);
      expect(result.baselineRecommendation).toBe('Low Risk');
      expect(result.triggeredRules).toHaveLength(1);
      expect(result.triggeredRules[0].id).toBe('rule-critical-privacy');
      expect(result.overallRecommendation).toBe('Critical Risk');
    });
  });
});
