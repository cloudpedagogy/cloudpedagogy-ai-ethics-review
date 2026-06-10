import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { format } from 'date-fns';
import { Search, Eye, Trash2 } from 'lucide-react';
import type { RecommendationLevel } from '../models/types';

export function Reviews() {
  const { reviews, deleteReview } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReviews = reviews
    .filter(r => r.title.toLowerCase().includes(searchTerm.toLowerCase()) || r.aiSystem.toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime());

  const getRiskBadge = (level?: RecommendationLevel) => {
    switch (level) {
      case 'Critical Risk': return 'bg-slate-800 text-white';
      case 'High Risk': return 'bg-slate-600 text-white';
      case 'Moderate Risk': return 'bg-slate-400 text-slate-900';
      case 'Low Risk': return 'bg-slate-200 text-slate-900';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Review Library</h1>
          <p className="text-sm text-slate-500">All completed and drafted AI Ethics reviews.</p>
        </div>
        <Button onClick={() => navigate('/reviews/new')}>New Review</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-slate-200 flex items-center">
            <Search className="h-5 w-5 text-slate-400 mr-2" />
            <input 
              type="text" 
              placeholder="Search reviews by title or system..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-medium">Title & System</th>
                  <th className="px-6 py-3 font-medium">Date</th>
                  <th className="px-6 py-3 font-medium">Recommendation</th>
                  <th className="px-6 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No reviews found.
                    </td>
                  </tr>
                ) : (
                  filteredReviews.map((review) => (
                    <tr key={review.id} className="bg-white border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{review.title}</div>
                        <div className="text-slate-500 text-xs mt-1">{review.aiSystem}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {format(new Date(review.reviewDate), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getRiskBadge(review.overallRecommendation)}`}>
                          {review.overallRecommendation || 'Pending'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button size="sm" variant="ghost" onClick={() => navigate(`/reviews/${review.id}`)}>
                          <Eye className="h-4 w-4 text-slate-500 hover:text-slate-900" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => {
                          if (window.confirm('Delete this review?')) {
                            deleteReview(review.id);
                          }
                        }}>
                          <Trash2 className="h-4 w-4 text-red-500 hover:text-red-700" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
