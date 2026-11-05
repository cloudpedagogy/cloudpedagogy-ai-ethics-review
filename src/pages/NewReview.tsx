import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import type { Review } from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import { AlertTriangle } from 'lucide-react';
import { evaluateAssessment, validateReviewCompletion } from '../utils/assessmentEngine';

export function NewReview() {
  const { frameworks, activeFrameworkId, addReview } = useStore();
  const navigate = useNavigate();
  const framework = frameworks.find((f) => f.id === activeFrameworkId);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    aiSystem: '',
    purpose: '',
    context: '',
  });

  const [scores, setScores] = useState<Record<string, number>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [submissionAttempted, setSubmissionAttempted] = useState(false);

  if (!framework) return <div>No active framework selected.</div>;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const completionValidation = validateReviewCompletion(framework, scores);

  const handleSubmit = () => {
    setSubmissionAttempted(true);

    const evaluation = evaluateAssessment(framework, scores);
    if (!evaluation.isComplete || !evaluation.overallRecommendation || !evaluation.scoreExplanation) {
      return;
    }

    const review: Review = {
      id: uuidv4(),
      frameworkId: framework.id,
      title: formData.title,
      description: formData.description,
      aiSystem: formData.aiSystem,
      purpose: formData.purpose,
      context: formData.context,
      stakeholders: [],
      reviewer: 'Current User', // Auth not implemented
      reviewDate: new Date().toISOString(),
      scores,
      notes,
      scoreExplanation: evaluation.scoreExplanation,
      overallRecommendation: evaluation.overallRecommendation,
      triggeredRules: evaluation.triggeredRules,
      appliedSafeguards: framework.safeguards, // Apply all for MVP
      status: 'completed',
    };

    addReview(review);
    navigate(`/reviews/${review.id}`);
  };

  const missingCriteriaNames = framework.criteria
    .filter((c) => completionValidation.missingCriterionIds.includes(c.id))
    .map((c) => c.title);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900">New Ethics Review</h1>
        <p className="text-sm text-slate-500">Using Framework: <strong>{framework.name}</strong></p>
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="label-text mb-2 block">Review Title</label>
              <input 
                className="input-field" 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g., Spring 2026 AI Grading Assistant" 
              />
            </div>
            <div>
              <label className="label-text mb-2 block">AI System / Tool</label>
              <input 
                className="input-field" 
                value={formData.aiSystem} 
                onChange={(e) => setFormData({...formData, aiSystem: e.target.value})} 
                placeholder="e.g., ChatGPT 4.0, Custom Auto-Grader" 
              />
            </div>
            <div>
              <label className="label-text mb-2 block">Description</label>
              <textarea 
                className="input-field min-h-[100px]" 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                placeholder="Briefly describe the system and its intended use."
              />
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleNext} disabled={!formData.title}>Next: Ethics Assessment</Button>
          </CardFooter>
        </Card>
      )}

      {step === 2 && (
        <div className="space-y-6">
          {submissionAttempted && !completionValidation.isValid && (
            <div role="alert" className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
              <div className="font-semibold flex items-center mb-1">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Assessment Incomplete
              </div>
              <p>All criteria must be evaluated before completing the review. Missing criteria:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {missingCriteriaNames.map((name) => (
                  <li key={name}>{name}</li>
                ))}
              </ul>
            </div>
          )}

          {framework.criteria.map((crit) => {
            const isMissing = submissionAttempted && completionValidation.missingCriterionIds.includes(crit.id);
            const currentScore = scores[crit.id];
            const hasValidScore = currentScore !== undefined && currentScore !== null;

            return (
              <Card key={crit.id} className={isMissing ? 'border-red-300 ring-1 ring-red-300' : ''}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{crit.title}</CardTitle>
                    {isMissing && (
                      <span className="text-xs text-red-600 font-medium">Score required</span>
                    )}
                  </div>
                  <p className="text-sm text-slate-500">{crit.description}</p>
                  {crit.guidanceNotes && (
                    <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-md text-sm text-slate-600">
                      <strong>Guidance:</strong> {crit.guidanceNotes}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="label-text mb-2 block">Score (Weight: {crit.weight})</label>
                    <select 
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
                    <label className="label-text mb-2 block">Notes / Justification</label>
                    <textarea 
                      className="input-field min-h-[80px]" 
                      value={notes[crit.id] || ''}
                      onChange={(e) => setNotes({...notes, [crit.id]: e.target.value})}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}

          <div className="flex justify-between">
            <Button variant="secondary" onClick={handleBack}>Back</Button>
            <Button onClick={handleSubmit}>Complete Review & Generate Report</Button>
          </div>
        </div>
      )}
    </div>
  );
}
