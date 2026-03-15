/**
 * React Query Hooks — Application Port (inbound)
 *
 * All server-state queries and mutations live here.
 * Components import hooks, never the API client directly.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import {
  bankingApi,
  complianceApi,
  poolingApi,
  RouteFilters,
  routesApi,
} from '../../infrastructure/apiClient';

// ─── Query Keys ───────────────────────────────────────────────────────────────

export const queryKeys = {
  routes: (filters?: RouteFilters) => ['routes', filters] as const,
  comparison: () => ['routes', 'comparison'] as const,
  complianceBalances: () => ['compliance', 'cb'] as const,
  adjustedBalances: () => ['compliance', 'adjusted-cb'] as const,
  bankingRecords: () => ['banking', 'records'] as const,
};

// ─── Routes ───────────────────────────────────────────────────────────────────

export function useRoutes(filters?: RouteFilters) {
  return useQuery({
    queryKey: queryKeys.routes(filters),
    queryFn: () => routesApi.getAll(filters),
  });
}

export function useSetBaseline() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (routeId: string) => routesApi.setBaseline(routeId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['routes'] });
    },
  });
}

export function useRouteComparison() {
  return useQuery({
    queryKey: queryKeys.comparison(),
    queryFn: routesApi.getComparison,
    retry: false, // don't retry — might fail because no baseline is set
  });
}

// ─── Compliance ───────────────────────────────────────────────────────────────

export function useComplianceBalances() {
  return useQuery({
    queryKey: queryKeys.complianceBalances(),
    queryFn: complianceApi.getBalances,
  });
}

export function useAdjustedBalances() {
  return useQuery({
    queryKey: queryKeys.adjustedBalances(),
    queryFn: complianceApi.getAdjustedBalances,
  });
}

// ─── Banking ──────────────────────────────────────────────────────────────────

export function useBankingRecords() {
  return useQuery({
    queryKey: queryKeys.bankingRecords(),
    queryFn: bankingApi.getRecords,
  });
}

export function useBankSurplus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shipId, year }: { shipId: string; year: number }) =>
      bankingApi.bankSurplus(shipId, year),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance'] });
      qc.invalidateQueries({ queryKey: ['banking'] });
    },
  });
}

export function useApplyBanked() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shipId, year }: { shipId: string; year: number }) =>
      bankingApi.applyBanked(shipId, year),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance'] });
      qc.invalidateQueries({ queryKey: ['banking'] });
    },
  });
}

// ─── Pooling ──────────────────────────────────────────────────────────────────

export function useCreatePool() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ year, shipIds }: { year: number; shipIds: string[] }) =>
      poolingApi.createPool(year, shipIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['compliance'] });
    },
  });
}
