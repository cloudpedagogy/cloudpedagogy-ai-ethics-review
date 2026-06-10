import { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { useStore } from '../store/useStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { RecommendationLevel } from '../models/types';

const RISK_COLORS: Record<RecommendationLevel, string> = {
  'Low Risk': '#cbd5e1',       // slate-300
  'Moderate Risk': '#94a3b8',  // slate-400
  'High Risk': '#64748b',      // slate-500
  'Critical Risk': '#334155',  // slate-700
};

export function Dashboard() {
  const reviews = useStore((state) => state.reviews);

  const stats = useMemo(() => {
    const total = reviews.length;
    let low = 0;
    let moderate = 0;
    let high = 0;
    let critical = 0;

    reviews.forEach((r) => {
      if (r.overallRecommendation === 'Low Risk') low++;
      else if (r.overallRecommendation === 'Moderate Risk') moderate++;
      else if (r.overallRecommendation === 'High Risk') high++;
      else if (r.overallRecommendation === 'Critical Risk') critical++;
    });

    const chartData = [
      { name: 'Low', count: low, risk: 'Low Risk' },
      { name: 'Moderate', count: moderate, risk: 'Moderate Risk' },
      { name: 'High', count: high, risk: 'High Risk' },
      { name: 'Critical', count: critical, risk: 'Critical Risk' },
    ];

    return { total, low, moderate, high, critical, chartData };
  }, [reviews]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Overview of AI Ethics Reviews across all frameworks.</p>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Low Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.low}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Moderate Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.moderate}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">High Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.high}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-300">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-700">Critical Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{stats.critical}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: '#f1f5f9' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }} 
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {stats.chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.risk as RecommendationLevel]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
