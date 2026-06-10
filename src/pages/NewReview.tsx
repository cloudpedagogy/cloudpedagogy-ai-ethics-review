import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/Card';
import type { Review, RecommendationLevel, ScoreExplanation } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

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

  if (!framework) return <div>No active framework selected.</div>;

  const handleNext = () => setStep(step + 1);
  const handleBack = () => setStep(step - 1);

  const handleSubmit = () => {
    // 1. Calculate Score
    let totalScore = 0;
    let maxPossibleScore = 0;
    const criterionContributions = framework.criteria.map((crit) => {
      const score = scores[crit.id] || 0;
      const contribution = score * crit.weight;
      totalScore += contribution;
      maxPossibleScore += crit.scoringScale.max * crit.weight;
      return { criterionId: crit.id, score, weight: crit.weight, contribution };
    });

    const scoreExplanation: ScoreExplanation = {
      totalScore,
      maxPossibleScore,
      criterionContributions,
    };

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;

    // 2. Apply Thresholds (Fallback)
    let recommendation: RecommendationLevel = 'Moderate Risk';
    for (const threshold of framework.thresholds.sort((a, b) => b.minScore - a.minScore)) {
      if (percentage >= threshold.minScore && percentage <= threshold.maxScore) {
        recommendation = threshold.recommendation;
        break;
      }
    }

    // 3. Apply Rules (Overrides)
    // Simplified rule engine for MVP
    const triggeredRules = framework.rules.filter((rule) => {
      // Evaluate condition group (assuming AND for root level for now)
      if (rule.conditionGroup.logic === 'AND') {
        return rule.conditionGroup.conditions.every((cond) => {
          if (cond.field.startsWith('crit-')) {
            const val = scores[cond.field] || 0;
            if (cond.operator === 'lessThan') return val < cond.value;
            if (cond.operator === 'greaterThan') return val > cond.value;
            if (cond.operator === 'equals') return val === cond.value;
          }
          return false;
        });
      }
      return false;
    });

    if (triggeredRules.length > 0) {
      // Find the most severe outcome
      const severityOrder: Record<RecommendationLevel, number> = {
        'Low Risk': 1,
        'Moderate Risk': 2,
        'High Risk': 3,
        'Critical Risk': 4,
      };
      
      triggeredRules.forEach(rule => {
        if (severityOrder[rule.outcomeLevel] > severityOrder[recommendation]) {
          recommendation = rule.outcomeLevel;
        }
      });
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
      scoreExplanation,
      overallRecommendation: recommendation,
      triggeredRules,
      appliedSafeguards: framework.safeguards, // Apply all for MVP
      status: 'completed',
    };

    addReview(review);
    navigate(`/reviews/${review.id}`);
  };

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
          {framework.criteria.map((crit) => (
            <Card key={crit.id}>
              <CardHeader>
                <CardTitle>{crit.title}</CardTitle>
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
                    className="input-field"
                    value={scores[crit.id] || ''}
                    onChange={(e) => setScores({...scores, [crit.id]: parseInt(e.target.value, 10)})}
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
          ))}

          <div className="flex justify-between">
            <Button variant="secondary" onClick={handleBack}>Back</Button>
            <Button onClick={handleSubmit}>Complete Review & Generate Report</Button>
          </div>
        </div>
      )}
    </div>
  );
}
