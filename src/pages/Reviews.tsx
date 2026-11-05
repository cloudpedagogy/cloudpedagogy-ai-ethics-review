import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';
import { Search, Eye, Trash2, Edit3, Copy, FileText } from 'lucide-react';
import type { RecommendationLevel } from '../models/types';

export function Reviews() {
  const { reviews, deleteReview, duplicateReview } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'draft'>('all');

  const filteredReviews = reviews
    .filter((r) => {
      const matchesSearch =
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.aiSystem.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'completed' && r.status === 'completed') ||
        (statusFilter === 'draft' && r.status === 'draft');
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());

  const getRiskBadge = (level?: RecommendationLevel) => {
    switch (level) {
      case 'Critical Risk': return 'bg-slate-900 text-white';
      case 'High Risk': return 'bg-slate-700 text-white';
      case 'Moderate Risk': return 'bg-slate-400 text-slate-900';
      case 'Low Risk': return 'bg-slate-200 text-slate-900';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const handleDuplicate = (id: string) => {
    duplicateReview(id);
    navigate('/reviews');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Review Library</h1>
          <p className="text-sm text-slate-500">All completed assessments and in-progress drafts.</p>
        </div>
        <Button onClick={() => navigate('/reviews/new')}>
          <FileText className="mr-2 h-4 w-4" /> New Review
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center w-full sm:w-80">
              <Search className="h-5 w-5 text-slate-400 mr-2 shrink-0" />
              <input 
                type="text" 
                placeholder="Search reviews by title or system..." 
                aria-label="Search reviews by title or system"
                className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex space-x-1 border border-slate-200 rounded-lg p-1 bg-slate-50 text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({reviews.length})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'completed'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Completed ({reviews.filter((r) => r.status === 'completed').length})
              </button>
              <button
                onClick={() => setStatusFilter('draft')}
                className={`px-3 py-1 rounded-md font-medium transition-colors ${
                  statusFilter === 'draft'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Drafts ({reviews.filter((r) => r.status === 'draft').length})
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Title & System</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Status & Outcome</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No reviews found matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => {
                    const isDraft = review.status === 'draft';
                    const displayedOutcome = review.humanDecision?.concludedLevel || review.overallRecommendation;

                    return (
                      <tr key={review.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-slate-900 flex items-center">
                            {review.title}
                            {review.isRevisionOf && (
                              <span className="ml-2 text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                                Revision
                              </span>
                            )}
                          </div>
                          <div className="text-slate-500 text-xs mt-1">
                            {review.aiSystem || 'System unspecified'} • Reviewer: {review.reviewer}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600 whitespace-nowrap">
                          {format(new Date(review.reviewDate), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4">
                          {isDraft ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-amber-100 text-amber-800">
                              Draft (Incomplete)
                            </span>
                          ) : (
                            <div className="space-y-1">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold ${getRiskBadge(displayedOutcome)}`}>
                                {displayedOutcome || 'Completed'}
                              </span>
                              {review.humanDecision && review.overallRecommendation && review.humanDecision.concludedLevel !== review.overallRecommendation && (
                                <div className="text-[10px] text-amber-700 font-medium">
                                  Human Adjusted (from {review.overallRecommendation})
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right space-x-1 whitespace-nowrap">
                          {isDraft ? (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => navigate(`/reviews/${review.id}/edit`)}
                              title="Resume Draft"
                              aria-label={`Resume draft assessment for ${review.title}`}
                            >
                              <Edit3 className="mr-1 h-3.5 w-3.5 inline" /> Resume
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => navigate(`/reviews/${review.id}`)}
                                title="View Report"
                                aria-label={`View report for ${review.title}`}
                              >
                                <Eye className="h-4 w-4 text-slate-600 hover:text-slate-900" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDuplicate(review.id)}
                                title="Revise / Duplicate Assessment"
                                aria-label={`Revise or duplicate assessment for ${review.title}`}
                              >
                                <Copy className="h-4 w-4 text-slate-600 hover:text-slate-900" />
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              if (window.confirm(`Delete review "${review.title}"? This action cannot be undone.`)) {
                                deleteReview(review.id);
                              }
                            }}
                            title="Delete Review"
                            aria-label={`Delete review ${review.title}`}
                          >
                            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
