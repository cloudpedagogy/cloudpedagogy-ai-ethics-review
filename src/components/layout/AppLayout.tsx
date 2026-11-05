
import { useState, useRef, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Menu, ShieldCheck } from 'lucide-react';

export function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const wasOpenRef = useRef(false);

  // Manage focus transfer and escape key handling
  useEffect(() => {
    if (mobileMenuOpen) {
      wasOpenRef.current = true;
      // Focus the first focusable element inside the drawer
      const timer = setTimeout(() => {
        if (drawerRef.current) {
          const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          if (focusables.length > 0) {
            focusables[0].focus();
          } else {
            drawerRef.current.focus();
          }
        }
      }, 50);

      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          setMobileMenuOpen(false);
        }
      };

      document.addEventListener('keydown', handleGlobalKeyDown);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('keydown', handleGlobalKeyDown);
      };
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      menuTriggerRef.current?.focus();
    }
  }, [mobileMenuOpen]);

  // Trap focus within drawer when open
  const handleDrawerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      setMobileMenuOpen(false);
      return;
    }

    if (e.key === 'Tab') {
      if (!drawerRef.current) return;
      const focusables = Array.from(
        drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute('disabled') && el.offsetParent !== null);

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Desktop Sidebar (hidden on mobile, visible on md and up) */}
      <div className="hidden md:flex md:shrink-0 print:hidden">
        <Sidebar />
      </div>

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 flex md:hidden print:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile Navigation"
        >
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          {/* Slide-over menu */}
          <div
            ref={drawerRef}
            onKeyDown={handleDrawerKeyDown}
            tabIndex={-1}
            className="relative flex w-full max-w-xs flex-1 flex-col bg-slate-50 shadow-xl focus:outline-none"
          >
            <Sidebar
              onNavigate={() => setMobileMenuOpen(false)}
              onClose={() => setMobileMenuOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 md:hidden print:hidden">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="h-5 w-5 text-slate-700" />
            <span className="text-sm font-bold text-slate-900">CloudPedagogy AI Ethics</span>
          </div>
          <button
            ref={menuTriggerRef}
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 rounded-md text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
            aria-label="Open mobile navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto focus:outline-none">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
