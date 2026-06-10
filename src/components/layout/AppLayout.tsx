
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto focus:outline-none">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
