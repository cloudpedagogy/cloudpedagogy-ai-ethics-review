import type {
  Framework,
  Review,
  RecommendationLevel,
} from '../models/types';

const VALID_RECOMMENDATION_LEVELS = new Set<RecommendationLevel>([
  'Low Risk',
  'Moderate Risk',
  'High Risk',
  'Critical Risk',
]);

export interface ValidationOutcome {
  isValid: boolean;
  error?: string;
  data?: {
    frameworks?: Framework[];
    reviews?: Review[];
    activeFrameworkId?: string;
  };
}

const MAX_JSON_STRING_LENGTH = 5 * 1024 * 1024; // 5 MB safeguard

export function validateImportPayload(rawInput: unknown): ValidationOutcome {
  if (typeof rawInput === 'string') {
    if (rawInput.length > MAX_JSON_STRING_LENGTH) {
      return { isValid: false, error: 'Import payload exceeds maximum allowable size (5 MB).' };
    }
    try {
      rawInput = JSON.parse(rawInput);
    } catch {
      return { isValid: false, error: 'Invalid JSON format: failed to parse payload.' };
    }
  }

  if (!rawInput || typeof rawInput !== 'object' || Array.isArray(rawInput)) {
    return { isValid: false, error: 'Payload must be a JSON object.' };
  }

  const obj = rawInput as Record<string, unknown>;

  // Check that at least one recognizable key is provided
  if (!('frameworks' in obj) && !('reviews' in obj) && !('activeFrameworkId' in obj)) {
    return {
      isValid: false,
      error: 'Invalid schema: payload must contain at least "frameworks" or "reviews".',
    };
  }

  const validatedData: ValidationOutcome['data'] = {};

  // 1. Validate Frameworks if present
  if ('frameworks' in obj) {
    if (!Array.isArray(obj.frameworks)) {
      return { isValid: false, error: 'Field "frameworks" must be an array.' };
    }

    const validatedFrameworks: Framework[] = [];

    for (let i = 0; i < obj.frameworks.length; i++) {
      const fw = obj.frameworks[i];
      if (!fw || typeof fw !== 'object') {
        return { isValid: false, error: `Framework at index ${i} is not an object.` };
      }

      const f = fw as Record<string, unknown>;
      if (typeof f.id !== 'string' || !f.id.trim()) {
        return { isValid: false, error: `Framework at index ${i} is missing a valid "id".` };
      }
      if (typeof f.name !== 'string' || !f.name.trim()) {
        return { isValid: false, error: `Framework "${f.id}" is missing a valid "name".` };
      }
      if (!Array.isArray(f.criteria)) {
        return { isValid: false, error: `Framework "${f.name}" criteria must be an array.` };
      }
      if (!Array.isArray(f.thresholds)) {
        return { isValid: false, error: `Framework "${f.name}" thresholds must be an array.` };
      }
      if (!Array.isArray(f.rules)) {
        return { isValid: false, error: `Framework "${f.name}" rules must be an array.` };
      }
      if (!Array.isArray(f.safeguards)) {
        return { isValid: false, error: `Framework "${f.name}" safeguards must be an array.` };
      }

      // Validate criteria items
      for (let j = 0; j < f.criteria.length; j++) {
        const crit = f.criteria[j] as Record<string, unknown>;
        if (!crit || typeof crit !== 'object' || typeof crit.id !== 'string' || typeof crit.title !== 'string') {
          return { isValid: false, error: `Framework "${f.name}" criterion at index ${j} is invalid.` };
        }
        if (typeof crit.weight !== 'number' || isNaN(crit.weight) || crit.weight < 0) {
          return { isValid: false, error: `Framework "${f.name}" criterion "${crit.id}" must have a non-negative weight.` };
        }
        const scale = crit.scoringScale as Record<string, unknown>;
        if (!scale || typeof scale !== 'object' || typeof scale.min !== 'number' || typeof scale.max !== 'number') {
          return { isValid: false, error: `Framework "${f.name}" criterion "${crit.id}" has an invalid scoring scale.` };
        }
      }

      // Validate thresholds
      for (let k = 0; k < f.thresholds.length; k++) {
        const th = f.thresholds[k] as Record<string, unknown>;
        if (!th || typeof th !== 'object' || typeof th.id !== 'string') {
          return { isValid: false, error: `Framework "${f.name}" threshold at index ${k} is invalid.` };
        }
        if (typeof th.minScore !== 'number' || typeof th.maxScore !== 'number') {
          return { isValid: false, error: `Framework "${f.name}" threshold "${th.id}" score range is invalid.` };
        }
        if (!VALID_RECOMMENDATION_LEVELS.has(th.recommendation as RecommendationLevel)) {
          return { isValid: false, error: `Framework "${f.name}" threshold "${th.id}" has unrecognized recommendation level.` };
        }
      }

      // Validate rules
      for (let r = 0; r < f.rules.length; r++) {
        const rule = f.rules[r] as Record<string, unknown>;
        if (!rule || typeof rule !== 'object' || typeof rule.id !== 'string') {
          return { isValid: false, error: `Framework "${f.name}" rule at index ${r} is invalid.` };
        }
        if (!VALID_RECOMMENDATION_LEVELS.has(rule.outcomeLevel as RecommendationLevel)) {
          return { isValid: false, error: `Framework "${f.name}" rule "${rule.id}" has invalid outcomeLevel.` };
        }
        const cg = rule.conditionGroup as Record<string, unknown>;
        if (!cg || typeof cg !== 'object' || (cg.logic !== 'AND' && cg.logic !== 'OR') || !Array.isArray(cg.conditions)) {
          return { isValid: false, error: `Framework "${f.name}" rule "${rule.id}" has invalid conditionGroup.` };
        }
      }

      // Validated framework item
      validatedFrameworks.push(f as unknown as Framework);
    }

    validatedData.frameworks = validatedFrameworks;
  }

  // 2. Validate Reviews if present
  if ('reviews' in obj) {
    if (!Array.isArray(obj.reviews)) {
      return { isValid: false, error: 'Field "reviews" must be an array.' };
    }

    const validatedReviews: Review[] = [];

    for (let i = 0; i < obj.reviews.length; i++) {
      const rev = obj.reviews[i];
      if (!rev || typeof rev !== 'object') {
        return { isValid: false, error: `Review at index ${i} is not an object.` };
      }

      const r = rev as Record<string, unknown>;
      if (typeof r.id !== 'string' || !r.id.trim()) {
        return { isValid: false, error: `Review at index ${i} is missing a valid "id".` };
      }
      if (typeof r.frameworkId !== 'string' || !r.frameworkId.trim()) {
        return { isValid: false, error: `Review "${r.id}" is missing a valid "frameworkId".` };
      }
      if (typeof r.title !== 'string') {
        return { isValid: false, error: `Review "${r.id}" is missing a valid "title".` };
      }
      if (!r.scores || typeof r.scores !== 'object' || Array.isArray(r.scores)) {
        return { isValid: false, error: `Review "${r.id}" scores must be an object.` };
      }
      if (!r.notes || typeof r.notes !== 'object' || Array.isArray(r.notes)) {
        return { isValid: false, error: `Review "${r.id}" notes must be an object.` };
      }

      // Validate scores values
      for (const [key, val] of Object.entries(r.scores as Record<string, unknown>)) {
        if (typeof val !== 'number' || isNaN(val)) {
          return { isValid: false, error: `Review "${r.id}" score for criterion "${key}" must be a number.` };
        }
      }

      // Validate optional Batch 2 enriched structures if present
      if ('stakeholderImpacts' in r && r.stakeholderImpacts !== undefined && !Array.isArray(r.stakeholderImpacts)) {
        return { isValid: false, error: `Review "${r.id}" stakeholderImpacts must be an array.` };
      }
      if ('evidenceItems' in r && r.evidenceItems !== undefined && !Array.isArray(r.evidenceItems)) {
        return { isValid: false, error: `Review "${r.id}" evidenceItems must be an array.` };
      }
      if ('selectedSafeguardIds' in r && r.selectedSafeguardIds !== undefined && !Array.isArray(r.selectedSafeguardIds)) {
        return { isValid: false, error: `Review "${r.id}" selectedSafeguardIds must be an array.` };
      }
      if ('humanDecision' in r && r.humanDecision !== undefined) {
        const hd = r.humanDecision as Record<string, unknown>;
        if (!hd || typeof hd !== 'object' || !VALID_RECOMMENDATION_LEVELS.has(hd.concludedLevel as RecommendationLevel)) {
          return { isValid: false, error: `Review "${r.id}" humanDecision has an invalid concludedLevel.` };
        }
      }

      validatedReviews.push(r as unknown as Review);
    }

    validatedData.reviews = validatedReviews;
  }

  // 3. Validate activeFrameworkId if present
  if ('activeFrameworkId' in obj) {
    if (typeof obj.activeFrameworkId !== 'string') {
      return { isValid: false, error: 'Field "activeFrameworkId" must be a string.' };
    }
    validatedData.activeFrameworkId = obj.activeFrameworkId;
  }

  return {
    isValid: true,
    data: validatedData,
  };
}
