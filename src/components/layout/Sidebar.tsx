
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FileText, Settings, Library, ShieldCheck, Scale } from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  {
    name: 'Ethics Reviews',
    items: [
      { name: 'New Review', path: '/reviews/new', icon: FileText },
      { name: 'Review Library', path: '/reviews', icon: Library },
    ],
  },
  {
    name: 'Ethics Framework',
    items: [
      { name: 'Frameworks', path: '/frameworks', icon: Scale },
    ],
  },
  { name: 'Settings', path: '/settings', icon: Settings },
];

export function Sidebar() {
  return (
    <div className="flex h-screen w-64 flex-col border-r border-slate-200 bg-slate-50">
      <div className="flex h-16 shrink-0 items-center border-b border-slate-200 px-4">
        <ShieldCheck className="mr-3 h-6 w-6 text-slate-700" />
        <div className="flex flex-col">
          <span className="text-sm font-bold text-slate-900 tracking-tight leading-tight">CloudPedagogy</span>
          <span className="text-xs font-medium text-slate-500 leading-tight">AI Ethics Review</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-6 px-2">
          {navItems.map((section, idx) => (
            <div key={idx}>
              {section.items ? (
                <div className="space-y-1">
                  <h4 className="mb-2 px-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {section.name}
                  </h4>
                  {section.items.map((item) => (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={({ isActive }) =>
                        `group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                          isActive
                            ? 'bg-slate-200 text-slate-900'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`
                      }
                    >
                      <item.icon
                        className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-slate-500"
                        aria-hidden="true"
                      />
                      {item.name}
                    </NavLink>
                  ))}
                </div>
              ) : (
                <NavLink
                  to={section.path}
                  className={({ isActive }) =>
                    `group flex items-center rounded-md px-2 py-2 text-sm font-medium ${
                      isActive
                        ? 'bg-slate-200 text-slate-900'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                    }`
                  }
                >
                  <section.icon
                    className="mr-3 h-5 w-5 flex-shrink-0 text-slate-400 group-hover:text-slate-500"
                    aria-hidden="true"
                  />
                  {section.name}
                </NavLink>
              )}
            </div>
          ))}
        </nav>
      </div>
    </div>
  );
}
