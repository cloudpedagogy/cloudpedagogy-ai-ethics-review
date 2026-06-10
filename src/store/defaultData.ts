import type { Framework } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

const generateId = () => uuidv4();

const defaultScoringScale = {
  type: 'numeric' as const,
  min: 0,
  max: 3,
  labels: {
    0: 'Unacceptable / High Risk',
    1: 'Needs Improvement / Moderate Risk',
    2: 'Acceptable / Low Risk',
    3: 'Excellent / No Risk',
  },
};

export const defaultFrameworks: Framework[] = [
  {
    id: 'default-framework',
    name: 'Default Ethics Framework',
    description: 'Standard ethics framework suitable for general AI applications.',
    isDefault: true,
    thresholds: [
      { id: generateId(), minScore: 0, maxScore: 25, recommendation: 'Critical Risk' },
      { id: generateId(), minScore: 26, maxScore: 50, recommendation: 'High Risk' },
      { id: generateId(), minScore: 51, maxScore: 75, recommendation: 'Moderate Risk' },
      { id: generateId(), minScore: 76, maxScore: 100, recommendation: 'Low Risk' }, // Percentage based calculation will be used
    ],
    criteria: [
      {
        id: 'crit-human-oversight',
        title: 'Human Oversight',
        description: 'Degree to which humans remain in control of the AI system and its decisions.',
        weight: 5,
        scoringScale: defaultScoringScale,
        guidanceNotes: 'Consider if there is a human-in-the-loop and if they have real authority to override the AI.',
        category: 'Governance',
        displayOrder: 1,
      },
      {
        id: 'crit-privacy',
        title: 'Privacy',
        description: 'Protection of personal data and confidentiality.',
        weight: 5,
        scoringScale: defaultScoringScale,
        guidanceNotes: 'Assess the use of PII, sensitive data, and data minimization practices.',
        category: 'Data',
        displayOrder: 2,
      },
      {
        id: 'crit-transparency',
        title: 'Transparency',
        description: 'Visibility and explainability of the AI system to its users.',
        weight: 4,
        scoringScale: defaultScoringScale,
        guidanceNotes: 'Are users aware they are interacting with AI? Can the decisions be explained?',
        category: 'Operations',
        displayOrder: 3,
      },
      {
        id: 'crit-equity-fairness',
        title: 'Equity and Fairness',
        description: 'Prevention of bias, exclusion, and differential impact.',
        weight: 5,
        scoringScale: defaultScoringScale,
        guidanceNotes: 'Evaluate potential biases in training data or system outcomes affecting protected groups.',
        category: 'Impact',
        displayOrder: 4,
      },
      {
        id: 'crit-accessibility',
        title: 'Accessibility',
        description: 'Absence of accessibility barriers and use of inclusive design.',
        weight: 3,
        scoringScale: defaultScoringScale,
        guidanceNotes: 'Does the system meet WCAG standards where applicable?',
        category: 'Operations',
        displayOrder: 5,
      },
      {
        id: 'crit-accountability',
        title: 'Accountability',
        description: 'Clear ownership, governance, and responsibility.',
        weight: 4,
        scoringScale: defaultScoringScale,
        guidanceNotes: 'Is it clear who is responsible if the AI system causes harm?',
        category: 'Governance',
        displayOrder: 6,
      },
    ],
    rules: [
      {
        id: 'rule-critical-privacy',
        description: 'Critical privacy risk: Low privacy score and high consequence.',
        outcomeLevel: 'Critical Risk',
        conditionGroup: {
          id: generateId(),
          logic: 'AND',
          conditions: [
            {
              id: generateId(),
              field: 'crit-privacy',
              operator: 'lessThan',
              value: 2,
            },
          ],
        },
      },
    ],
    safeguards: [
      { id: generateId(), title: 'Human Review Required', description: 'All outputs must be reviewed by a qualified human.' },
      { id: generateId(), title: 'Data Minimization', description: 'Ensure only strictly necessary data is processed.' },
      { id: generateId(), title: 'Student Disclosure', description: 'Clearly disclose to students that AI is being used.' },
      { id: generateId(), title: 'Bias Monitoring', description: 'Implement regular audits for algorithmic bias.' },
    ],
  },
  {
    id: 'higher-ed-framework',
    name: 'Higher Education Framework',
    description: 'Specialized framework for academic and student-facing AI applications.',
    isDefault: false,
    thresholds: [
      { id: generateId(), minScore: 0, maxScore: 30, recommendation: 'Critical Risk' },
      { id: generateId(), minScore: 31, maxScore: 60, recommendation: 'High Risk' },
      { id: generateId(), minScore: 61, maxScore: 80, recommendation: 'Moderate Risk' },
      { id: generateId(), minScore: 81, maxScore: 100, recommendation: 'Low Risk' },
    ],
    criteria: [
      {
        id: 'crit-academic-integrity',
        title: 'Academic Integrity',
        description: 'Impact on authenticity of student work and assessment validity.',
        weight: 5,
        scoringScale: defaultScoringScale,
        guidanceNotes: 'Does this system compromise the ability to verify student authorship?',
        category: 'Academic',
        displayOrder: 1,
      },
      {
        id: 'crit-educational-consequences',
        title: 'Consequence Severity',
        description: 'Potential impact of errors on a student’s educational trajectory.',
        weight: 5,
        scoringScale: defaultScoringScale,
        guidanceNotes: 'Could an error result in unfair grading, exclusion, or academic penalty?',
        category: 'Academic',
        displayOrder: 2,
      },
      {
        id: 'crit-he-human-oversight',
        title: 'Human Oversight',
        description: 'Educator control over AI decisions.',
        weight: 4,
        scoringScale: defaultScoringScale,
        guidanceNotes: 'Does an academic staff member maintain final authority?',
        category: 'Governance',
        displayOrder: 3,
      },
    ],
    rules: [
      {
        id: 'rule-grading-impact',
        description: 'High risk if academic integrity is compromised.',
        outcomeLevel: 'Critical Risk',
        conditionGroup: {
          id: generateId(),
          logic: 'AND',
          conditions: [
            {
              id: generateId(),
              field: 'crit-academic-integrity',
              operator: 'lessThan',
              value: 2,
            },
          ],
        },
      },
    ],
    safeguards: [
      { id: generateId(), title: 'Appeal Process', description: 'Provide a clear channel for students to appeal AI-assisted decisions.' },
      { id: generateId(), title: 'Alternative Assessment', description: 'Provide non-AI alternative assessments.' },
    ],
  }
];
