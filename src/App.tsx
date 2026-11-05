
import { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Reviews = lazy(() => import('./pages/Reviews').then((m) => ({ default: m.Reviews })));
const NewReview = lazy(() => import('./pages/NewReview').then((m) => ({ default: m.NewReview })));
const ReviewReport = lazy(() => import('./pages/ReviewReport').then((m) => ({ default: m.ReviewReport })));
const Frameworks = lazy(() => import('./pages/Frameworks').then((m) => ({ default: m.Frameworks })));
const FrameworkBuilder = lazy(() => import('./pages/FrameworkBuilder').then((m) => ({ default: m.FrameworkBuilder })));
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })));

function RouteLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
    </div>
  );
}

function App() {
  return (
    <HashRouter>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Routes>
          <Route path="/" element={<AppLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="reviews/new" element={<NewReview />} />
            <Route path="reviews/:id" element={<ReviewReport />} />
            <Route path="reviews/:id/edit" element={<NewReview />} />
            <Route path="frameworks" element={<Frameworks />} />
            <Route path="frameworks/:id" element={<FrameworkBuilder />} />
            <Route path="settings" element={<Settings />} />
          </Route>
        </Routes>
      </Suspense>
    </HashRouter>
  );
}

export default App;
