/**
 * Pooling Page — FuelEU Article 21
 *
 * Allows selecting ships and creating compliance pools.
 */

import { useState } from 'react';
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useAdjustedBalances, useCreatePool } from '../hooks/useApi';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  KpiCard,
  LoadingState,
  SectionHeader,
  Table,
  Td,
  Th,
} from '../components/primitives';
import { useUIStore } from '../../../shared/store';
import { formatCB, formatCBShort, shipColor } from '../../../shared/utils';
import type { Pool } from '../../../core/domain/types';

const CURRENT_YEAR = 2024;

export function PoolingPage() {
  const addToast = useUIStore((s) => s.addToast);
  const { data: adjustedBalances, isLoading, isError, error, refetch } = useAdjustedBalances();
  const createPool = useCreatePool();

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastPool, setLastPool] = useState<Pool | null>(null);

  const toggleShip = (shipId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(shipId)) next.delete(shipId);
      else next.add(shipId);
      return next;
    });
  };

  const selectedBalances = (adjustedBalances ?? []).filter((b) =>
    selectedIds.has(b.shipId)
  );
  const poolSum = selectedBalances.reduce((s, b) => s + b.adjustedCb, 0);
  const canCreatePool = selectedIds.size >= 2 && poolSum >= 0;

  const handleCreatePool = async () => {
    try {
      const pool = await createPool.mutateAsync({
        year: CURRENT_YEAR,
        shipIds: [...selectedIds],
      });
      setLastPool(pool);
      setSelectedIds(new Set());
      addToast('success', `Pool created — ${pool.isValid ? 'Valid ✓' : 'Invalid ✗'}`);
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Pool creation failed');
    }
  };

  // Pie chart data for selected ships
  const pieData = selectedBalances.map((b) => ({
    name: b.shipId,
    value: Math.abs(b.adjustedCb) / 1_000_000,
    raw: b.adjustedCb,
  }));

  return (
    <div className="p-6 animate-fade-in">
      <SectionHeader
        title="Compliance Pooling"
        description="FuelEU Article 21 — Combine ships to offset deficits with surplus"
      />

      {isLoading ? (
        <LoadingState message="Loading adjusted compliance balances…" />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'Unknown error'}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-8">
          {/* Pool summary KPIs (when ships selected) */}
          {selectedIds.size > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-slide-up">
              <KpiCard
                label="Ships Selected"
                value={String(selectedIds.size)}
                sub="Minimum 2 required"
                variant="neutral"
              />
              <KpiCard
                label="Pool Sum"
                value={formatCB(poolSum)}
                sub="Must be ≥ 0 for valid pool"
                variant={poolSum >= 0 ? 'positive' : 'negative'}
              />
              <KpiCard
                label="Pool Status"
                value={poolSum >= 0 ? 'Valid' : 'Invalid'}
                sub={poolSum >= 0 ? 'Ready to create' : 'Add more surplus ships'}
                variant={poolSum >= 0 ? 'positive' : 'negative'}
              />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Ship selection table */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-300">
                  Available Ships
                  <span className="ml-2 text-slate-600 font-normal">
                    ({adjustedBalances?.length ?? 0} ships)
                  </span>
                </h3>
                {selectedIds.size > 0 && (
                  <button
                    onClick={() => setSelectedIds(new Set())}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    Clear selection
                  </button>
                )}
              </div>

              {!adjustedBalances?.length ? (
                <EmptyState
                  title="No compliance data available"
                  description="Seed the database to populate compliance records."
                />
              ) : (
                <Table>
                  <thead>
                    <tr>
                      <Th className="w-10" />
                      <Th>Ship ID</Th>
                      <Th>Year</Th>
                      <Th>Adjusted CB</Th>
                      <Th>Status</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {(adjustedBalances ?? []).map((item) => {
                      const selected = selectedIds.has(item.shipId);
                      return (
                        <tr
                          key={`${item.shipId}-${item.year}`}
                          onClick={() => toggleShip(item.shipId)}
                          className={`
                            cursor-pointer transition-colors
                            ${selected
                              ? 'bg-ocean-600/10 border-l-2 border-ocean-500'
                              : 'hover:bg-white/3'}
                          `}
                        >
                          <Td className="w-10">
                            <div className={`
                              h-4 w-4 rounded border-2 transition-colors flex items-center justify-center
                              ${selected
                                ? 'bg-ocean-500 border-ocean-500'
                                : 'border-white/20 hover:border-white/40'}
                            `}>
                              {selected && (
                                <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="currentColor">
                                  <path d="M3.707 5.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4a1 1 0 00-1.414-1.414L5 6.586 3.707 5.293z" />
                                </svg>
                              )}
                            </div>
                          </Td>
                          <Td>
                            <div className="flex items-center gap-2">
                              <span
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: shipColor(item.shipId) }}
                              />
                              <span className="font-mono text-slate-200">{item.shipId}</span>
                            </div>
                          </Td>
                          <Td><span className="font-mono">{item.year}</span></Td>
                          <Td>
                            <span className={`font-mono text-xs ${item.adjustedCb >= 0 ? 'text-seafoam-400' : 'text-red-400'}`}>
                              {formatCBShort(item.adjustedCb)}
                            </span>
                          </Td>
                          <Td>
                            {item.adjustedCb > 0 ? (
                              <Badge variant="success">Surplus</Badge>
                            ) : item.adjustedCb < 0 ? (
                              <Badge variant="danger">Deficit</Badge>
                            ) : (
                              <Badge variant="neutral">Neutral</Badge>
                            )}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </Table>
              )}

              {/* Create pool button */}
              <div className="mt-4 flex items-center gap-3">
                <Button
                  variant="primary"
                  disabled={!canCreatePool}
                  loading={createPool.isPending}
                  onClick={handleCreatePool}
                >
                  Create Pool ({selectedIds.size} ships)
                </Button>
                {selectedIds.size >= 2 && !canCreatePool && (
                  <p className="text-xs text-red-400">
                    Pool sum is negative — add ships with surplus
                  </p>
                )}
              </div>
            </div>

            {/* Right panel: pie chart + last pool result */}
            <div className="space-y-6">
              {/* Pie chart */}
              {pieData.length > 0 && (
                <div className="rounded-xl border border-white/10 bg-white/3 p-4">
                  <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
                    Selection Overview
                  </h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={72}
                        paddingAngle={3}
                      >
                        {pieData.map((entry) => (
                          <Cell
                            key={entry.name}
                            fill={entry.raw >= 0 ? '#22c55e' : '#ef4444'}
                            opacity={0.85}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [`${v.toFixed(2)} MgCO₂eq`, 'Adjusted CB']}
                        contentStyle={{
                          background: '#0f172a',
                          border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '8px',
                          fontSize: '11px',
                        }}
                      />
                      <Legend
                        formatter={(value) => (
                          <span style={{ color: '#94a3b8', fontSize: '11px' }}>{value}</span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Last pool result */}
              {lastPool && (
                <div className={`
                  rounded-xl border p-4 animate-slide-up
                  ${lastPool.isValid
                    ? 'border-seafoam-500/30 bg-seafoam-500/5'
                    : 'border-red-500/30 bg-red-500/5'}
                `}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-semibold text-slate-300">Last Pool Result</h3>
                    <Badge variant={lastPool.isValid ? 'success' : 'danger'}>
                      {lastPool.isValid ? '✓ Valid' : '✗ Invalid'}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {lastPool.members.map((m) => (
                      <div key={m.shipId} className="flex items-center justify-between text-xs">
                        <span className="font-mono text-slate-400">{m.shipId}</span>
                        <div className="flex items-center gap-2">
                          <span className={`font-mono ${m.cbBefore >= 0 ? 'text-seafoam-400' : 'text-red-400'}`}>
                            {formatCBShort(m.cbBefore)}
                          </span>
                          <svg className="h-3 w-3 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                          <span className={`font-mono ${m.cbAfter >= 0 ? 'text-seafoam-400' : 'text-red-400'}`}>
                            {formatCBShort(m.cbAfter)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-3 text-[10px] text-slate-600 font-mono">
                    Pool ID: {lastPool.id.slice(0, 8)}…
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Article 21 explanation */}
          <div className="rounded-xl border border-ocean-500/20 bg-ocean-500/5 p-4 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-ocean-300">FuelEU Article 21 — Pooling</p>
            <p>
              Multiple ships may form a compliance pool. The combined surplus of all pool members
              is used to offset the deficits. The pool is valid only if the total adjusted CB ≥ 0,
              no deficit ship exits worse than it entered, and no surplus ship exits with a negative CB.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
