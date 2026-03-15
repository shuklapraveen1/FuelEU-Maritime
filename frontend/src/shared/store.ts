/**
 * Global UI State Store (Zustand)
 *
 * Only truly global UI state lives here — things that multiple
 * unrelated components need to share. Server state lives in React Query.
 */

import { create } from 'zustand';

interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface UIStore {
  // Active dashboard tab
  activeTab: 'routes' | 'compare' | 'banking' | 'pooling';
  setActiveTab: (tab: UIStore['activeTab']) => void;

  // Sidebar open state (mobile)
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;

  // Toast notifications
  toasts: ToastMessage[];
  addToast: (type: ToastMessage['type'], message: string) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  activeTab: 'routes',
  setActiveTab: (tab) => set({ activeTab: tab }),

  sidebarOpen: false,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  toasts: [],
  addToast: (type, message) =>
    set((s) => ({
      toasts: [
        ...s.toasts,
        { id: `${Date.now()}-${Math.random()}`, type, message },
      ],
    })),
  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
