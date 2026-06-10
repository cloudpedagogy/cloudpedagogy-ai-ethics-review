
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';

import { Frameworks } from './pages/Frameworks';
import { FrameworkBuilder } from './pages/FrameworkBuilder';
import { NewReview } from './pages/NewReview';
import { ReviewReport } from './pages/ReviewReport';
import { Reviews } from './pages/Reviews';
import { Settings } from './pages/Settings';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="reviews/new" element={<NewReview />} />
          <Route path="reviews/:id" element={<ReviewReport />} />
          <Route path="frameworks" element={<Frameworks />} />
          <Route path="frameworks/:id" element={<FrameworkBuilder />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
