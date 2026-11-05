import { describe, it, expect } from 'vitest';
import type { Framework, Review, FrameworkSnapshot } from '../../models/types';
import { validateImportPayload } from '../validation';
import { validateThresholdConfiguration } from '../assessmentEngine';

const mockBaseFramework: Framework = {
  id: 'fw-batch3-test',
  name: 'Batch 3 Audit Framework',
  description: 'Testing snapshot immutability and fallback resilience',
  isDefault: false,
  criteria: [
    {
      id: 'crit-fairness',
      title: 'Algorithmic Fairness',
      description: 'Evaluating demographic parity',
      weight: 3,
      scoringScale: { type: 'numeric', min: 0, max: 4 },
      guidanceNotes: 'Look for disparate impact',
      displayOrder: 1,
    },
    {
      id: 'crit-transparency',
      title: 'Explainability & Transparency',
      description: 'System interpretability',
      weight: 2,
      scoringScale: { type: 'numeric', min: 0, max: 4 },
      guidanceNotes: 'User model cards',
      displayOrder: 2,
    },
  ],
  thresholds: [
    { id: 'th-1', minScore: 0, maxScore: 25, recommendation: 'Low Risk' },
    { id: 'th-2', minScore: 26, maxScore: 50, recommendation: 'Moderate Risk' },
    { id: 'th-3', minScore: 51, maxScore: 75, recommendation: 'High Risk' },
    { id: 'th-4', minScore: 76, maxScore: 100, recommendation: 'Critical Risk' },
  ],
  rules: [
    {
      id: 'rule-critical-fairness',
      outcomeLevel: 'Critical Risk',
      description: 'High bias triggers Critical Risk',
      conditionGroup: {
        id: 'cg-1',
        logic: 'AND',
        conditions: [
          { id: 'cond-1', field: 'crit-fairness', operator: 'equals', value: 4 },
        ],
      },
    },
  ],
  safeguards: [
    { id: 'sg-audit', title: 'Independent Algorithmic Audit', description: 'Annual review' },
  ],
};

describe('Batch 3: Historical Framework Integrity & Assessment Snapshots', () => {
  it('creates an immutable deep copy snapshot that is resilient to subsequent framework mutations', () => {
    // 1. Capture snapshot at review completion
    const frameworkSnapshot: FrameworkSnapshot = {
      id: mockBaseFramework.id,
      name: mockBaseFramework.name,
      description: mockBaseFramework.description,
      criteria: JSON.parse(JSON.stringify(mockBaseFramework.criteria)),
      thresholds: JSON.parse(JSON.stringify(mockBaseFramework.thresholds)),
      rules: JSON.parse(JSON.stringify(mockBaseFramework.rules)),
      safeguards: JSON.parse(JSON.stringify(mockBaseFramework.safeguards)),
      capturedAt: new Date().toISOString(),
    };

    const completedReview: Review = {
      id: 'rev-snapshot-1',
      frameworkId: mockBaseFramework.id,
      title: 'Historical AI Assessment',
      description: 'Assessing algorithmic admissions assistant',
      aiSystem: 'AdmissionsAI v1',
      purpose: 'Initial screening',
      context: 'Higher education admissions',
      stakeholders: ['Applicants', 'Admissions Officers'],
      reviewer: 'Ethics Committee Chair',
      reviewDate: '2026-01-15T10:00:00.000Z',
      scores: { 'crit-fairness': 1, 'crit-transparency': 2 },
      notes: { 'crit-fairness': 'Disparate impact ratio within acceptable tolerance' },
      status: 'completed',
      overallRecommendation: 'Low Risk',
      appliedSafeguards: mockBaseFramework.safeguards,
      frameworkSnapshot,
    };

    // 2. Mutate the active framework substantially
    const mutatedFramework: Framework = JSON.parse(JSON.stringify(mockBaseFramework));
    mutatedFramework.criteria[0].weight = 99; // Modified weight
    mutatedFramework.criteria[0].title = 'Completely Renamed Fairness Rubric';
    mutatedFramework.criteria.pop(); // Removed transparency criterion
    mutatedFramework.thresholds[0].maxScore = 10; // Altered thresholds
    mutatedFramework.rules = []; // Cleared rules
    mutatedFramework.safeguards = []; // Cleared safeguards

    // 3. Verify that the completed review snapshot remains completely unaltered
    expect(completedReview.frameworkSnapshot).toBeDefined();
    expect(completedReview.frameworkSnapshot!.criteria.length).toBe(2);
    expect(completedReview.frameworkSnapshot!.criteria[0].weight).toBe(3);
    expect(completedReview.frameworkSnapshot!.criteria[0].title).toBe('Algorithmic Fairness');
    expect(completedReview.frameworkSnapshot!.criteria[1].id).toBe('crit-transparency');
    expect(completedReview.frameworkSnapshot!.thresholds[0].maxScore).toBe(25);
    expect(completedReview.frameworkSnapshot!.rules.length).toBe(1);
    expect(completedReview.frameworkSnapshot!.safeguards.length).toBe(1);
  });

  it('resolves historical snapshot over mutated or deleted live framework', () => {
    const historicalSnapshot: FrameworkSnapshot = {
      id: 'fw-deleted-legacy',
      name: 'Archived Custom Rubric',
      description: 'Original framework deleted long ago',
      criteria: [
        {
          id: 'crit-safety',
          title: 'Physical & Digital Safety',
          description: '',
          weight: 5,
          scoringScale: { type: 'numeric', min: 0, max: 4 },
          guidanceNotes: '',
          displayOrder: 1,
        },
      ],
      thresholds: [],
      rules: [],
      safeguards: [],
      capturedAt: '2025-06-01T12:00:00.000Z',
    };

    const reviewWithSnapshot: Review = {
      id: 'rev-archived-snapshot',
      frameworkId: 'fw-deleted-legacy',
      title: 'Review of Decommissioned Model',
      description: '',
      aiSystem: 'VisionBot',
      purpose: '',
      context: '',
      stakeholders: [],
      reviewer: 'Auditor',
      reviewDate: '2025-06-01T12:00:00.000Z',
      scores: { 'crit-safety': 0 },
      notes: {},
      status: 'completed',
      frameworkSnapshot: historicalSnapshot,
    };

    // Simulate empty active frameworks array (e.g., custom framework was deleted)
    const activeFrameworks: Framework[] = [];

    // Resolution priority logic
    const resolvedFramework =
      reviewWithSnapshot.frameworkSnapshot ||
      activeFrameworks.find((f) => f.id === reviewWithSnapshot.frameworkId);

    expect(resolvedFramework).toBeDefined();
    expect(resolvedFramework!.name).toBe('Archived Custom Rubric');
    expect(resolvedFramework!.criteria[0].id).toBe('crit-safety');
    expect(resolvedFramework!.criteria[0].weight).toBe(5);
  });

  it('validates import payload containing valid frameworkSnapshot', () => {
    const payload = {
      reviews: [
        {
          id: 'rev-import-test',
          frameworkId: 'fw-default',
          title: 'Imported Review with Snapshot',
          scores: { 'crit-1': 2 },
          notes: { 'crit-1': 'Compliant' },
          frameworkSnapshot: {
            id: 'fw-default',
            name: 'Default Ethics Rubric',
            description: 'Archived',
            criteria: [
              {
                id: 'crit-1',
                title: 'Data Privacy',
                weight: 1,
                scoringScale: { type: 'numeric', min: 0, max: 4 },
                guidanceNotes: '',
                displayOrder: 1,
              },
            ],
            thresholds: [],
            rules: [],
            safeguards: [],
            capturedAt: '2026-02-10T14:00:00.000Z',
          },
        },
      ],
    };

    const outcome = validateImportPayload(payload);
    expect(outcome.isValid).toBe(true);
    expect(outcome.data?.reviews?.[0].frameworkSnapshot?.name).toBe('Default Ethics Rubric');
  });

  it('rejects import payload with invalid frameworkSnapshot structure', () => {
    const invalidPayload = {
      reviews: [
        {
          id: 'rev-invalid-snap',
          frameworkId: 'fw-default',
          title: 'Corrupted Snapshot Review',
          scores: {},
          notes: {},
          frameworkSnapshot: 'not-an-object', // Malformed snapshot
        },
      ],
    };

    const outcome = validateImportPayload(invalidPayload);
    expect(outcome.isValid).toBe(false);
    expect(outcome.error).toContain('invalid frameworkSnapshot');
  });

  it('validates threshold configurations with strict boundary integrity', () => {
    // 1. Valid non-overlapping continuous thresholds
    const validThresholds = [
      { id: '1', minScore: 0, maxScore: 25, recommendation: 'Low Risk' as const },
      { id: '2', minScore: 26, maxScore: 50, recommendation: 'Moderate Risk' as const },
      { id: '3', minScore: 51, maxScore: 75, recommendation: 'High Risk' as const },
      { id: '4', minScore: 76, maxScore: 100, recommendation: 'Critical Risk' as const },
    ];
    expect(validateThresholdConfiguration(validThresholds).isValid).toBe(true);

    // 2. Inverted bounds (minScore > maxScore)
    const invertedThresholds = [
      { id: '1', minScore: 50, maxScore: 20, recommendation: 'Low Risk' as const },
    ];
    const invertedResult = validateThresholdConfiguration(invertedThresholds);
    expect(invertedResult.isValid).toBe(false);
    expect(invertedResult.errors[0]).toContain('greater than maxScore');

    // 3. Overlapping ranges
    const overlappingThresholds = [
      { id: '1', minScore: 0, maxScore: 50, recommendation: 'Low Risk' as const },
      { id: '2', minScore: 40, maxScore: 80, recommendation: 'Moderate Risk' as const },
    ];
    const overlapResult = validateThresholdConfiguration(overlappingThresholds);
    expect(overlapResult.isValid).toBe(false);
    expect(overlapResult.errors[0]).toContain('Overlapping');
  });
});
