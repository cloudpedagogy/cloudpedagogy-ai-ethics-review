
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';
import { Printer } from 'lucide-react';
import type { RecommendationLevel } from '../models/types';

export function ReviewReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const review = useStore((state) => state.reviews.find((r) => r.id === id));
  const framework = useStore((state) => state.frameworks.find((f) => f.id === review?.frameworkId));

  if (!review || !framework) {
    return <div>Review not found.</div>;
  }

  const handlePrint = () => {
    window.print();
  };

  const getRiskColor = (level?: RecommendationLevel) => {
    switch (level) {
      case 'Critical Risk': return 'bg-slate-800 text-white';
      case 'High Risk': return 'bg-slate-600 text-white';
      case 'Moderate Risk': return 'bg-slate-400 text-slate-900';
      case 'Low Risk': return 'bg-slate-200 text-slate-900';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 print:space-y-6">
      <div className="flex justify-between items-start print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Ethics Review Report</h1>
          <p className="text-sm text-slate-500">Completed on {format(new Date(review.reviewDate), 'PPP')}</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="secondary" onClick={() => navigate('/reviews')}>Back</Button>
          <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Print PDF</Button>
        </div>
      </div>

      <div className="hidden print:block mb-8">
        <h1 className="text-3xl font-bold text-slate-900 border-b-2 border-slate-900 pb-2">AI Ethics Review Report</h1>
        <p className="text-sm text-slate-600 mt-2">Date: {format(new Date(review.reviewDate), 'PPP')}</p>
        <p className="text-sm text-slate-600">Framework: {framework.name}</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div><strong className="text-slate-900">Title:</strong> {review.title}</div>
              <div><strong className="text-slate-900">AI System:</strong> {review.aiSystem}</div>
              <div><strong className="text-slate-900">Reviewer:</strong> {review.reviewer}</div>
              <div>
                <strong className="block text-slate-900 mb-1">Description:</strong>
                <p className="text-slate-600">{review.description}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendation Rationale (Explainability)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Score Breakdown */}
              <div>
                <h4 className="font-semibold text-slate-900 mb-3 border-b border-slate-200 pb-1">Score Contribution</h4>
                <div className="space-y-3">
                  {review.scoreExplanation?.criterionContributions.map(cc => {
                    const crit = framework.criteria.find(c => c.id === cc.criterionId);
                    if (!crit) return null;
                    return (
                      <div key={cc.criterionId} className="flex justify-between items-start text-sm">
                        <div className="w-2/3">
                          <div className="font-medium text-slate-800">{crit.title}</div>
                          <div className="text-slate-500 text-xs">Score: {cc.score} | Weight: {cc.weight}</div>
                          {review.notes[crit.id] && (
                            <div className="mt-1 text-slate-600 italic">"{review.notes[crit.id]}"</div>
                          )}
                        </div>
                        <div className="w-1/3 text-right font-medium text-slate-900">
                          +{cc.contribution} pts
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex justify-between pt-3 border-t border-slate-200 font-bold text-slate-900">
                    <span>Total Score</span>
                    <span>{review.scoreExplanation?.totalScore} / {review.scoreExplanation?.maxPossibleScore}</span>
                  </div>
                </div>
              </div>

              {/* Triggered Rules */}
              {review.triggeredRules && review.triggeredRules.length > 0 && (
                <div>
                  <h4 className="font-semibold text-slate-900 mb-3 border-b border-slate-200 pb-1 text-red-700">Triggered Red Flag Rules</h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-slate-800">
                    {review.triggeredRules.map(rule => (
                      <li key={rule.id}>
                        <strong>{rule.outcomeLevel}:</strong> {rule.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-slate-300 bg-slate-50">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Final Recommendation</div>
                <div className={`inline-flex items-center justify-center px-4 py-2 rounded-md font-bold text-lg ${getRiskColor(review.overallRecommendation)}`}>
                  {review.overallRecommendation}
                </div>
                
                <div className="mt-6 text-left">
                  <h4 className="font-semibold text-sm text-slate-900 mb-2">Required Safeguards:</h4>
                  <ul className="text-sm space-y-2 text-slate-700">
                    {review.appliedSafeguards?.map(sg => (
                      <li key={sg.id} className="flex items-start">
                        <span className="mr-2 mt-0.5">•</span>
                        <span>{sg.title}</span>
                      </li>
                    ))}
                    {(!review.appliedSafeguards || review.appliedSafeguards.length === 0) && (
                      <li className="text-slate-500 italic">None required based on this framework.</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
