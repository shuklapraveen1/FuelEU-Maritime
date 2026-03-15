/**
 * Shared Utility Helpers
 */

/** Format a large compliance balance number with appropriate SI prefix */
export function formatCB(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : value > 0 ? '+' : '';
  if (abs >= 1_000_000_000)
    return `${sign}${(abs / 1_000_000_000).toFixed(2)} GgCO₂eq`;
  if (abs >= 1_000_000)
    return `${sign}${(abs / 1_000_000).toFixed(2)} MgCO₂eq`;
  if (abs >= 1_000)
    return `${sign}${(abs / 1_000).toFixed(1)} kgCO₂eq`;
  return `${sign}${abs.toFixed(0)} gCO₂eq`;
}

export function formatCBShort(value: number): string {
  const abs = Math.abs(value);
  const sign = value < 0 ? '−' : '';
  if (abs >= 1_000_000_000) return `${sign}${(abs / 1_000_000_000).toFixed(1)}G`;
  if (abs >= 1_000_000) return `${sign}${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}${(abs / 1_000).toFixed(0)}k`;
  return `${sign}${abs.toFixed(0)}`;
}

export function formatIntensity(value: number): string {
  return `${value.toFixed(4)} gCO₂/MJ`;
}

export function formatPercent(value: number, decimals = 2): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

export function formatNumber(value: number, decimals = 0): string {
  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function clsx(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ');
}

/** Generate a deterministic color for a ship ID */
export function shipColor(shipId: string): string {
  const colors = [
    '#36a7f6', // ocean-400
    '#4ade7e', // seafoam-400
    '#f59e0b', // amber-400
    '#e879f9', // fuchsia-400
    '#fb923c', // orange-400
    '#a78bfa', // violet-400
    '#34d399', // emerald-400
    '#f472b6', // pink-400
  ];
  let hash = 0;
  for (let i = 0; i < shipId.length; i++) {
    hash = (hash * 31 + shipId.charCodeAt(i)) | 0;
  }
  return colors[Math.abs(hash) % colors.length];
}
