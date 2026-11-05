import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';
import { Printer, Edit3, Copy, AlertTriangle, Shield, CheckCircle2, Info, Archive } from 'lucide-react';
import type { RecommendationLevel, Framework } from '../models/types';

export function ReviewReport() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reviews, frameworks, duplicateReview } = useStore();

  const review = reviews.find((r) => r.id === id);

  if (!review) {
    return (
      <div className="space-y-4">
        <p className="text-slate-700">Review not found.</p>
        <Button variant="secondary" onClick={() => navigate('/reviews')}>
          Back to Reviews
        </Button>
      </div>
    );
  }

  const liveFramework = frameworks.find((f) => f.id === review.frameworkId);
  const isSnapshot = !!review.frameworkSnapshot;

  // Resilient fallback when both snapshot and live framework are missing (e.g. legacy review whose framework was deleted)
  const fallbackFramework: Framework = {
    id: review.frameworkId,
    name: 'Historical Framework (Deleted)',
    description: 'The original framework definition is no longer available.',
    criteria: Object.entries(review.scores).map(([critId]) => {
      const contrib = review.scoreExplanation?.criterionContributions.find((c) => c.criterionId === critId);
      return {
        id: critId,
        title: critId,
        description: '',
        weight: contrib ? contrib.weight : 1,
        scoringScale: { type: 'numeric', min: 0, max: 4 },
        guidanceNotes: '',
        displayOrder: 0,
      };
    }),
    rules: review.triggeredRules || [],
    safeguards: review.appliedSafeguards || [],
    thresholds: [],
  };

  const framework = review.frameworkSnapshot || liveFramework || fallbackFramework;
  const isHistoricalFrameworkUnavailable = !review.frameworkSnapshot && !liveFramework;

  const isDraft = review.status === 'draft';

  const handlePrint = () => {
    window.print();
  };

  const handleDuplicate = () => {
    duplicateReview(review.id);
    navigate('/reviews');
  };

  const getRiskColor = (level?: RecommendationLevel) => {
    switch (level) {
      case 'Critical Risk': return 'bg-slate-900 text-white';
      case 'High Risk': return 'bg-slate-700 text-white';
      case 'Moderate Risk': return 'bg-slate-400 text-slate-900';
      case 'Low Risk': return 'bg-slate-200 text-slate-900';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const finalHumanLevel = review.humanDecision?.concludedLevel || review.overallRecommendation;
  const isOverridden =
    review.humanDecision &&
    review.overallRecommendation &&
    review.humanDecision.concludedLevel !== review.overallRecommendation;

  return (
    <div className="max-w-4xl mx-auto space-y-8 print:space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-semibold text-slate-900">{review.title}</h1>
            {isDraft ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                Draft (Incomplete)
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                Final Assessment
              </span>
            )}
            {isSnapshot && (
              <span
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
                title={`Assessment snapshot archived at review completion (${review.frameworkSnapshot?.capturedAt ? format(new Date(review.frameworkSnapshot.capturedAt), 'PPP') : 'Preserved'})`}
              >
                <Archive className="h-3 w-3 mr-1 text-slate-500" />
                Snapshot
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Evaluated on {format(new Date(review.reviewDate), 'PPP')} • Framework: {framework.name}
            {isSnapshot && ' (Preserved Assessment Snapshot)'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={() => navigate('/reviews')} aria-label="Back to Reviews">Back</Button>
          {isDraft ? (
            <Button onClick={() => navigate(`/reviews/${review.id}/edit`)} aria-label="Resume & Edit Draft">
              <Edit3 className="mr-2 h-4 w-4" /> Resume & Edit Draft
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={handleDuplicate} title="Create Reassessment Revision" aria-label="Create Reassessment Revision">
                <Copy className="mr-2 h-4 w-4" /> Create Revision
              </Button>
              <Button onClick={handlePrint} aria-label="Print or Export to PDF"><Printer className="mr-2 h-4 w-4" /> Print PDF</Button>
            </>
          )}
        </div>
      </div>

      {/* Print Document Header */}
      <div className="hidden print:block mb-6">
        <h1 className="text-3xl font-bold text-slate-900 border-b-2 border-slate-900 pb-2">
          AI Ethics Review Report
        </h1>
        <div className="grid grid-cols-2 text-xs text-slate-600 mt-2">
          <div>Date: {format(new Date(review.reviewDate), 'PPP')}</div>
          <div className="text-right">Framework: {framework.name} {isSnapshot ? '(Snapshot Archive)' : ''}</div>
          <div>Status: {isDraft ? 'DRAFT (INCOMPLETE)' : 'COMPLETED ETHICAL REVIEW'}</div>
          <div className="text-right">Reviewer: {review.reviewer}</div>
        </div>
      </div>

      {isHistoricalFrameworkUnavailable && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm flex items-start">
          <AlertTriangle className="h-5 w-5 mr-3 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Historical Framework Definition Unavailable:</span>
            <p className="mt-1">
              The custom framework used during this review has been deleted and was saved prior to snapshot archiving. Review findings, scores, and deliberative notes are preserved directly from the saved assessment record.
            </p>
          </div>
        </div>
      )}

      {isDraft && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm flex items-start">
          <AlertTriangle className="h-5 w-5 mr-3 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Assessment in Draft Status:</span>
            <p className="mt-1">
              This review is incomplete and does not publish a final ethical certification or overall recommendation. Resume the draft to finalize all evaluation criteria and human deliberations.
            </p>
          </div>
        </div>
      )}

      {/* Executive Summary & Human Conclusion (Top Card) */}
      {!isDraft && (
        <Card className="border-slate-300 bg-slate-50">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-5 text-center md:text-left border-b md:border-b-0 md:border-r border-slate-200 pb-4 md:pb-0 md:pr-4">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Final Concluded Risk Tier
                </span>
                <div
                  className={`inline-flex items-center px-4 py-2 rounded-lg font-bold text-lg shadow-sm ${getRiskColor(
                    finalHumanLevel
                  )}`}
                >
                  {finalHumanLevel || 'Moderate Risk'}
                </div>
                {isOverridden && (
                  <div className="text-xs text-amber-800 font-medium mt-2 flex items-center justify-center md:justify-start">
                    <Info className="h-3.5 w-3.5 mr-1 text-amber-700 shrink-0" />
                    Human Adjusted (Advisory Baseline: {review.overallRecommendation})
                  </div>
                )}
              </div>

              <div className="md:col-span-7 space-y-2 text-sm text-slate-700">
                <div className="font-semibold text-slate-900 text-sm">Reviewer Human Conclusion & Rationale:</div>
                <p className="italic bg-white p-3 rounded border border-slate-200 text-slate-800">
                  "{review.humanDecision?.rationale || 'Assessment concluded in alignment with framework rubrics.'}"
                </p>
                {isOverridden && review.humanDecision?.deviationJustification && (
                  <div className="text-xs text-amber-900 bg-amber-50 p-2 rounded border border-amber-200">
                    <strong>Deviation Justification:</strong> {review.humanDecision.deviationJustification}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* System Context & Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>System Identification & Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div><strong className="text-slate-900 block text-xs uppercase text-slate-500">System Title</strong> {review.title}</div>
            <div><strong className="text-slate-900 block text-xs uppercase text-slate-500">AI Model / Pipeline</strong> {review.aiSystem || 'Not specified'}</div>
            <div><strong className="text-slate-900 block text-xs uppercase text-slate-500">Reviewer</strong> {review.reviewer}</div>
          </div>

          {review.purpose && (
            <div>
              <strong className="block text-slate-900 text-xs uppercase text-slate-500 mb-1">Intended Purpose</strong>
              <p className="text-slate-700">{review.purpose}</p>
            </div>
          )}

          {review.context && (
            <div>
              <strong className="block text-slate-900 text-xs uppercase text-slate-500 mb-1">Deployment Context</strong>
              <p className="text-slate-700">{review.context}</p>
            </div>
          )}

          {review.description && (
            <div>
              <strong className="block text-slate-900 text-xs uppercase text-slate-500 mb-1">Workflow Description</strong>
              <p className="text-slate-700">{review.description}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stakeholder Impact Mapping */}
      {review.stakeholderImpacts && review.stakeholderImpacts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Stakeholder Impact Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Stakeholder Group</th>
                    <th className="py-2.5 px-3">Affected Interests & Rights</th>
                    <th className="py-2.5 px-3">Anticipated Benefits</th>
                    <th className="py-2.5 px-3">Potential Harms & Risks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {review.stakeholderImpacts.map((sh) => (
                    <tr key={sh.id}>
                      <td className="py-3 px-3 font-semibold text-slate-900 whitespace-nowrap">{sh.group}</td>
                      <td className="py-3 px-3 text-slate-700">{sh.affectedInterests || '—'}</td>
                      <td className="py-3 px-3 text-slate-700">{sh.benefits || '—'}</td>
                      <td className="py-3 px-3 text-slate-700">{sh.concernsOrHarms || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Criteria Breakdown & Decision-Support Calculation */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Decision-Support Scoring Rationale</CardTitle>
            {review.scoreExplanation && (
              <span className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded text-slate-800">
                Total Score: {review.scoreExplanation.totalScore} / {review.scoreExplanation.maxPossibleScore} pts
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {framework.criteria.map((crit) => {
              const scoreVal = review.scores[crit.id];
              const isAnswered = scoreVal !== undefined && scoreVal !== null;
              const contribution = isAnswered ? scoreVal * crit.weight : 0;
              const label = isAnswered ? crit.scoringScale.labels?.[scoreVal] : 'Unrated';

              return (
                <div key={crit.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center">
                        {crit.title}
                        {crit.category && (
                          <span className="ml-2 text-[10px] font-normal uppercase bg-slate-200 px-1.5 py-0.5 rounded text-slate-700">
                            {crit.category}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Rating: <strong>{isAnswered ? scoreVal : '—'}</strong> ({label}) • Weight: {crit.weight}
                      </div>
                    </div>
                    <div className="text-right font-bold text-slate-900 whitespace-nowrap">
                      +{contribution} pts
                    </div>
                  </div>
                  {review.notes[crit.id] && (
                    <div className="mt-2 text-xs text-slate-700 bg-white p-2 rounded border border-slate-100 italic">
                      "{review.notes[crit.id]}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Triggered Red Flags */}
          {review.triggeredRules && review.triggeredRules.length > 0 && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-sm text-red-900 flex items-center mb-2">
                <Shield className="h-4 w-4 mr-1 text-red-700" /> Triggered Non-Compensatory Red Flags
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs text-red-800">
                {review.triggeredRules.map((r) => (
                  <li key={r.id}>
                    <strong>{r.outcomeLevel}:</strong> {r.description}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Structured Ethical Reflections & Trade-Offs */}
      {review.ethicalReflections && (
        <Card>
          <CardHeader>
            <CardTitle>Ethical Reflections & Trade-Off Analysis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            {review.ethicalReflections.significantConcerns && (
              <div>
                <strong className="block text-xs uppercase text-slate-500 mb-1">Significant Ethical Concerns</strong>
                <p className="text-slate-700">{review.ethicalReflections.significantConcerns}</p>
              </div>
            )}
            {review.ethicalReflections.competingValues && (
              <div>
                <strong className="block text-xs uppercase text-slate-500 mb-1">Competing Values & Principles</strong>
                <p className="text-slate-700">{review.ethicalReflections.competingValues}</p>
              </div>
            )}
            {review.ethicalReflections.tradeOffs && (
              <div>
                <strong className="block text-xs uppercase text-slate-500 mb-1">Proportionality & Justified Trade-Offs</strong>
                <p className="text-slate-700">{review.ethicalReflections.tradeOffs}</p>
              </div>
            )}
            {review.ethicalReflections.unresolvedQuestions && (
              <div>
                <strong className="block text-xs uppercase text-slate-500 mb-1">Unresolved Questions for Ongoing Audit</strong>
                <p className="text-slate-700">{review.ethicalReflections.unresolvedQuestions}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Supporting Evidence Register */}
      {review.evidenceItems && review.evidenceItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Supporting Evidence & Uncertainty Register</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead className="bg-slate-50 text-slate-600 uppercase font-semibold border-b">
                  <tr>
                    <th className="py-2.5 px-3">Evidence Description</th>
                    <th className="py-2.5 px-3">Source / Reference</th>
                    <th className="py-2.5 px-3">Evidence Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Limitations & Uncertainty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {review.evidenceItems.map((ev) => (
                    <tr key={ev.id}>
                      <td className="py-3 px-3 font-semibold text-slate-900">{ev.description}</td>
                      <td className="py-3 px-3 text-slate-700">{ev.sourceOrReference || '—'}</td>
                      <td className="py-3 px-3 text-slate-600 whitespace-nowrap">{ev.evidenceType}</td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold ${
                            ev.verificationStatus === 'Verified'
                              ? 'bg-green-100 text-green-800'
                              : ev.verificationStatus === 'Partially Verified'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {ev.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{ev.limitationsOrUncertainty || 'None noted'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommended Safeguards */}
      <Card>
        <CardHeader>
          <CardTitle>Prescribed Governance Safeguards</CardTitle>
          <p className="text-xs text-slate-500">
            The following controls are recommended for this system's operational deployment.
          </p>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {review.appliedSafeguards && review.appliedSafeguards.length > 0 ? (
              review.appliedSafeguards.map((sg) => (
                <li key={sg.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-sm">
                  <div className="font-semibold text-slate-900 flex items-center">
                    <CheckCircle2 className="h-4 w-4 mr-2 text-slate-700 shrink-0" />
                    {sg.title}
                  </div>
                  <div className="text-xs text-slate-600 mt-1 pl-6">{sg.description}</div>
                </li>
              ))
            ) : (
              <li className="text-sm text-slate-500 italic">No specific safeguards attached.</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Formal Reviewer Sign-off & Accountability (Visible on Print) */}
      <div className="hidden print:block mt-8 pt-6 border-t-2 border-slate-300 break-inside-avoid">
        <div className="text-sm font-semibold text-slate-800 uppercase tracking-wider mb-4">
          Ethical Review Sign-off & Accountability
        </div>
        <div className="grid grid-cols-2 gap-8 text-xs text-slate-700">
          <div className="space-y-4">
            <div>
              <span className="block text-slate-500 font-medium">Lead Reviewer / Evaluator:</span>
              <span className="font-semibold text-slate-900 text-sm">{review.reviewer || 'Not specified'}</span>
            </div>
            <div>
              <span className="block text-slate-500 font-medium">Evaluation Date:</span>
              <span>{format(new Date(review.reviewDate), 'PPP')}</span>
            </div>
            <div>
              <span className="block text-slate-500 font-medium">Concluded Ethical Risk Level:</span>
              <span className="font-bold text-slate-900">{finalHumanLevel || 'Moderate Risk'}</span>
            </div>
          </div>
          <div className="space-y-6">
            <div>
              <span className="block text-slate-500 font-medium">Reviewer Signature:</span>
              <div className="mt-8 border-b border-slate-400 w-full" />
            </div>
            <div>
              <span className="block text-slate-500 font-medium">Governance / Supervisory Approval:</span>
              <div className="mt-8 border-b border-slate-400 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* Formal Governance Disclaimer */}
      <div className="p-4 bg-slate-100 border border-slate-200 rounded-lg text-slate-600 text-xs leading-relaxed print:mt-8">
        <strong>Governance Notice & Limitations:</strong> This report represents an internal, structured ethical review and decision-support artifact conducted under the {framework.name}. It documents qualitative human deliberations, stakeholder considerations, and prescribed safeguards. This evaluation does not constitute statutory compliance certification, GDPR/FERPA clearance, or formal third-party algorithmic assurance.
      </div>
    </div>
  );
}
