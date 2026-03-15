/**
 * Compare Page
 *
 * Displays route comparison against baseline + compliance chart.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useRouteComparison, useRoutes } from '../hooks/useApi';
import {
  Badge,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
  Table,
  Td,
  Th,
} from '../components/primitives';
import { FUELEU_TARGET_INTENSITY } from '../../../core/domain/types';
import { formatPercent } from '../../../shared/utils';

export function ComparePage() {
  const { data: comparison, isLoading, isError, error, refetch } = useRouteComparison();
  const { data: routes } = useRoutes();

  const baseline = routes?.find((r) => r.isBaseline);
  type ChartRow = {
  name: string
  intensity: number
  isBaseline: boolean
  isCompliant: boolean
  }
  const chartData: ChartRow[] = comparison
    ? [
        {
        name: comparison[0]?.baselineRouteId ?? 'Baseline',
        intensity: comparison[0]?.baselineIntensity ?? 0,
        isBaseline: true,
        isCompliant: true,
        },
        ...(comparison ?? []).map((c) => ({
          name: c.comparisonRouteId,
          intensity: c.comparisonIntensity,
          isBaseline: false,
          isCompliant: c.isCompliant,
        })),
      ]
    : [];

  return (
    <div className="p-6 animate-fade-in">
      <SectionHeader
        title="Route Comparison"
        description={
          baseline
            ? `Baseline: ${baseline.routeId} (${baseline.ghgIntensity} gCO₂/MJ)`
            : 'Set a baseline route in the Routes tab first'
        }
      />

      {isLoading ? (
        <LoadingState message="Loading comparison data…" />
      ) : isError ? (
        <ErrorState
          message={
            error instanceof Error
              ? error.message
              : 'Failed to load comparison data'
          }
          onRetry={() => refetch()}
        />
      ) : !comparison?.length ? (
        <EmptyState
          title="No comparison data"
          description="Set a baseline route in the Routes tab, then return here to compare."
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5"
              />
            </svg>
          }
        />
      ) : (
        <div className="space-y-8">
          {/* Chart */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">
              GHG Intensity vs FuelEU Target
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  domain={['auto', 'auto']}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => v.toFixed(1)}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine
                  y={FUELEU_TARGET_INTENSITY}
                  stroke="#22c55e"
                  strokeDasharray="6 3"
                  strokeWidth={1.5}
                  label={{
                    value: `Target: ${FUELEU_TARGET_INTENSITY}`,
                    fill: '#4ade7e',
                    fontSize: 10,
                    position: 'right',
                  }}
                />
                <Bar dataKey="intensity" radius={[4, 4, 0, 0]} maxBarSize={56}>
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.isBaseline
                          ? '#0c8be7'
                          : entry.isCompliant
                          ? '#22c55e'
                          : '#ef4444'
                      }
                      opacity={0.85}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Chart legend */}
            <div className="flex flex-wrap gap-4 mt-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-ocean-500" /> Baseline
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-seafoam-500" /> Compliant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-red-500" /> Non-compliant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border border-seafoam-500 border-dashed bg-transparent" />
                Target ({FUELEU_TARGET_INTENSITY} gCO₂/MJ)
              </span>
            </div>
          </div>

          {/* Comparison table */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Comparison Details</h3>
            <Table>
              <thead>
                <tr>
                  <Th>Baseline Route</Th>
                  <Th>Comparison Route</Th>
                  <Th>Baseline Intensity</Th>
                  <Th>Comparison Intensity</Th>
                  <Th>Δ vs Baseline</Th>
                  <Th>Δ vs Target</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => {
                  const deltaVsTarget = row.comparisonIntensity - FUELEU_TARGET_INTENSITY;
                  return (
                    <tr key={row.comparisonRouteId} className="hover:bg-white/3 transition-colors">
                      <Td>
                        <span className="font-mono text-ocean-400">{row.baselineRouteId}</span>
                      </Td>
                      <Td>
                        <span className="font-mono text-slate-200">{row.comparisonRouteId}</span>
                      </Td>
                      <Td>
                        <span className="font-mono text-xs text-slate-300">
                          {row.baselineIntensity.toFixed(4)}
                        </span>
                      </Td>
                      <Td>
                        <span className={`font-mono text-xs ${row.isCompliant ? 'text-seafoam-400' : 'text-red-400'}`}>
                          {row.comparisonIntensity.toFixed(4)}
                        </span>
                      </Td>
                      <Td>
                        <span className={`font-mono text-xs ${row.percentDifference <= 0 ? 'text-seafoam-400' : 'text-red-400'}`}>
                          {formatPercent(row.percentDifference)}
                        </span>
                      </Td>
                      <Td>
                        <span className={`font-mono text-xs ${deltaVsTarget <= 0 ? 'text-seafoam-400' : 'text-red-400'}`}>
                          {deltaVsTarget > 0 ? '+' : ''}{deltaVsTarget.toFixed(4)}
                        </span>
                      </Td>
                      <Td>
                        {row.isCompliant ? (
                          <Badge variant="success">✓ Compliant</Badge>
                        ) : (
                          <Badge variant="danger">✗ Non-compliant</Badge>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>

            {/* Formula note */}
            <p className="mt-3 text-xs text-slate-600 font-mono">
              Δ = ((comparison / baseline) − 1) × 100 &nbsp;|&nbsp;
              Compliant if intensity ≤ {FUELEU_TARGET_INTENSITY} gCO₂/MJ
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  const diff = value - FUELEU_TARGET_INTENSITY;
  return (
    <div className="bg-slate-900 border border-white/15 rounded-lg p-3 text-xs shadow-xl">
      <p className="font-mono font-medium text-white mb-1">{label}</p>
      <p className="text-slate-300">
        Intensity: <span className="text-white font-mono">{value.toFixed(4)}</span> gCO₂/MJ
      </p>
      <p className={diff > 0 ? 'text-red-400' : 'text-seafoam-400'}>
        vs target: {diff > 0 ? '+' : ''}{diff.toFixed(4)}
      </p>
    </div>
  );
}
