import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, Activity } from 'lucide-react';
import { useDataContext } from '../context/DataContext';

export default function AppLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const { data, isReady } = useDataContext();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key to close mobile drawer
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const rowCount = data?.validationReport.actualRowCount ?? 0;

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFFFFF] text-[#374151]">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Mobile / Tablet Drawer & Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-xs lg:hidden transition-opacity duration-200"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
      <div
        className={`fixed inset-y-0 left-0 z-50 lg:hidden transform transition-transform duration-200 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        <Sidebar
          isMobileDrawer
          onClose={() => setMobileMenuOpen(false)}
          onNavClick={() => setMobileMenuOpen(false)}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FFFFFF]">
        {/* Mobile / Tablet Top Header Bar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#090909] text-white border-b border-[#262626] flex-shrink-0 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-md text-[#A3A3A3] hover:text-white hover:bg-[#171717] transition-colors focus-visible:ring-2 focus-visible:ring-[#FACC15] focus-visible:outline-hidden cursor-pointer"
              aria-label="Open navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-[#171717] border border-[#262626] flex items-center justify-center">
                <Activity className="w-3.5 h-3.5 text-[#FACC15]" />
              </div>
              <div>
                <p className="text-xs font-bold text-white tracking-wide leading-tight">HOSPITAL LOS</p>
                <p className="text-[10px] text-[#A3A3A3] font-medium leading-tight">Clinical Research</p>
              </div>
            </div>
          </div>

          {/* Status pill on mobile header */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] bg-[#171717] border border-[#262626] font-mono">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="text-[#A3A3A3] font-medium text-[10px]">
              {isReady ? `${(rowCount / 1000).toFixed(0)}k records` : 'Loading...'}
            </span>
          </div>
        </header>

        {/* Scrollable Viewport */}
        <main
          className="flex-1 overflow-y-auto min-w-0 focus:outline-hidden bg-[#FFFFFF]"
          id="main-content"
          tabIndex={-1}
        >
          <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
