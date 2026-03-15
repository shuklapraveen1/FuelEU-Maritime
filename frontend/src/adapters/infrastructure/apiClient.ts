/**
 * API Client — Infrastructure Adapter
 *
 * Axios-based HTTP client. All API calls go through this layer.
 * React components never call fetch/axios directly.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  AdjustedComplianceBalance,
  BankEntry,
  ComplianceBalance,
  Pool,
  Route,
  RouteComparison,
} from '../../core/domain/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 15_000,
  });

  instance.interceptors.response.use(
    (res) => res,
    (error) => {
      const message =
        error.response?.data?.error ??
        error.message ??
        'An unexpected error occurred';
      return Promise.reject(new Error(message));
    }
  );

  return instance;
}

const http = createAxiosInstance();

function unwrap<T>(res: AxiosResponse<{ data: T }>): T {
  return res.data.data;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export interface RouteFilters {
  vesselType?: string;
  fuelType?: string;
  year?: number;
}

export const routesApi = {
  getAll: (filters?: RouteFilters): Promise<Route[]> =>
    http.get<{ data: Route[] }>('/routes', { params: filters }).then(unwrap),

  setBaseline: (routeId: string): Promise<Route> =>
    http.post<{ data: Route }>(`/routes/${routeId}/baseline`).then(unwrap),

  getComparison: (): Promise<RouteComparison[]> =>
    http.get<{ data: RouteComparison[] }>('/routes/comparison').then(unwrap),
};

// ─── Compliance ───────────────────────────────────────────────────────────────

export const complianceApi = {
  getBalances: (): Promise<ComplianceBalance[]> =>
    http.get<{ data: ComplianceBalance[] }>('/compliance/cb').then(unwrap),

  getAdjustedBalances: (): Promise<AdjustedComplianceBalance[]> =>
    http.get<{ data: AdjustedComplianceBalance[] }>('/compliance/adjusted-cb').then(unwrap),
};

// ─── Banking ──────────────────────────────────────────────────────────────────

export const bankingApi = {
  getRecords: (): Promise<BankEntry[]> =>
    http.get<{ data: BankEntry[] }>('/banking/records').then(unwrap),

  bankSurplus: (shipId: string, year: number): Promise<ComplianceBalance> =>
    http.post<{ data: ComplianceBalance }>('/banking/bank', { shipId, year }).then(unwrap),

  applyBanked: (shipId: string, year: number): Promise<ComplianceBalance> =>
    http.post<{ data: ComplianceBalance }>('/banking/apply', { shipId, year }).then(unwrap),
};

// ─── Pooling ──────────────────────────────────────────────────────────────────

export const poolingApi = {
  createPool: (year: number, shipIds: string[]): Promise<Pool> =>
    http.post<{ data: Pool }>('/pools', { year, shipIds }).then(unwrap),
};
