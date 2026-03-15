/**
 * Dashboard Layout
 *
 * Main shell: Sidebar + Topbar + scrollable content area.
 */

import { Sidebar } from '../components/Sidebar';
import { Topbar } from '../components/Topbar';
import { ToastContainer } from '../components/Toast';
import { useUIStore } from '../../../shared/store';
import { RoutesPage } from './RoutesPage';
import { ComparePage } from './ComparePage';
import { BankingPage } from './BankingPage';
import { PoolingPage } from './PoolingPage';

export function DashboardLayout() {
  const activeTab = useUIStore((s) => s.activeTab);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden">
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Topbar />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'routes'  && <RoutesPage />}
            {activeTab === 'compare' && <ComparePage />}
            {activeTab === 'banking' && <BankingPage />}
            {activeTab === 'pooling' && <PoolingPage />}
          </div>
        </main>
      </div>

      <ToastContainer />
    </div>
  );
}
