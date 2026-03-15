/**
 * Shared UI Primitives
 *
 * Low-level reusable components: Badge, KpiCard, Spinner, EmptyState, ErrorState
 */

import React from 'react';
import { clsx } from "../../../shared/utils";

// ─── Badge ─────────────────────────────────────────────────────────────────────

interface BadgeProps {
  variant?: 'success' | 'danger' | 'warning' | 'neutral' | 'info';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
  const styles: Record<string, string> = {
    success: 'bg-seafoam-500/15 text-seafoam-400 border border-seafoam-500/30',
    danger:  'bg-red-500/15 text-red-400 border border-red-500/30',
    warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
    neutral: 'bg-white/10 text-slate-300 border border-white/10',
    info:    'bg-ocean-500/15 text-ocean-400 border border-ocean-500/30',
  };
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  variant?: 'default' | 'positive' | 'negative' | 'neutral';
  icon?: React.ReactNode;
  loading?: boolean;
}

export function KpiCard({ label, value, sub, variant = 'default', icon, loading }: KpiCardProps) {
  const borderColors = {
    default:  'border-white/10',
    positive: 'border-seafoam-500/40',
    negative: 'border-red-500/40',
    neutral:  'border-ocean-500/40',
  };
  const valueColors = {
    default:  'text-white',
    positive: 'text-seafoam-400',
    negative: 'text-red-400',
    neutral:  'text-ocean-400',
  };

  return (
    <div
      className={clsx(
        'relative rounded-xl border bg-white/5 backdrop-blur-sm p-5 overflow-hidden',
        borderColors[variant]
      )}
    >
      {/* Subtle glow behind value */}
      <div className={clsx(
        'absolute inset-0 opacity-5 rounded-xl',
        variant === 'positive' && 'bg-seafoam-400',
        variant === 'negative' && 'bg-red-400',
        variant === 'neutral'  && 'bg-ocean-400',
      )} />

      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">
            {label}
          </span>
          {icon && (
            <span className="text-slate-500">{icon}</span>
          )}
        </div>

        {loading ? (
          <div className="h-8 w-24 bg-white/10 rounded animate-pulse" />
        ) : (
          <p className={clsx('text-2xl font-display font-bold tracking-tight', valueColors[variant])}>
            {value}
          </p>
        )}

        {sub && (
          <p className="mt-1 text-xs text-slate-500">{sub}</p>
        )}
      </div>
    </div>
  );
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

export function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={clsx('animate-spin text-ocean-400', className ?? 'h-5 w-5')}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// ─── Loading Overlay ──────────────────────────────────────────────────────────

export function LoadingState({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <Spinner className="h-8 w-8" />
      <p className="text-sm text-slate-400">{message}</p>
    </div>
  );
}

// ─── Error State ──────────────────────────────────────────────────────────────

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="rounded-full bg-red-500/10 p-4">
        <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
          />
        </svg>
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-red-400">Something went wrong</p>
        <p className="mt-1 text-xs text-slate-500">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({ icon, title, description }: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      {icon && (
        <div className="rounded-full bg-white/5 p-4 text-slate-500">{icon}</div>
      )}
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {description && (
        <p className="text-xs text-slate-500 max-w-xs">{description}</p>
      )}
    </div>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md';
  loading?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-40 disabled:cursor-not-allowed';

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
  };

  const variants = {
    primary:   'bg-ocean-600 hover:bg-ocean-500 text-white focus:ring-ocean-500',
    secondary: 'bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 focus:ring-white/20',
    danger:    'bg-red-600/80 hover:bg-red-600 text-white focus:ring-red-500',
    ghost:     'hover:bg-white/10 text-slate-400 hover:text-slate-200 focus:ring-white/10',
  };

  return (
    <button
      {...props}
      disabled={disabled ?? loading}
      className={clsx(base, sizes[size], variants[variant], className)}
    >
      {loading && <Spinner className="h-3.5 w-3.5" />}
      {children}
    </button>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

export function SectionHeader({ title, description, action }: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h2 className="text-lg font-display font-bold text-white">{title}</h2>
        {description && (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Table ────────────────────────────────────────────────────────────────────

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={clsx('overflow-x-auto rounded-xl border border-white/10', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th className={clsx(
      'px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-widest bg-white/5 border-b border-white/10',
      className
    )}>
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <td className={clsx('px-4 py-3 text-slate-200 border-b border-white/5', className)}>
      {children}
    </td>
  );
}
