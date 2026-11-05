import { useState, useId } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import type {
  Review,
  StakeholderImpact,
  EvidenceItem,
  EthicalReflections,
  HumanDecision,
  RecommendationLevel,
  EvidenceType,
  VerificationStatus,
  FrameworkSnapshot,
} from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import { AlertTriangle, Plus, Trash2, CheckCircle2, Bookmark, ArrowRight, ArrowLeft, Shield } from 'lucide-react';
import { evaluateAssessment, validateReviewCompletion } from '../utils/assessmentEngine';

const EVIDENCE_TYPES: EvidenceType[] = [
  'Vendor Documentation',
  'Independent Audit',
  'Internal Test',
  'User Feedback',
  'Self-Attestation',
  'Other',
];

const VERIFICATION_STATUSES: VerificationStatus[] = [
  'Verified',
  'Unverified Claim',
  'Partially Verified',
];

const RECOMMENDATION_LEVELS: RecommendationLevel[] = [
  'Low Risk',
  'Moderate Risk',
  'High Risk',
  'Critical Risk',
];

export function NewReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const uniqueIdPrefix = useId();
  const { frameworks, activeFrameworkId, reviews, addReview, updateReview } = useStore();

  const existingReview = id ? reviews.find((r) => r.id === id) : undefined;
  const frameworkId = existingReview ? existingReview.frameworkId : activeFrameworkId;
  const framework = frameworks.find((f) => f.id === frameworkId);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: existingReview?.title || '',
    description: existingReview?.description || '',
    aiSystem: existingReview?.aiSystem || '',
    purpose: existingReview?.purpose || '',
    context: existingReview?.context || '',
    reviewer: existingReview?.reviewer || 'Current Reviewer',
  });

  const [stakeholderImpacts, setStakeholderImpacts] = useState<StakeholderImpact[]>(
    existingReview?.stakeholderImpacts || [
      {
        id: uuidv4(),
        group: 'Students / Learners',
        benefits: '',
        concernsOrHarms: '',
        affectedInterests: 'Academic progress, fairness, privacy',
      },
    ]
  );

  const [scores, setScores] = useState<Record<string, number>>(existingReview?.scores || {});
  const [notes, setNotes] = useState<Record<string, string>>(existingReview?.notes || {});

  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>(
    existingReview?.evidenceItems || []
  );

  const [reflections, setReflections] = useState<EthicalReflections>(
    existingReview?.ethicalReflections || {
      significantConcerns: '',
      competingValues: '',
      tradeOffs: '',
      unresolvedQuestions: '',
      reviewerReasoning: '',
    }
  );

  const [humanDecision, setHumanDecision] = useState<HumanDecision>(
    existingReview?.humanDecision || {
      concludedLevel: existingReview?.overallRecommendation || 'Moderate Risk',
      rationale: '',
      deviationJustification: '',
    }
  );

  const [selectedSafeguardIds, setSelectedSafeguardIds] = useState<string[]>(
    existingReview?.selectedSafeguardIds ||
      (existingReview?.appliedSafeguards ? existingReview.appliedSafeguards.map((s) => s.id) : [])
  );

  const [submissionAttempted, setSubmissionAttempted] = useState(false);
  const [draftNotice, setDraftNotice] = useState(false);

  if (!framework) {
    return (
      <div className="space-y-4">
        <p className="text-slate-700">No framework found for this review.</p>
        <Button variant="secondary" onClick={() => navigate('/frameworks')}>
          Select a Framework
        </Button>
      </div>
    );
  }

  const completionValidation = validateReviewCompletion(framework, scores);
  const currentEvaluation = evaluateAssessment(framework, scores);

  // Helper to sync stakeholders string array with stakeholderImpacts
  const currentStakeholderList = stakeholderImpacts
    .map((s) => s.group.trim())
    .filter(Boolean);

  const handleAddStakeholder = () => {
    setStakeholderImpacts([
      ...stakeholderImpacts,
      {
        id: uuidv4(),
        group: '',
        benefits: '',
        concernsOrHarms: '',
        affectedInterests: '',
      },
    ]);
  };

  const handleRemoveStakeholder = (idToRemove: string) => {
    setStakeholderImpacts(stakeholderImpacts.filter((s) => s.id !== idToRemove));
  };

  const handleUpdateStakeholder = (idToUpdate: string, updates: Partial<StakeholderImpact>) => {
    setStakeholderImpacts(
      stakeholderImpacts.map((s) => (s.id === idToUpdate ? { ...s, ...updates } : s))
    );
  };

  const handleAddEvidence = () => {
    setEvidenceItems([
      ...evidenceItems,
      {
        id: uuidv4(),
        description: '',
        sourceOrReference: '',
        evidenceType: 'Internal Test',
        verificationStatus: 'Unverified Claim',
        limitationsOrUncertainty: '',
      },
    ]);
  };

  const handleRemoveEvidence = (idToRemove: string) => {
    setEvidenceItems(evidenceItems.filter((e) => e.id !== idToRemove));
  };

  const handleUpdateEvidence = (idToUpdate: string, updates: Partial<EvidenceItem>) => {
    setEvidenceItems(
      evidenceItems.map((e) => (e.id === idToUpdate ? { ...e, ...updates } : e))
    );
  };

  const handleToggleSafeguard = (sgId: string) => {
    if (selectedSafeguardIds.includes(sgId)) {
      setSelectedSafeguardIds(selectedSafeguardIds.filter((id) => id !== sgId));
    } else {
      setSelectedSafeguardIds([...selectedSafeguardIds, sgId]);
    }
  };

  const saveReviewToStore = (status: 'draft' | 'completed') => {
    const isCompleted = status === 'completed';
    const finalSafeguards = framework.safeguards.filter((sg) =>
      selectedSafeguardIds.includes(sg.id)
    );

    const frameworkSnapshot: FrameworkSnapshot | undefined = isCompleted
      ? {
          id: framework.id,
          name: framework.name,
          description: framework.description,
          criteria: JSON.parse(JSON.stringify(framework.criteria)),
          thresholds: JSON.parse(JSON.stringify(framework.thresholds)),
          rules: JSON.parse(JSON.stringify(framework.rules)),
          safeguards: JSON.parse(JSON.stringify(framework.safeguards)),
          capturedAt: new Date().toISOString(),
        }
      : existingReview?.frameworkSnapshot;

    const reviewPayload: Review = {
      id: existingReview ? existingReview.id : uuidv4(),
      frameworkId: framework.id,
      title: formData.title.trim() || 'Untitled Ethics Review',
      description: formData.description.trim(),
      aiSystem: formData.aiSystem.trim(),
      purpose: formData.purpose.trim(),
      context: formData.context.trim(),
      stakeholders: currentStakeholderList,
      reviewer: formData.reviewer.trim() || 'Reviewer',
      reviewDate: existingReview?.reviewDate || new Date().toISOString(),
      scores,
      notes,
      scoreExplanation: isCompleted ? currentEvaluation.scoreExplanation ?? undefined : undefined,
      overallRecommendation: isCompleted ? currentEvaluation.overallRecommendation ?? undefined : undefined,
      triggeredRules: isCompleted ? currentEvaluation.triggeredRules : [],
      appliedSafeguards: finalSafeguards,
      status,
      stakeholderImpacts,
      ethicalReflections: reflections,
      evidenceItems,
      humanDecision: {
        ...humanDecision,
        decidedAt: isCompleted ? new Date().toISOString() : undefined,
      },
      selectedSafeguardIds,
      frameworkSnapshot,
    };

    if (existingReview) {
      updateReview(existingReview.id, reviewPayload);
    } else {
      addReview(reviewPayload);
    }

    return reviewPayload;
  };

  const handleSaveDraft = () => {
    saveReviewToStore('draft');
    setDraftNotice(true);
    setTimeout(() => {
      setDraftNotice(false);
      navigate('/reviews');
    }, 1200);
  };

  const handleFinalSubmit = () => {
    setSubmissionAttempted(true);

    if (!formData.title.trim()) {
      alert('Review Title is required to finalise the assessment.');
      setStep(1);
      return;
    }

    if (!currentEvaluation.isComplete) {
      alert('All criteria must be evaluated before completing the assessment.');
      setStep(2);
      return;
    }

    // Validate deviation explanation if human decision differs from calculated recommendation
    const calculatedRec = currentEvaluation.overallRecommendation;
    if (
      calculatedRec &&
      humanDecision.concludedLevel !== calculatedRec &&
      !humanDecision.deviationJustification?.trim()
    ) {
      alert(
        `Your human conclusion ("${humanDecision.concludedLevel}") differs from the calculated decision-support recommendation ("${calculatedRec}").\n\nPlease provide a deviation justification.`
      );
      return;
    }

    if (!humanDecision.rationale.trim()) {
      alert('Please provide a final human decision rationale explaining your conclusion.');
      return;
    }

    const saved = saveReviewToStore('completed');
    navigate(`/reviews/${saved.id}`);
  };

  const missingCriteriaNames = framework.criteria
    .filter((c) => completionValidation.missingCriterionIds.includes(c.id))
    .map((c) => c.title);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {existingReview ? `Edit Review: ${existingReview.title}` : 'New Ethics Review'}
          </h1>
          <p className="text-sm text-slate-500">
            Framework: <strong>{framework.name}</strong> • Step {step} of 3
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={handleSaveDraft}>
            <Bookmark className="mr-2 h-4 w-4" /> Save as Draft
          </Button>
          {draftNotice && (
            <span className="text-sm text-green-700 font-medium flex items-center">
              <CheckCircle2 className="h-4 w-4 mr-1" /> Draft Saved
            </span>
          )}
        </div>
      </div>

      {/* Step Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setStep(1)}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            step === 1
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          1. System & Stakeholders
        </button>
        <button
          onClick={() => setStep(2)}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            step === 2
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          2. Ethics Criteria & Evidence
        </button>
        <button
          onClick={() => setStep(3)}
          className={`pb-3 px-4 text-sm font-medium border-b-2 transition-colors ${
            step === 3
              ? 'border-slate-900 text-slate-900 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          3. Deliberation & Decision
        </button>
      </div>

      {/* STEP 1: SYSTEM & STAKEHOLDERS */}
      {step === 1 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI System Context & Intended Use</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor={`${uniqueIdPrefix}-review-title`} className="label-text mb-2 block font-medium">Review Title *</label>
                  <input
                    id={`${uniqueIdPrefix}-review-title`}
                    className="input-field"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Admissions AI Screening Assistant Review"
                  />
                </div>
                <div>
                  <label htmlFor={`${uniqueIdPrefix}-ai-system`} className="label-text mb-2 block font-medium">AI System / Model Identifier</label>
                  <input
                    id={`${uniqueIdPrefix}-ai-system`}
                    className="input-field"
                    value={formData.aiSystem}
                    onChange={(e) => setFormData({ ...formData, aiSystem: e.target.value })}
                    placeholder="e.g., Claude 3.5 Sonnet, Custom In-House RAG Pipeline"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={`${uniqueIdPrefix}-reviewer-identity`} className="label-text mb-2 block font-medium">Reviewer / Review Committee</label>
                <input
                  id={`${uniqueIdPrefix}-reviewer-identity`}
                  className="input-field"
                  value={formData.reviewer}
                  onChange={(e) => setFormData({ ...formData, reviewer: e.target.value })}
                  placeholder="e.g., Academic Ethics Sub-Committee, Dr. Jane Doe"
                />
              </div>

              <div>
                <label htmlFor={`${uniqueIdPrefix}-intended-purpose`} className="label-text mb-2 block font-medium">Intended Purpose & Operational Goals</label>
                <textarea
                  id={`${uniqueIdPrefix}-intended-purpose`}
                  className="input-field min-h-[80px]"
                  value={formData.purpose}
                  onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                  placeholder="What is this AI system designed to accomplish? What problem does it solve?"
                />
              </div>

              <div>
                <label htmlFor={`${uniqueIdPrefix}-deployment-context`} className="label-text mb-2 block font-medium">Deployment Context & Institutional Environment</label>
                <textarea
                  id={`${uniqueIdPrefix}-deployment-context`}
                  className="input-field min-h-[80px]"
                  value={formData.context}
                  onChange={(e) => setFormData({ ...formData, context: e.target.value })}
                  placeholder="Where will it be deployed? Who are the operators? What authority does it carry?"
                />
              </div>

              <div>
                <label htmlFor={`${uniqueIdPrefix}-system-description`} className="label-text mb-2 block font-medium">System Overview & Workflow Description</label>
                <textarea
                  id={`${uniqueIdPrefix}-system-description`}
                  className="input-field min-h-[80px]"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Briefly describe the end-to-end data flow and human checkpoints..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Stakeholder Impact Mapping */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Stakeholder Impact Mapping</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Identify affected groups and evaluate potential benefits, harms, and protected interests.
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={handleAddStakeholder}>
                <Plus className="mr-2 h-4 w-4" /> Add Stakeholder
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {stakeholderImpacts.map((sh, idx) => (
                <div key={sh.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-600">Stakeholder #{idx + 1}</span>
                    {stakeholderImpacts.length > 1 && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveStakeholder(sh.id)}
                        className="text-red-500 hover:text-red-700 h-6 px-2"
                        title="Remove"
                        aria-label="Remove stakeholder"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-600 font-medium block mb-1">Stakeholder Group / Cohort</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        value={sh.group}
                        onChange={(e) => handleUpdateStakeholder(sh.id, { group: e.target.value })}
                        placeholder="e.g., Undergraduate Students, Marginalized Cohorts"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 font-medium block mb-1">Affected Interests & Rights</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        value={sh.affectedInterests || ''}
                        onChange={(e) => handleUpdateStakeholder(sh.id, { affectedInterests: e.target.value })}
                        placeholder="e.g., Fair grading, confidentiality, accessible access"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-600 font-medium block mb-1">Anticipated Benefits</label>
                      <textarea
                        className="input-field min-h-[60px] text-sm"
                        value={sh.benefits || ''}
                        onChange={(e) => handleUpdateStakeholder(sh.id, { benefits: e.target.value })}
                        placeholder="Positive educational, efficiency, or support outcomes..."
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 font-medium block mb-1">Potential Harms or Concerns</label>
                      <textarea
                        className="input-field min-h-[60px] text-sm"
                        value={sh.concernsOrHarms || ''}
                        onChange={(e) => handleUpdateStakeholder(sh.id, { concernsOrHarms: e.target.value })}
                        placeholder="Risk of bias, surveillance, academic penalty, exclusion..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="secondary" onClick={handleSaveDraft}>
                Save Progress
              </Button>
              <Button onClick={() => setStep(2)}>
                Next: Ethics Criteria <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* STEP 2: CRITERIA & EVIDENCE */}
      {step === 2 && (
        <div className="space-y-6">
          {submissionAttempted && !completionValidation.isValid && (
            <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              <div className="font-semibold flex items-center mb-1">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Assessment Incomplete
              </div>
              <p>Every criterion must be evaluated before finalizing. Missing criteria:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {missingCriteriaNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="space-y-4">
            {framework.criteria.map((crit) => {
              const isMissing =
                submissionAttempted && completionValidation.missingCriterionIds.includes(crit.id);
              const currentScore = scores[crit.id];
              const hasValidScore = currentScore !== undefined && currentScore !== null;

              return (
                <Card
                  key={crit.id}
                  className={isMissing ? 'border-red-300 ring-1 ring-red-300' : ''}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <CardTitle>{crit.title}</CardTitle>
                          {crit.category && (
                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                              {crit.category}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-500 mt-1">{crit.description}</p>
                        {crit.guidanceNotes && (
                          <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600">
                            <strong>Guidance:</strong> {crit.guidanceNotes}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold uppercase text-slate-500">
                          Weight: {crit.weight}
                        </span>
                        {isMissing && (
                          <div className="text-xs text-red-600 font-medium mt-1">Score required</div>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label htmlFor={`${uniqueIdPrefix}-score-${crit.id}`} className="label-text mb-2 block font-medium">
                        Rating Scale ({crit.scoringScale.min} to {crit.scoringScale.max}) *
                      </label>
                      <select
                        id={`${uniqueIdPrefix}-score-${crit.id}`}
                        className={`input-field ${isMissing ? 'border-red-500 focus:ring-red-500' : ''}`}
                        value={hasValidScore ? currentScore : ''}
                        onChange={(e) => {
                          const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                          if (val !== undefined && !isNaN(val)) {
                            setScores({ ...scores, [crit.id]: val });
                          } else {
                            const updated = { ...scores };
                            delete updated[crit.id];
                            setScores(updated);
                          }
                        }}
                      >
                        <option value="" disabled>Select a score...</option>
                        {Array.from({ length: crit.scoringScale.max - crit.scoringScale.min + 1 }).map((_, i) => {
                          const val = crit.scoringScale.min + i;
                          const label = crit.scoringScale.labels?.[val];
                          return (
                            <option key={val} value={val}>
                              {val} {label ? `- ${label}` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div>
                      <label htmlFor={`${uniqueIdPrefix}-notes-${crit.id}`} className="label-text mb-2 block font-medium">
                        Notes & Justification
                      </label>
                      <textarea
                        id={`${uniqueIdPrefix}-notes-${crit.id}`}
                        className="input-field min-h-[70px] text-sm"
                        value={notes[crit.id] || ''}
                        onChange={(e) => setNotes({ ...notes, [crit.id]: e.target.value })}
                        placeholder="Document the concrete rationale, observations, or system features justifying this rating..."
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Supporting Evidence Register */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Supporting Evidence & Uncertainty</CardTitle>
                <p className="text-sm text-slate-500 mt-1">
                  Record references, audit findings, test results, or known uncertainty limitations.
                </p>
              </div>
              <Button size="sm" variant="secondary" onClick={handleAddEvidence}>
                <Plus className="mr-2 h-4 w-4" /> Add Evidence Item
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {evidenceItems.map((ev, idx) => (
                <div key={ev.id} className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-slate-600">Evidence #{idx + 1}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveEvidence(ev.id)}
                      className="text-red-500 hover:text-red-700 h-6 px-2"
                      title="Remove"
                      aria-label="Remove evidence"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-6">
                      <label className="text-xs text-slate-600 font-medium block mb-1">Evidence Description</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        value={ev.description}
                        onChange={(e) => handleUpdateEvidence(ev.id, { description: e.target.value })}
                        placeholder="e.g., Disparate impact evaluation across demographic groups"
                      />
                    </div>
                    <div className="sm:col-span-6">
                      <label className="text-xs text-slate-600 font-medium block mb-1">Source / Reference</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        value={ev.sourceOrReference}
                        onChange={(e) => handleUpdateEvidence(ev.id, { sourceOrReference: e.target.value })}
                        placeholder="e.g., Institutional Data Lab Audit Report v1.2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-600 font-medium block mb-1">Evidence Type</label>
                      <select
                        className="input-field text-sm"
                        value={ev.evidenceType}
                        onChange={(e) =>
                          handleUpdateEvidence(ev.id, {
                            evidenceType: e.target.value as EvidenceType,
                          })
                        }
                      >
                        {EVIDENCE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-600 font-medium block mb-1">Verification Status</label>
                      <select
                        className="input-field text-sm"
                        value={ev.verificationStatus}
                        onChange={(e) =>
                          handleUpdateEvidence(ev.id, {
                            verificationStatus: e.target.value as VerificationStatus,
                          })
                        }
                      >
                        {VERIFICATION_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-slate-600 font-medium block mb-1">Limitations & Known Uncertainty</label>
                    <textarea
                      className="input-field min-h-[50px] text-sm"
                      value={ev.limitationsOrUncertainty || ''}
                      onChange={(e) => handleUpdateEvidence(ev.id, { limitationsOrUncertainty: e.target.value })}
                      placeholder="Note sample size limits, lack of real-world testing, vendor self-reporting bias..."
                    />
                  </div>
                </div>
              ))}

              {evidenceItems.length === 0 && (
                <div className="text-center py-6 text-slate-500 bg-white rounded-lg border border-dashed border-slate-300 text-sm">
                  No evidence entries recorded yet. Adding verified references strengthens ethical defensibility.
                </div>
              )}
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="secondary" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to System Info
              </Button>
              <div className="flex space-x-2">
                <Button variant="secondary" onClick={handleSaveDraft}>
                  Save Draft
                </Button>
                <Button onClick={() => setStep(3)}>
                  Next: Deliberation & Decision <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}

      {/* STEP 3: DELIBERATION, HUMAN DECISION & SAFEGUARDS */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Decision-Support Output Display */}
          <Card className="border-slate-300 bg-slate-50">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-slate-700" />
                <CardTitle className="text-base text-slate-900">
                  Automated Decision-Support Assessment
                </CardTitle>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Advisory baseline computed from framework weights, thresholds, and non-compensatory red-flag rules.
              </p>
            </CardHeader>
            <CardContent>
              {currentEvaluation.isComplete ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Weighted Score</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {currentEvaluation.percentage?.toFixed(1)}%
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Threshold Baseline</span>
                    <div className="text-lg font-bold text-slate-800 mt-1">
                      {currentEvaluation.baselineRecommendation}
                    </div>
                  </div>
                  <div className="p-3 bg-white rounded-lg border border-slate-200">
                    <span className="text-xs text-slate-500 font-medium">Calculated Outcome</span>
                    <div className="text-lg font-bold text-slate-900 mt-1">
                      {currentEvaluation.overallRecommendation}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
                  <strong>Assessment Incomplete:</strong> Complete all criteria in Step 2 to generate the decision-support baseline calculation.
                </div>
              )}

              {currentEvaluation.triggeredRules.length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-900 text-xs">
                  <span className="font-bold">Triggered Red-Flag Rules ({currentEvaluation.triggeredRules.length}):</span>
                  <ul className="list-disc pl-4 mt-1 space-y-1">
                    {currentEvaluation.triggeredRules.map((r) => (
                      <li key={r.id}>
                        <strong>{r.outcomeLevel}:</strong> {r.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Structured Ethical Reflection & Trade-Offs */}
          <Card>
            <CardHeader>
              <CardTitle>Structured Ethical Reflections & Trade-Offs</CardTitle>
              <p className="text-sm text-slate-500">
                Document value tensions, competing principles, and trade-offs that cannot be resolved by scoring alone.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor={`${uniqueIdPrefix}-significant-concerns`} className="label-text mb-2 block font-medium">
                  Significant Ethical Concerns
                </label>
                <textarea
                  id={`${uniqueIdPrefix}-significant-concerns`}
                  className="input-field min-h-[70px] text-sm"
                  value={reflections.significantConcerns || ''}
                  onChange={(e) =>
                    setReflections({ ...reflections, significantConcerns: e.target.value })
                  }
                  placeholder="Identify any critical issues (e.g., student surveillance, opacity, automated penalty risks)..."
                />
              </div>

              <div>
                <label htmlFor={`${uniqueIdPrefix}-competing-values`} className="label-text mb-2 block font-medium">
                  Competing Values & Ethical Tensions
                </label>
                <textarea
                  id={`${uniqueIdPrefix}-competing-values`}
                  className="input-field min-h-[70px] text-sm"
                  value={reflections.competingValues || ''}
                  onChange={(e) =>
                    setReflections({ ...reflections, competingValues: e.target.value })
                  }
                  placeholder="e.g., Tension between assessment security/proctoring and student privacy/dignity..."
                />
              </div>

              <div>
                <label htmlFor={`${uniqueIdPrefix}-trade-offs`} className="label-text mb-2 block font-medium">
                  Proportionality & Justified Trade-Offs
                </label>
                <textarea
                  id={`${uniqueIdPrefix}-trade-offs`}
                  className="input-field min-h-[70px] text-sm"
                  value={reflections.tradeOffs || ''}
                  onChange={(e) =>
                    setReflections({ ...reflections, tradeOffs: e.target.value })
                  }
                  placeholder="Why is this trade-off proportionate and justifiable in this specific educational context?"
                />
              </div>

              <div>
                <label htmlFor={`${uniqueIdPrefix}-unresolved-questions`} className="label-text mb-2 block font-medium">
                  Unresolved Questions & Ongoing Monitoring Points
                </label>
                <textarea
                  id={`${uniqueIdPrefix}-unresolved-questions`}
                  className="input-field min-h-[70px] text-sm"
                  value={reflections.unresolvedQuestions || ''}
                  onChange={(e) =>
                    setReflections({ ...reflections, unresolvedQuestions: e.target.value })
                  }
                  placeholder="What requires post-deployment audit, user feedback, or ethics committee re-examination?"
                />
              </div>
            </CardContent>
          </Card>

          {/* Human Decision-Making */}
          <Card className="border-slate-300">
            <CardHeader>
              <CardTitle>Final Human Deliberation & Decision</CardTitle>
              <p className="text-sm text-slate-500">
                The algorithmic recommendation is advisory. Reviewers maintain final moral and institutional responsibility.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor={`${uniqueIdPrefix}-concluded-risk-level`} className="label-text mb-2 block font-medium">
                  Concluded Human Risk Level *
                </label>
                <select
                  id={`${uniqueIdPrefix}-concluded-risk-level`}
                  className="input-field"
                  value={humanDecision.concludedLevel}
                  onChange={(e) =>
                    setHumanDecision({
                      ...humanDecision,
                      concludedLevel: e.target.value as RecommendationLevel,
                    })
                  }
                >
                  {RECOMMENDATION_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>

              {/* Deviation Justification Warning if different from automated recommendation */}
              {currentEvaluation.overallRecommendation &&
                humanDecision.concludedLevel !== currentEvaluation.overallRecommendation && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                    <label htmlFor={`${uniqueIdPrefix}-deviation-justification`} className="text-xs font-semibold text-amber-900 flex items-center">
                      <AlertTriangle className="h-4 w-4 mr-1 text-amber-700" />
                      Override Justification Required (Concluded Level differs from Calculated{' '}
                      {currentEvaluation.overallRecommendation}) *
                    </label>
                    <textarea
                      id={`${uniqueIdPrefix}-deviation-justification`}
                      className="input-field min-h-[70px] text-sm bg-white"
                      value={humanDecision.deviationJustification || ''}
                      onChange={(e) =>
                        setHumanDecision({
                          ...humanDecision,
                          deviationJustification: e.target.value,
                        })
                      }
                      placeholder="Explain the qualitative contextual factors that warrant diverging from the advisory score..."
                    />
                  </div>
                )}

              <div>
                <label htmlFor={`${uniqueIdPrefix}-final-decision-rationale`} className="label-text mb-2 block font-medium">
                  Final Decision Rationale *
                </label>
                <textarea
                  id={`${uniqueIdPrefix}-final-decision-rationale`}
                  className="input-field min-h-[90px] text-sm"
                  value={humanDecision.rationale}
                  onChange={(e) =>
                    setHumanDecision({ ...humanDecision, rationale: e.target.value })
                  }
                  placeholder="Summarize the core ethical reasoning, risk posture, and conditions of deployment..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Recommended Safeguards Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Governance Safeguards</CardTitle>
              <p className="text-sm text-slate-500">
                Select which controls are prescribed for this system. Note: Selection indicates recommendation, not verified implementation.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {framework.safeguards.map((sg) => {
                  const isChecked = selectedSafeguardIds.includes(sg.id);
                  return (
                    <label
                      key={sg.id}
                      className={`flex items-start p-3 rounded-lg border cursor-pointer transition-colors ${
                        isChecked
                          ? 'border-slate-900 bg-slate-50'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleSafeguard(sg.id)}
                        className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900"
                      />
                      <div className="ml-3">
                        <div className="text-sm font-semibold text-slate-900">{sg.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{sg.description}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button variant="secondary" onClick={() => setStep(2)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Criteria
              </Button>
              <div className="flex space-x-2">
                <Button variant="secondary" onClick={handleSaveDraft}>
                  Save Draft
                </Button>
                <Button onClick={handleFinalSubmit}>
                  Complete & Finalise Review
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      )}
    </div>
  );
}
