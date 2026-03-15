/**
 * Banking Page — FuelEU Article 20
 *
 * Displays compliance balances and allows banking/applying surplus.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  useApplyBanked,
  useBankSurplus,
  useComplianceBalances,
} from '../hooks/useApi';
import {
  Badge,
  Button,
  ErrorState,
  KpiCard,
  LoadingState,
  SectionHeader,
  Table,
  Td,
  Th,
} from '../components/primitives';
import { useUIStore } from '../../../shared/store';
import { formatCB, formatCBShort } from '../../../shared/utils';
import type { ComplianceBalance } from '../../../core/domain/types';

export function BankingPage() {
  const addToast = useUIStore((s) => s.addToast);
  const { data: balances, isLoading, isError, error, refetch } = useComplianceBalances();
  const bankSurplus = useBankSurplus();
  const applyBanked = useApplyBanked();

  const totalCbBefore = balances?.reduce((s, b) => s + b.cbBefore, 0) ?? 0;
  const totalBanked   = balances?.reduce((s, b) => s + b.banked, 0) ?? 0;
  const totalCbAfter  = balances?.reduce((s, b) => s + b.cbAfter, 0) ?? 0;

  const handleBank = async (item: ComplianceBalance) => {
    try {
      await bankSurplus.mutateAsync({ shipId: item.shipId, year: item.year });
      addToast('success', `Banked surplus for ${item.shipId} (${item.year})`);
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Banking failed');
    }
  };

  const handleApply = async (item: ComplianceBalance) => {
    try {
      await applyBanked.mutateAsync({ shipId: item.shipId, year: item.year });
      addToast('success', `Applied banked surplus for ${item.shipId} (${item.year})`);
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Apply failed');
    }
  };

  const chartData = (balances ?? []).map((b) => ({
    name: b.shipId,
    cbBefore: b.cbBefore / 1_000_000,
    banked: b.banked / 1_000_000,
    cbAfter: b.cbAfter / 1_000_000,
  }));

  return (
    <div className="p-6 animate-fade-in">
      <SectionHeader
        title="Banking Mechanism"
        description="FuelEU Article 20 — Bank surplus compliance balance for future use"
      />

      {isLoading ? (
        <LoadingState message="Loading compliance balances…" />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'Unknown error'}
          onRetry={() => refetch()}
        />
      ) : (
        <div className="space-y-8">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard
              label="Total CB (Before)"
              value={formatCB(totalCbBefore)}
              sub="Sum of all ship compliance balances"
              variant={totalCbBefore >= 0 ? 'positive' : 'negative'}
              icon={<CbIcon />}
            />
            <KpiCard
              label="Total Banked"
              value={formatCB(totalBanked)}
              sub="Surplus stored under Article 20"
              variant="neutral"
              icon={<BankIcon />}
            />
            <KpiCard
              label="Net CB (After)"
              value={formatCB(totalCbAfter)}
              sub="CB after banking applied"
              variant={totalCbAfter >= 0 ? 'positive' : 'negative'}
              icon={<AfterIcon />}
            />
          </div>

          {/* Chart */}
          <div className="rounded-xl border border-white/10 bg-white/3 p-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-4">
              Compliance Balance per Ship (MgCO₂eq)
            </h3>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8', fontSize: 11, fontFamily: 'JetBrains Mono' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v: number) => `${v.toFixed(0)}M`}
                />
                <Tooltip content={<BankingTooltip />} />
                <Bar dataKey="cbBefore" radius={[4, 4, 0, 0]} maxBarSize={40} name="CB Before">
                  {chartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={entry.cbBefore >= 0 ? '#22c55e' : '#ef4444'}
                      opacity={0.8}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Table */}
          <div>
            <h3 className="text-sm font-semibold text-slate-300 mb-3">Ship Balances</h3>
            <Table>
              <thead>
                <tr>
                  <Th>Ship ID</Th>
                  <Th>Year</Th>
                  <Th>CB Before</Th>
                  <Th>Banked</Th>
                  <Th>CB After</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {(balances ?? []).map((item) => {
                  const canBank  = item.cbBefore > 0 && item.banked < item.cbBefore;
                  const canApply = item.banked > 0;
                  const isMutating =
                    (bankSurplus.isPending && bankSurplus.variables?.shipId === item.shipId) ||
                    (applyBanked.isPending && applyBanked.variables?.shipId === item.shipId);

                  return (
                    <tr key={`${item.shipId}-${item.year}`} className="hover:bg-white/3 transition-colors">
                      <Td>
                        <span className="font-mono text-ocean-400">{item.shipId}</span>
                      </Td>
                      <Td><span className="font-mono">{item.year}</span></Td>
                      <Td>
                        <span className={`font-mono text-xs ${item.cbBefore >= 0 ? 'text-seafoam-400' : 'text-red-400'}`}>
                          {formatCBShort(item.cbBefore)}
                        </span>
                      </Td>
                      <Td>
                        <span className="font-mono text-xs text-ocean-400">
                          {item.banked > 0 ? formatCBShort(item.banked) : '—'}
                        </span>
                      </Td>
                      <Td>
                        <span className={`font-mono text-xs ${item.cbAfter >= 0 ? 'text-seafoam-400' : 'text-red-400'}`}>
                          {formatCBShort(item.cbAfter)}
                        </span>
                      </Td>
                      <Td>
                        {item.cbBefore > 0 ? (
                          <Badge variant="success">Surplus</Badge>
                        ) : item.cbBefore < 0 ? (
                          <Badge variant="danger">Deficit</Badge>
                        ) : (
                          <Badge variant="neutral">Neutral</Badge>
                        )}
                      </Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            disabled={!canBank || isMutating}
                            loading={bankSurplus.isPending && bankSurplus.variables?.shipId === item.shipId}
                            onClick={() => handleBank(item)}
                          >
                            Bank
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            disabled={!canApply || isMutating}
                            loading={applyBanked.isPending && applyBanked.variables?.shipId === item.shipId}
                            onClick={() => handleApply(item)}
                          >
                            Apply
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          {/* Article 20 explanation */}
          <div className="rounded-xl border border-ocean-500/20 bg-ocean-500/5 p-4 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-ocean-300">FuelEU Article 20 — Banking</p>
            <p>
              Ships with a positive compliance balance (surplus) may bank that surplus for use in
              the following reporting year. The banked amount is subtracted from the current CB
              and can be applied to offset a future deficit.
            </p>
            <p className="font-mono text-slate-500">
              CB After = CB Before − Banked &nbsp;|&nbsp; Applied CB = CB Before + Banked Amount
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Icons ────────────────────────────────────────────────────────────────────

function CbIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z"
      />
    </svg>
  );
}

function AfterIcon() {
  return (
    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function BankingTooltip({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const value = payload[0].value;
  return (
    <div className="bg-slate-900 border border-white/15 rounded-lg p-3 text-xs shadow-xl">
      <p className="font-mono font-medium text-white mb-1">{label}</p>
      <p className={value >= 0 ? 'text-seafoam-400' : 'text-red-400'}>
        CB: {value >= 0 ? '+' : ''}{value.toFixed(2)} MgCO₂eq
      </p>
    </div>
  );
}
