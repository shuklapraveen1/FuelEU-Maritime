/**
 * Toast Notifications
 */

import { useEffect } from 'react';
import { useUIStore } from '../../../shared/store';

export function ToastContainer() {
  const { toasts, removeToast } = useUIStore();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-80">
      {toasts.map((t) => (
        <Toast key={t.id} id={t.id} type={t.type} message={t.message} onDismiss={removeToast} />
      ))}
    </div>
  );
}

function Toast({
  id,
  type,
  message,
  onDismiss,
}: {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), 4000);
    return () => clearTimeout(timer);
  }, [id, onDismiss]);

  const styles = {
    success: 'bg-seafoam-900/90 border-seafoam-500/40 text-seafoam-200',
    error:   'bg-red-900/90 border-red-500/40 text-red-200',
    info:    'bg-ocean-900/90 border-ocean-500/40 text-ocean-200',
  };

  const icons = {
    success: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
    error: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    info: (
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-sm shadow-xl text-sm animate-slide-up ${styles[type]}`}
    >
      {icons[type]}
      <span className="flex-1">{message}</span>
      <button onClick={() => onDismiss(id)} className="opacity-60 hover:opacity-100 transition-opacity">
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
