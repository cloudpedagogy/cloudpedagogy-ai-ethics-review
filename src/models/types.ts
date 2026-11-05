export type RecommendationLevel = 'Low Risk' | 'Moderate Risk' | 'High Risk' | 'Critical Risk';

export interface ScoringScale {
  type: 'numeric' | 'labels';
  min: number;
  max: number;
  labels?: Record<number, string>; // e.g., { 1: "Low", 2: "Medium", 3: "High" }
}

export interface Criterion {
  id: string;
  title: string;
  description: string;
  weight: number;
  scoringScale: ScoringScale;
  guidanceNotes: string;
  category?: string;
  displayOrder: number;
}

export interface RuleCondition {
  id: string;
  field: string; // Could be criterion ID or review field (e.g. 'affectsGrades')
  operator: 'equals' | 'greaterThan' | 'lessThan' | 'contains';
  value: string | number | boolean;
}

export interface RuleConditionGroup {
  id: string;
  logic: 'AND' | 'OR';
  conditions: RuleCondition[];
  groups?: RuleConditionGroup[]; // For nested conditions
}

export interface Rule {
  id: string;
  conditionGroup: RuleConditionGroup;
  outcomeLevel: RecommendationLevel;
  description: string;
}

export interface Safeguard {
  id: string;
  title: string;
  description: string;
}

export interface Threshold {
  id: string;
  minScore: number;
  maxScore: number;
  recommendation: RecommendationLevel;
}

export interface Framework {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  criteria: Criterion[];
  rules: Rule[];
  safeguards: Safeguard[];
  thresholds: Threshold[];
}

export interface CriterionScoreExplanation {
  criterionId: string;
  score: number;
  weight: number;
  contribution: number; // score * weight
}

export interface ScoreExplanation {
  totalScore: number;
  maxPossibleScore: number;
  criterionContributions: CriterionScoreExplanation[];
}

export interface StakeholderImpact {
  id: string;
  group: string;
  benefits?: string;
  concernsOrHarms?: string;
  affectedInterests?: string;
}

export interface EthicalReflections {
  significantConcerns?: string;
  competingValues?: string;
  tradeOffs?: string;
  unresolvedQuestions?: string;
  reviewerReasoning?: string;
}

export type EvidenceType =
  | 'Vendor Documentation'
  | 'Independent Audit'
  | 'Internal Test'
  | 'User Feedback'
  | 'Self-Attestation'
  | 'Other';

export type VerificationStatus =
  | 'Verified'
  | 'Unverified Claim'
  | 'Partially Verified';

export interface EvidenceItem {
  id: string;
  criterionId?: string;
  description: string;
  sourceOrReference: string;
  evidenceType: EvidenceType;
  verificationStatus: VerificationStatus;
  limitationsOrUncertainty?: string;
}

export interface HumanDecision {
  concludedLevel: RecommendationLevel;
  rationale: string;
  deviationJustification?: string;
  decidedAt?: string;
}

export interface Review {
  id: string;
  frameworkId: string;
  title: string;
  description: string;
  aiSystem: string;
  purpose: string;
  context: string;
  stakeholders: string[];
  reviewer: string;
  reviewDate: string; // ISO Date String
  scores: Record<string, number>; // criterionId -> score
  notes: Record<string, string>; // criterionId -> note
  scoreExplanation?: ScoreExplanation;
  overallRecommendation?: RecommendationLevel;
  triggeredRules?: Rule[];
  appliedSafeguards?: Safeguard[];
  status: 'draft' | 'completed';
  stakeholderImpacts?: StakeholderImpact[];
  ethicalReflections?: EthicalReflections;
  evidenceItems?: EvidenceItem[];
  humanDecision?: HumanDecision;
  selectedSafeguardIds?: string[];
  isRevisionOf?: string;
}

export interface AppState {
  frameworks: Framework[];
  activeFrameworkId: string;
  reviews: Review[];
  
  // Actions
  setActiveFrameworkId: (id: string) => void;
  
  // Framework Actions
  addFramework: (framework: Framework) => void;
  updateFramework: (id: string, updates: Partial<Framework>) => void;
  deleteFramework: (id: string) => void;
  duplicateFramework: (id: string, newName: string) => void;
  
  // Review Actions
  addReview: (review: Review) => void;
  updateReview: (id: string, updates: Partial<Review>) => void;
  deleteReview: (id: string) => void;
  duplicateReview: (id: string) => void;
  
  // Import / Export (can be handled by standard JSON serialize/deserialize, but useful for full reset)
  resetToDefaults: () => void;
  importData: (data: Partial<AppState>) => void;
}
