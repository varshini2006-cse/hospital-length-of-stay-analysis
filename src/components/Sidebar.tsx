import { NavLink, useLocation } from 'react-router-dom';
import { APP_ROUTES } from '../types/navigation';
import { useDataContext } from '../context/DataContext';
import {
  LayoutDashboard,
  Database,
  Sliders,
  BarChart3,
  Binary,
  Sparkles,
  Award,
  BookOpen,
  Activity,
  ChevronRight,
  X
} from 'lucide-react';

const ROUTE_ICONS = [
  LayoutDashboard,
  Database,
  Sliders,
  BarChart3,
  Binary,
  Sparkles,
  Award,
  BookOpen
] as const;

const PHASE_LABELS: Record<string, string> = {
  idle: 'Initializing',
  fetching_ids: 'Loading IDS',
  downloading_csv: 'Downloading',
  parsing_csv: 'Parsing',
  validating_schema: 'Validating',
  ready: 'Ready',
  error: 'Error'
};

interface SidebarProps {
  onNavClick?: () => void;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

export default function Sidebar({ onNavClick, onClose, isMobileDrawer = false }: SidebarProps) {
  const { data, progress } = useDataContext();
  const location = useLocation();

  const rowCount = data?.validationReport.actualRowCount ?? 0;
  const isReady = progress.phase === 'ready';
  const isError = progress.phase === 'error';

  return (
    <aside
      className={`bg-[#090909] border-r border-[#262626] flex flex-col flex-shrink-0 text-white select-none ${
        isMobileDrawer ? 'w-72 h-full' : 'w-60 min-h-screen'
      }`}
      aria-label="Sidebar Navigation"
    >
      {/* Brand Header */}
      <div className="px-4 py-4 border-b border-[#262626]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-[#171717] border border-[#262626] flex items-center justify-center flex-shrink-0">
              <Activity className="w-4 h-4 text-[#FACC15]" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#FFFFFF] tracking-wider leading-tight">HOSPITAL LOS</p>
              <p className="text-[11px] text-[#A3A3A3] font-medium leading-tight">Clinical Research Lab</p>
            </div>
          </div>
          {isMobileDrawer && onClose && (
            <button
              onClick={onClose}
              className="p-1 text-[#A3A3A3] hover:text-[#FFFFFF] rounded-md hover:bg-[#171717] transition-colors focus-visible:ring-2 focus-visible:ring-[#FACC15] focus-visible:outline-hidden"
              aria-label="Close navigation drawer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dataset status badge */}
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs transition-colors ${
            isReady
              ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              : isError
              ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
              : 'bg-[#171717] border border-[#262626] text-[#FACC15]'
          }`}
          role="status"
          aria-live="polite"
        >
          <span
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
              isReady
                ? 'bg-emerald-400'
                : isError
                ? 'bg-rose-400'
                : 'bg-[#FACC15] animate-pulse'
            }`}
          />
          {isReady ? (
            <span className="font-medium truncate font-mono text-[11px] text-emerald-400">
              {rowCount.toLocaleString()} encounters verified
            </span>
          ) : isError ? (
            <span className="font-medium text-[11px] text-rose-400">Data loading error</span>
          ) : (
            <span className="font-medium truncate text-[11px] text-[#FACC15]">
              {progress.percentage}% - {PHASE_LABELS[progress.phase] ?? progress.phase}
            </span>
          )}
        </div>
      </div>

      {/* Navigation Links - Compact with Titles Only */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-1" aria-label="Main Navigation">
        {APP_ROUTES.map((route, i) => {
          const Icon = ROUTE_ICONS[i];
          const exactOrPrefix =
            route.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(route.path);

          return (
            <NavLink
              key={route.path}
              to={route.path}
              onClick={onNavClick}
              aria-current={exactOrPrefix ? 'page' : undefined}
              className={`group flex items-center justify-between px-3 py-2.5 rounded-md text-xs transition-all duration-150 focus-visible:ring-2 focus-visible:ring-[#FACC15] focus-visible:outline-hidden ${
                exactOrPrefix
                  ? 'bg-[#171717] text-[#FACC15] font-semibold border-l-2 border-[#FACC15] shadow-xs'
                  : 'text-[#A3A3A3] hover:text-[#FFFFFF] hover:bg-[#141414]'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={`w-4 h-4 flex-shrink-0 transition-colors ${
                    exactOrPrefix ? 'text-[#FACC15]' : 'text-[#A3A3A3] group-hover:text-white'
                  }`}
                  aria-hidden="true"
                />
                <span className="truncate">{route.name}</span>
              </div>
              {exactOrPrefix && (
                <ChevronRight className="w-3.5 h-3.5 text-[#FACC15] flex-shrink-0" aria-hidden="true" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="px-4 py-3 border-t border-[#262626] text-[11px] bg-[#090909]">
        <div className="flex items-center justify-between text-[#A3A3A3]">
          <span className="font-medium text-[#FFFFFF]">Diabetes 130-US</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#171717] text-[#A3A3A3] border border-[#262626] font-mono">
            UCI ML
          </span>
        </div>
        <p className="text-[#A3A3A3]/70 text-[10px] mt-0.5">Strack et al. (1999–2008)</p>
      </div>
    </aside>
  );
}
