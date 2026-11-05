import type {
  Framework,
  Criterion,
  Threshold,
  Rule,
  ScoreExplanation,
  CriterionScoreExplanation,
  RecommendationLevel,
} from '../models/types';

export const RECOMMENDATION_SEVERITY: Record<RecommendationLevel, number> = {
  'Low Risk': 1,
  'Moderate Risk': 2,
  'High Risk': 3,
  'Critical Risk': 4,
};

export interface CompletionValidation {
  isValid: boolean;
  missingCriterionIds: string[];
  invalidCriterionIds: string[];
}

export interface ThresholdValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validates a threshold configuration for complete coverage, range validity, and absence of conflicting overlaps.
 */
export function validateThresholdConfiguration(thresholds: Threshold[]): ThresholdValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!thresholds || thresholds.length === 0) {
    errors.push('At least one threshold must be configured.');
    return { isValid: false, errors, warnings };
  }

  for (let i = 0; i < thresholds.length; i++) {
    const t = thresholds[i];
    if (typeof t.minScore !== 'number' || isNaN(t.minScore)) {
      errors.push(`Threshold at index ${i} has invalid minimum score.`);
    }
    if (typeof t.maxScore !== 'number' || isNaN(t.maxScore)) {
      errors.push(`Threshold at index ${i} has invalid maximum score.`);
    }
    if (t.minScore > t.maxScore) {
      errors.push(`Threshold "${t.recommendation || i}" has minScore (${t.minScore}) greater than maxScore (${t.maxScore}).`);
    }
    if (t.minScore < 0) {
      errors.push(`Threshold "${t.recommendation || i}" minScore cannot be negative.`);
    }
    if (t.maxScore > 100) {
      errors.push(`Threshold "${t.recommendation || i}" maxScore cannot exceed 100.`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // Sort copy ascending by minScore to inspect bounds
  const sorted = [...thresholds].sort((a, b) => a.minScore - b.minScore);

  if (sorted[0].minScore > 0) {
    warnings.push(`Threshold coverage begins at ${sorted[0].minScore}%, leaving 0%–${sorted[0].minScore}% uncovered (will clamp to lowest threshold).`);
  }

  if (sorted[sorted.length - 1].maxScore < 100) {
    warnings.push(`Threshold coverage ends at ${sorted[sorted.length - 1].maxScore}%, leaving ${sorted[sorted.length - 1].maxScore}%–100% uncovered (will clamp to highest threshold).`);
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (next.minScore < current.maxScore) {
      errors.push(`Overlapping thresholds detected between "${current.recommendation}" (${current.minScore}–${current.maxScore}%) and "${next.recommendation}" (${next.minScore}–${next.maxScore}%).`);
    } else if (next.minScore > current.maxScore + 1) {
      warnings.push(`Gap detected between "${current.recommendation}" (max ${current.maxScore}%) and "${next.recommendation}" (min ${next.minScore}%). Midpoint continuous convention will bridge this gap.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Finds all rules within a framework that reference a specific criterion ID.
 */
export function findDependentRules(criterionId: string, rules: Rule[]): Rule[] {
  return rules.filter((rule) => {
    if (!rule.conditionGroup || !rule.conditionGroup.conditions) return false;
    return rule.conditionGroup.conditions.some((cond) => cond.field === criterionId);
  });
}

export interface AssessmentResult {
  isComplete: boolean;
  missingCriterionIds: string[];
  scoreExplanation: ScoreExplanation | null;
  percentage: number | null;
  baselineRecommendation: RecommendationLevel | null;
  overallRecommendation: RecommendationLevel | null;
  triggeredRules: Rule[];
}

/**
 * Validates whether all criteria in a framework have valid scores assigned.
 * Score 0 is a valid score and is not considered missing.
 */
export function validateReviewCompletion(
  framework: Pick<Framework, 'criteria'>,
  scores: Record<string, number | undefined | null>
): CompletionValidation {
  const missingCriterionIds: string[] = [];
  const invalidCriterionIds: string[] = [];

  for (const crit of framework.criteria) {
    const val = scores[crit.id];
    if (val === undefined || val === null || typeof val !== 'number' || isNaN(val)) {
      missingCriterionIds.push(crit.id);
    } else if (val < crit.scoringScale.min || val > crit.scoringScale.max) {
      invalidCriterionIds.push(crit.id);
    }
  }

  return {
    isValid: missingCriterionIds.length === 0 && invalidCriterionIds.length === 0,
    missingCriterionIds,
    invalidCriterionIds,
  };
}

/**
 * Computes score contributions, total score, and maximum possible score.
 * Pure function: does not mutate framework or scores.
 */
export function calculateScoreExplanation(
  criteria: Criterion[],
  scores: Record<string, number>
): ScoreExplanation {
  let totalScore = 0;
  let maxPossibleScore = 0;

  const criterionContributions: CriterionScoreExplanation[] = criteria.map((crit) => {
    const score = scores[crit.id] ?? 0;
    const contribution = score * crit.weight;
    totalScore += contribution;
    maxPossibleScore += crit.scoringScale.max * crit.weight;
    return {
      criterionId: crit.id,
      score,
      weight: crit.weight,
      contribution,
    };
  });

  return {
    totalScore,
    maxPossibleScore,
    criterionContributions,
  };
}

/**
 * Calculates percentage from total score and maximum possible score.
 */
export function calculatePercentage(totalScore: number, maxPossibleScore: number): number {
  if (maxPossibleScore <= 0) return 0;
  return (totalScore / maxPossibleScore) * 100;
}

/**
 * Evaluates a percentage against framework thresholds deterministically.
 * Non-mutating: creates a shallow copy of thresholds before sorting.
 * 
 * Boundary Convention:
 * 1. Thresholds are sorted ascending by minScore.
 * 2. If percentage falls inside [minScore, maxScore] of threshold Ti, Ti matches.
 * 3. If there is a gap between Ti.maxScore and T(i+1).minScore (e.g. 25 to 26):
 *    The boundary is the arithmetic midpoint: (Ti.maxScore + T(i+1).minScore) / 2.
 *    Values < midpoint map to Ti; values >= midpoint map to T(i+1).
 * 4. Percentage <= lowest minScore maps to the lowest threshold.
 * 5. Percentage >= highest maxScore maps to the highest threshold.
 * 6. Never silently falls back to 'Moderate Risk' if thresholds are empty or invalid.
 */
export function evaluateThresholds(
  thresholds: Threshold[],
  percentage: number
): RecommendationLevel {
  if (!thresholds || thresholds.length === 0) {
    throw new Error('Cannot evaluate thresholds: no thresholds configured in framework.');
  }

  // Non-mutating sort by minScore ascending
  const sorted = [...thresholds].sort((a, b) => a.minScore - b.minScore);

  // If percentage is below the lowest threshold minScore, assign lowest
  if (percentage <= sorted[0].minScore) {
    return sorted[0].recommendation;
  }

  // If percentage is at or above the highest threshold maxScore, assign highest
  const lastIndex = sorted.length - 1;
  if (percentage >= sorted[lastIndex].maxScore) {
    return sorted[lastIndex].recommendation;
  }

  // Iterate through bands and gaps
  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];

    // Direct interval match
    if (percentage >= current.minScore && percentage <= current.maxScore) {
      return current.recommendation;
    }

    // Gap check between current and next
    if (i < lastIndex) {
      const next = sorted[i + 1];
      if (percentage > current.maxScore && percentage < next.minScore) {
        const midpoint = (current.maxScore + next.minScore) / 2;
        return percentage < midpoint ? current.recommendation : next.recommendation;
      }
    }
  }

  // Safe fallback if overlapping or irregular ranges: find closest threshold
  return sorted[lastIndex].recommendation;
}

/**
 * Evaluates conditional red-flag rules against scores.
 * Uses exact criterion IDs (not hardcoded 'crit-' prefixes).
 * Ensures unanswered/incomplete criteria NEVER trigger rules.
 * Pure function: does not mutate framework or rules.
 */
export function evaluateConditionalRules(
  rules: Rule[],
  scores: Record<string, number | undefined | null>,
  criteria: Criterion[]
): Rule[] {
  const validCriterionIds = new Set(criteria.map((c) => c.id));

  return rules.filter((rule) => {
    if (!rule.conditionGroup || !rule.conditionGroup.conditions) return false;

    // Batch 1 supports AND logic at root level
    if (rule.conditionGroup.logic === 'AND') {
      return rule.conditionGroup.conditions.every((cond) => {
        // Condition references a criterion in the framework
        if (!validCriterionIds.has(cond.field)) {
          return false;
        }

        const scoreVal = scores[cond.field];

        // An incomplete or unanswered criterion NEVER triggers a rule
        if (scoreVal === undefined || scoreVal === null || typeof scoreVal !== 'number') {
          return false;
        }

        const targetVal = typeof cond.value === 'number' ? cond.value : Number(cond.value);
        if (isNaN(targetVal)) return false;

        switch (cond.operator) {
          case 'lessThan':
            return scoreVal < targetVal;
          case 'greaterThan':
            return scoreVal > targetVal;
          case 'equals':
            return scoreVal === targetVal;
          default:
            return false;
        }
      });
    }

    if (rule.conditionGroup.logic === 'OR') {
      return rule.conditionGroup.conditions.some((cond) => {
        if (!validCriterionIds.has(cond.field)) return false;
        const scoreVal = scores[cond.field];
        if (scoreVal === undefined || scoreVal === null || typeof scoreVal !== 'number') return false;
        const targetVal = typeof cond.value === 'number' ? cond.value : Number(cond.value);
        if (isNaN(targetVal)) return false;

        switch (cond.operator) {
          case 'lessThan':
            return scoreVal < targetVal;
          case 'greaterThan':
            return scoreVal > targetVal;
          case 'equals':
            return scoreVal === targetVal;
          default:
            return false;
        }
      });
    }

    return false;
  });
}

/**
 * Escalates baseline recommendation if any triggered rule mandates a higher risk tier.
 */
export function escalateRecommendation(
  baselineRecommendation: RecommendationLevel,
  triggeredRules: Rule[]
): RecommendationLevel {
  let highest = baselineRecommendation;

  for (const rule of triggeredRules) {
    if (RECOMMENDATION_SEVERITY[rule.outcomeLevel] > RECOMMENDATION_SEVERITY[highest]) {
      highest = rule.outcomeLevel;
    }
  }

  return highest;
}

/**
 * Full assessment evaluation pipeline.
 */
export function evaluateAssessment(
  framework: Framework,
  scores: Record<string, number | undefined | null>
): AssessmentResult {
  const completion = validateReviewCompletion(framework, scores);

  if (!completion.isValid) {
    return {
      isComplete: false,
      missingCriterionIds: completion.missingCriterionIds,
      scoreExplanation: null,
      percentage: null,
      baselineRecommendation: null,
      overallRecommendation: null,
      triggeredRules: [],
    };
  }

  // At this point, all scores are guaranteed to be valid numbers
  const completeScores = scores as Record<string, number>;
  const scoreExplanation = calculateScoreExplanation(framework.criteria, completeScores);
  const percentage = calculatePercentage(scoreExplanation.totalScore, scoreExplanation.maxPossibleScore);
  const baselineRecommendation = evaluateThresholds(framework.thresholds, percentage);
  const triggeredRules = evaluateConditionalRules(framework.rules, completeScores, framework.criteria);
  const overallRecommendation = escalateRecommendation(baselineRecommendation, triggeredRules);

  return {
    isComplete: true,
    missingCriterionIds: [],
    scoreExplanation,
    percentage,
    baselineRecommendation,
    overallRecommendation,
    triggeredRules,
  };
}
