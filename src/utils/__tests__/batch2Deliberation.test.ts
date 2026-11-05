import { describe, it, expect } from 'vitest';
import {
  validateThresholdConfiguration,
  findDependentRules,
  evaluateAssessment,
} from '../assessmentEngine';
import type {
  Threshold,
  Rule,
  Review,
  StakeholderImpact,
  EvidenceItem,
  HumanDecision,
  EthicalReflections,
} from '../../models/types';
import { defaultFrameworks } from '../../store/defaultData';
import { useStore } from '../../store/useStore';
import { validateImportPayload } from '../validation';

describe('Batch 2: Ethical Review Quality & Deliberation Engine', () => {
  const defaultFramework = defaultFrameworks[0];

  describe('Threshold Configuration Validation', () => {
    it('approves valid discrete and continuous threshold configurations', () => {
      const discreteThresholds: Threshold[] = [
        { id: 't1', minScore: 0, maxScore: 25, recommendation: 'Critical Risk' },
        { id: 't2', minScore: 26, maxScore: 50, recommendation: 'High Risk' },
        { id: 't3', minScore: 51, maxScore: 75, recommendation: 'Moderate Risk' },
        { id: 't4', minScore: 76, maxScore: 100, recommendation: 'Low Risk' },
      ];

      const result = validateThresholdConfiguration(discreteThresholds);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects inverted and out-of-bounds threshold score ranges', () => {
      const invalidThresholds: Threshold[] = [
        { id: 't1', minScore: 40, maxScore: 20, recommendation: 'Critical Risk' }, // inverted
        { id: 't2', minScore: -5, maxScore: 50, recommendation: 'High Risk' }, // negative min
        { id: 't3', minScore: 60, maxScore: 110, recommendation: 'Low Risk' }, // exceeds 100
      ];

      const result = validateThresholdConfiguration(invalidThresholds);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
      expect(result.errors.some((e) => e.includes('greater than maxScore'))).toBe(true);
      expect(result.errors.some((e) => e.includes('cannot be negative'))).toBe(true);
      expect(result.errors.some((e) => e.includes('cannot exceed 100'))).toBe(true);
    });

    it('detects conflicting overlapping threshold intervals', () => {
      const overlappingThresholds: Threshold[] = [
        { id: 't1', minScore: 0, maxScore: 35, recommendation: 'Critical Risk' },
        { id: 't2', minScore: 30, maxScore: 70, recommendation: 'High Risk' }, // overlaps 30-35
        { id: 't3', minScore: 71, maxScore: 100, recommendation: 'Low Risk' },
      ];

      const result = validateThresholdConfiguration(overlappingThresholds);
      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.includes('Overlapping thresholds detected'))).toBe(true);
    });

    it('generates informative warnings for non-standard gaps in coverage', () => {
      const gappyThresholds: Threshold[] = [
        { id: 't1', minScore: 10, maxScore: 30, recommendation: 'Critical Risk' },
        { id: 't2', minScore: 45, maxScore: 90, recommendation: 'Low Risk' },
      ];

      const result = validateThresholdConfiguration(gappyThresholds);
      expect(result.isValid).toBe(true); // Valid, but has warnings
      expect(result.warnings.some((w) => w.includes('leaving 0%–10% uncovered'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('leaving 90%–100% uncovered'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('Gap detected'))).toBe(true);
    });
  });

  describe('Criterion Dependencies & Rule Reference Protection', () => {
    it('identifies rules that depend on specific criterion identifiers', () => {
      const rules: Rule[] = [
        {
          id: 'rule-priv-1',
          description: 'Critical privacy risk',
          outcomeLevel: 'Critical Risk',
          conditionGroup: {
            id: 'cg-1',
            logic: 'AND',
            conditions: [
              {
                id: 'c-1',
                field: 'crit-privacy',
                operator: 'lessThan',
                value: 2,
              },
            ],
          },
        },
      ];

      // Privacy is referenced by rule-priv-1
      const dependentRules = findDependentRules('crit-privacy', rules);
      expect(dependentRules).toHaveLength(1);
      expect(dependentRules[0].id).toBe('rule-priv-1');

      // Oversight is not referenced by any rule
      const oversightDeps = findDependentRules('crit-oversight', rules);
      expect(oversightDeps).toHaveLength(0);
    });
  });

  describe('Review Lifecycle: Draft Saving, Resumption, and Finalisation', () => {
    it('preserves incomplete work in draft status without computing final recommendations', () => {
      // Incomplete scores (only 1 criterion answered out of 6)
      const partialScores = {
        'crit-human-oversight': 2,
      };

      const evalResult = evaluateAssessment(defaultFramework, partialScores);
      expect(evalResult.isComplete).toBe(false);

      const draftReview: Review = {
        id: 'draft-rev-1',
        frameworkId: defaultFramework.id,
        title: 'Work in Progress Assessment',
        description: 'Preliminary notes',
        aiSystem: 'LLM Grading v0.1',
        purpose: 'Assessment',
        context: 'University Course',
        stakeholders: ['Students'],
        reviewer: 'Academic Lead',
        reviewDate: new Date().toISOString(),
        scores: partialScores,
        notes: { 'crit-human-oversight': 'Initial check' },
        scoreExplanation: evalResult.scoreExplanation ?? undefined,
        overallRecommendation: evalResult.overallRecommendation ?? undefined,
        status: 'draft',
      };

      // Draft must not have a final recommendation published
      expect(draftReview.status).toBe('draft');
      expect(draftReview.overallRecommendation).toBeUndefined();
      expect(draftReview.scoreExplanation).toBeUndefined();
    });

    it('finalises assessment when all criteria are complete and attaches decision support rationale', () => {
      const completeScores = {
        'crit-human-oversight': 3,
        'crit-privacy': 3,
        'crit-transparency': 3,
        'crit-equity-fairness': 3,
        'crit-accessibility': 3,
        'crit-accountability': 3,
      };

      const evalResult = evaluateAssessment(defaultFramework, completeScores);
      expect(evalResult.isComplete).toBe(true);
      expect(evalResult.overallRecommendation).toBe('Low Risk');
      expect(evalResult.scoreExplanation?.totalScore).toBe(78);

      const humanDecision: HumanDecision = {
        concludedLevel: 'Low Risk',
        rationale: 'All ethical criteria satisfy institutional standards with strong oversight.',
      };

      const completedReview: Review = {
        id: 'final-rev-1',
        frameworkId: defaultFramework.id,
        title: 'Finalised Assessment',
        description: 'Complete review',
        aiSystem: 'LLM Assistant v1',
        purpose: 'Tutoring',
        context: 'Higher Ed',
        stakeholders: ['Students', 'Tutors'],
        reviewer: 'Ethics Committee',
        reviewDate: new Date().toISOString(),
        scores: completeScores,
        notes: {},
        scoreExplanation: evalResult.scoreExplanation ?? undefined,
        overallRecommendation: evalResult.overallRecommendation ?? undefined,
        triggeredRules: evalResult.triggeredRules,
        appliedSafeguards: defaultFramework.safeguards,
        status: 'completed',
        humanDecision,
      };

      expect(completedReview.status).toBe('completed');
      expect(completedReview.overallRecommendation).toBe('Low Risk');
      expect(completedReview.humanDecision?.concludedLevel).toBe('Low Risk');
    });
  });

  describe('Human Decision Deliberation & Deviation Justification', () => {
    it('records when a human decision intentionally diverges from advisory algorithmic recommendation', () => {
      const completeScores = {
        'crit-human-oversight': 3,
        'crit-privacy': 3,
        'crit-transparency': 3,
        'crit-equity-fairness': 3,
        'crit-accessibility': 3,
        'crit-accountability': 3,
      };

      const evalResult = evaluateAssessment(defaultFramework, completeScores);
      expect(evalResult.overallRecommendation).toBe('Low Risk');

      // Human reviewer chooses 'Moderate Risk' due to institutional context
      const humanDecision: HumanDecision = {
        concludedLevel: 'Moderate Risk',
        rationale: 'While scoring high across technical metrics, deployment context involves vulnerable minors.',
        deviationJustification: 'Heightened duty of care warrants elevating risk tier beyond the advisory score.',
        decidedAt: new Date().toISOString(),
      };

      expect(humanDecision.concludedLevel).not.toBe(evalResult.overallRecommendation);
      expect(humanDecision.deviationJustification).toBeTruthy();
    });
  });

  describe('Stakeholder & Evidence Structure Persistence and Round-Tripping', () => {
    it('validates and round-trips enriched review metadata through import validation', () => {
      const stakeholderImpacts: StakeholderImpact[] = [
        {
          id: 'sh-1',
          group: 'Undergraduate Students',
          benefits: 'Personalised formative feedback',
          concernsOrHarms: 'Potential over-reliance and automated misdirection',
          affectedInterests: 'Academic progression and grading fairness',
        },
      ];

      const evidenceItems: EvidenceItem[] = [
        {
          id: 'ev-1',
          description: 'Third-party algorithmic bias evaluation',
          sourceOrReference: 'Audit Report 2026-B',
          evidenceType: 'Independent Audit',
          verificationStatus: 'Verified',
          limitationsOrUncertainty: 'Tested on sample of 5,000 queries; edge cases remain unbenchmarked',
        },
      ];

      const ethicalReflections: EthicalReflections = {
        significantConcerns: 'Risk of opaque automated scoring',
        competingValues: 'Efficiency vs Student Dignity',
        tradeOffs: 'Automated speed acceptable only with mandatory human sign-off',
        unresolvedQuestions: 'Long-term cognitive impact on student learning autonomy',
        reviewerReasoning: 'Balanced risk posture with targeted safeguards',
      };

      const richReview: Review = {
        id: 'rich-rev-100',
        frameworkId: defaultFramework.id,
        title: 'Comprehensive Ethics Assessment',
        description: 'Evaluation with full qualitative deliberation',
        aiSystem: 'ExamProctor AI',
        purpose: 'Assessment Monitoring',
        context: 'Remote Examinations',
        stakeholders: ['Undergraduate Students'],
        reviewer: 'Ethics Board',
        reviewDate: new Date().toISOString(),
        scores: {
          'crit-human-oversight': 2,
          'crit-privacy': 2,
          'crit-transparency': 2,
          'crit-equity-fairness': 2,
          'crit-accessibility': 2,
          'crit-accountability': 2,
        },
        notes: { 'crit-privacy': 'End-to-end encrypted video stream' },
        overallRecommendation: 'Moderate Risk',
        status: 'completed',
        stakeholderImpacts,
        evidenceItems,
        ethicalReflections,
        humanDecision: {
          concludedLevel: 'Moderate Risk',
          rationale: 'Controls are adequate under condition of annual independent re-audit',
        },
      };

      const payload = {
        frameworks: defaultFrameworks,
        reviews: [richReview],
        activeFrameworkId: defaultFramework.id,
      };

      const validation = validateImportPayload(payload);
      expect(validation.isValid).toBe(true);
      expect(validation.data?.reviews).toHaveLength(1);

      const importedReview = validation.data?.reviews?.[0];
      expect(importedReview?.stakeholderImpacts).toHaveLength(1);
      expect(importedReview?.evidenceItems).toHaveLength(1);
      expect(importedReview?.ethicalReflections?.competingValues).toBe('Efficiency vs Student Dignity');
      expect(importedReview?.humanDecision?.concludedLevel).toBe('Moderate Risk');
    });
  });

  describe('Historical Review Invariance Under Framework Modification', () => {
    it('ensures modifying a framework does not alter previously saved completed review outcomes', () => {
      useStore.getState().resetToDefaults();

      const originalOutcome = 'High Risk';
      const savedReview: Review = {
        id: 'hist-rev-1',
        frameworkId: defaultFramework.id,
        title: 'Historical AI Review',
        description: 'Completed in 2025',
        aiSystem: 'Legacy Classifier',
        purpose: 'Classification',
        context: 'Internal',
        stakeholders: [],
        reviewer: 'Former Officer',
        reviewDate: '2025-06-01T00:00:00.000Z',
        scores: {
          'crit-human-oversight': 1,
          'crit-privacy': 1,
          'crit-transparency': 1,
          'crit-equity-fairness': 1,
          'crit-accessibility': 1,
          'crit-accountability': 1,
        },
        notes: {},
        overallRecommendation: originalOutcome,
        scoreExplanation: {
          totalScore: 26,
          maxPossibleScore: 78,
          criterionContributions: [],
        },
        status: 'completed',
      };

      useStore.getState().addReview(savedReview);

      // Now simulate a framework update (e.g. changing weights or criteria in framework)
      useStore.getState().updateFramework(defaultFramework.id, {
        description: 'Updated framework description for 2026',
        thresholds: [
          { id: 't-new-1', minScore: 0, maxScore: 50, recommendation: 'Critical Risk' },
          { id: 't-new-2', minScore: 51, maxScore: 100, recommendation: 'Low Risk' },
        ],
      });

      // Retrieve review from store
      const persistedReview = useStore.getState().reviews.find((r) => r.id === 'hist-rev-1');
      expect(persistedReview).toBeDefined();
      // Must retain exact original outcome and explanation
      expect(persistedReview?.overallRecommendation).toBe(originalOutcome);
      expect(persistedReview?.scoreExplanation?.totalScore).toBe(26);
    });

    it('creates an explicit revision draft referencing previous assessment upon duplication', () => {
      useStore.getState().resetToDefaults();

      const originalReview: Review = {
        id: 'rev-to-revise',
        frameworkId: defaultFramework.id,
        title: 'Q1 AI Assistant Assessment',
        description: '',
        aiSystem: 'ChatBot v1',
        purpose: '',
        context: '',
        stakeholders: [],
        reviewer: 'Auditor',
        reviewDate: '2026-01-15T00:00:00.000Z',
        scores: { 'crit-privacy': 2 },
        notes: {},
        overallRecommendation: 'Moderate Risk',
        status: 'completed',
      };

      useStore.getState().addReview(originalReview);
      useStore.getState().duplicateReview('rev-to-revise');

      const allReviews = useStore.getState().reviews;
      expect(allReviews).toHaveLength(2);

      const revision = allReviews.find((r) => r.id !== 'rev-to-revise');
      expect(revision).toBeDefined();
      expect(revision?.isRevisionOf).toBe('rev-to-revise');
      expect(revision?.status).toBe('draft');
      expect(revision?.title).toContain('Copy');

      // The original review remains strictly completed and intact
      const originalCheck = allReviews.find((r) => r.id === 'rev-to-revise');
      expect(originalCheck?.status).toBe('completed');
      expect(originalCheck?.overallRecommendation).toBe('Moderate Risk');
    });
  });
});
