/**
 * Top Navigation Bar
 */

import { useUIStore } from '../../../shared/store';

const tabTitles: Record<string, { title: string; subtitle: string }> = {
  routes:  { title: 'Routes',  subtitle: 'Maritime route management & baselines' },
  compare: { title: 'Compare', subtitle: 'GHG intensity comparison vs target (89.3368 gCO₂/MJ)' },
  banking: { title: 'Banking', subtitle: 'FuelEU Article 20 — Surplus banking mechanism' },
  pooling: { title: 'Pooling', subtitle: 'FuelEU Article 21 — Compliance pooling' },
};

export function Topbar() {
  const { activeTab, toggleSidebar } = useUIStore();
  const meta = tabTitles[activeTab];

  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 px-6 py-4 border-b border-white/8 bg-slate-950/80 backdrop-blur-xl">
      {/* Hamburger (mobile) */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
        aria-label="Toggle sidebar"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base font-display font-bold text-white truncate">{meta.title}</h1>
        <p className="text-xs text-slate-500 truncate hidden sm:block">{meta.subtitle}</p>
      </div>

      {/* Right side: regulation badge */}
      <div className="hidden md:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-ocean-500/30 bg-ocean-500/10">
          <div className="h-1.5 w-1.5 rounded-full bg-ocean-400" />
          <span className="text-xs font-medium text-ocean-300">EU Reg. 2023/1805</span>
        </div>
      </div>
    </header>
  );
}
