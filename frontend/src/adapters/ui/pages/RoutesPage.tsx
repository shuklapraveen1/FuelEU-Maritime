/**
 * Routes Page
 *
 * Displays all maritime routes with filters and baseline management.
 */

import { useState } from 'react';
import { useRoutes, useSetBaseline } from '../hooks/useApi';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  LoadingState,
  SectionHeader,
  Table,
  Td,
  Th,
} from '../components/primitives';
import { useUIStore } from '../../../shared/store';
import { formatIntensity, formatNumber } from '../../../shared/utils';
import { FUELEU_TARGET_INTENSITY } from '../../../core/domain/types';

const VESSEL_TYPES = ['Container', 'BulkCarrier', 'Tanker', 'RoRo'];
const FUEL_TYPES = ['HFO', 'LNG', 'MGO'];
const YEARS = [2024, 2025];

export function RoutesPage() {
  const [filters, setFilters] = useState<{
    vesselType?: string;
    fuelType?: string;
    year?: number;
  }>({});

  const addToast = useUIStore((s) => s.addToast);
  const { data: routes, isLoading, isError, error, refetch } = useRoutes(filters);
  const setBaseline = useSetBaseline();

  const handleSetBaseline = async (routeId: string) => {
    try {
      await setBaseline.mutateAsync(routeId);
      addToast('success', `Route ${routeId} set as baseline`);
    } catch (e) {
      addToast('error', e instanceof Error ? e.message : 'Failed to set baseline');
    }
  };

  return (
    <div className="p-6 animate-fade-in">
      <SectionHeader
        title="Maritime Routes"
        description={`${routes?.length ?? 0} routes • FuelEU target: ${FUELEU_TARGET_INTENSITY} gCO₂/MJ`}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <FilterSelect
          label="Vessel Type"
          options={VESSEL_TYPES}
          value={filters.vesselType}
          onChange={(v) => setFilters((f) => ({ ...f, vesselType: v }))}
        />
        <FilterSelect
          label="Fuel Type"
          options={FUEL_TYPES}
          value={filters.fuelType}
          onChange={(v) => setFilters((f) => ({ ...f, fuelType: v }))}
        />
        <FilterSelect
          label="Year"
          options={YEARS.map(String)}
          value={filters.year?.toString()}
          onChange={(v) => setFilters((f) => ({ ...f, year: v ? Number(v) : undefined }))}
        />
        {(filters.vesselType || filters.fuelType || filters.year) && (
          <button
            onClick={() => setFilters({})}
            className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {isLoading ? (
        <LoadingState message="Fetching routes…" />
      ) : isError ? (
        <ErrorState
          message={error instanceof Error ? error.message : 'Unknown error'}
          onRetry={() => refetch()}
        />
      ) : !routes?.length ? (
        <EmptyState
          title="No routes found"
          description="Try adjusting your filters or seeding the database."
          icon={
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z"
              />
            </svg>
          }
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Route ID</Th>
              <Th>Vessel Type</Th>
              <Th>Fuel Type</Th>
              <Th>Year</Th>
              <Th>GHG Intensity</Th>
              <Th>Fuel (t)</Th>
              <Th>Distance (nm)</Th>
              <Th>Emissions (t)</Th>
              <Th>Status</Th>
              <Th>Action</Th>
            </tr>
          </thead>
          <tbody>
            {routes.map((route) => {
              const isAboveTarget = route.ghgIntensity > FUELEU_TARGET_INTENSITY;
              return (
                <tr key={route.id} className="hover:bg-white/3 transition-colors group">
                  <Td>
                    <span className="font-mono text-ocean-400 font-medium">{route.routeId}</span>
                  </Td>
                  <Td>{route.vesselType}</Td>
                  <Td>
                    <Badge variant="info">{route.fuelType}</Badge>
                  </Td>
                  <Td>
                    <span className="font-mono text-slate-300">{route.year}</span>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs ${isAboveTarget ? 'text-red-400' : 'text-seafoam-400'}`}>
                        {route.ghgIntensity.toFixed(4)}
                      </span>
                      <span className="text-slate-600 text-xs">gCO₂/MJ</span>
                    </div>
                  </Td>
                  <Td className="font-mono text-slate-300">{formatNumber(route.fuelConsumption)}</Td>
                  <Td className="font-mono text-slate-300">{formatNumber(route.distance)}</Td>
                  <Td className="font-mono text-slate-300">{formatNumber(route.totalEmissions)}</Td>
                  <Td>
                    {route.isBaseline ? (
                      <Badge variant="warning">Baseline</Badge>
                    ) : isAboveTarget ? (
                      <Badge variant="danger">Non-compliant</Badge>
                    ) : (
                      <Badge variant="success">Compliant</Badge>
                    )}
                  </Td>
                  <Td>
                    <Button
                      size="sm"
                      variant={route.isBaseline ? 'ghost' : 'secondary'}
                      disabled={route.isBaseline}
                      loading={setBaseline.isPending && setBaseline.variables === route.routeId}
                      onClick={() => handleSetBaseline(route.routeId)}
                    >
                      {route.isBaseline ? '✓ Baseline' : 'Set Baseline'}
                    </Button>
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-500">
        <span>Target: {formatIntensity(FUELEU_TARGET_INTENSITY)}</span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-seafoam-400" /> Below target
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-400" /> Above target
        </span>
      </div>
    </div>
  );
}

// ─── Filter Select ────────────────────────────────────────────────────────────

function FilterSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value?: string;
  onChange: (v: string | undefined) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-xs text-slate-500 whitespace-nowrap">{label}</label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="px-2.5 py-1.5 text-xs rounded-lg bg-white/8 border border-white/10 text-slate-200 focus:outline-none focus:ring-2 focus:ring-ocean-500/50 cursor-pointer hover:bg-white/12 transition-colors"
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
