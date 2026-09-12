/**
 * GridSense AI – frontend API client
 * Point VITE_API_BASE at the backend (default http://localhost:4000).
 */
import type {
  ExecutionLog,
  ForecastRequest,
  ForecastResponse,
  Plant,
  SimulationParameters,
} from '../types';

// Re-export request shape for convenience (matches backend)
export type { ForecastRequest };

const BASE = (import.meta as any).env?.VITE_API_BASE || 'http://localhost:4000';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.success === false) {
    throw new Error(data.error || `HTTP ${res.status}`);
  }
  return data as T;
}

export async function fetchPlants(): Promise<{
  plants: Plant[];
  totals: { capacityMW: number; bessPowerMW: number; bessCapacityMWh: number };
}> {
  return request('/api/plants');
}

export async function fetchPlant(id: string): Promise<{ plant: Plant }> {
  return request(`/api/plants/${encodeURIComponent(id)}`);
}

export async function runForecast(
  body: Partial<SimulationParameters> & { enhanceWithAI?: boolean } = {}
): Promise<ForecastResponse> {
  return request('/api/forecast', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchScenarioBrief(payload: {
  preset: string;
  horizonHours: number;
  peakGenerationMW: number;
  overGenerationHours: number;
  underGenerationHours: number;
  criticalActions: number;
}): Promise<{ brief: string; geminiAvailable: boolean }> {
  return request('/api/forecast/scenario-brief', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function listDispatches(limit = 50): Promise<{ logs: ExecutionLog[] }> {
  return request(`/api/dispatch?limit=${limit}`);
}

export async function createDispatch(input: {
  actionId: string;
  title: string;
  type: ExecutionLog['type'];
  magnitudeMW: number;
  targetAsset: string;
  operator?: string;
  notes?: string;
}): Promise<{ log: ExecutionLog }> {
  return request('/api/dispatch', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function updateDispatch(
  id: string,
  status: ExecutionLog['status'],
  notes?: string
): Promise<{ log: ExecutionLog }> {
  return request(`/api/dispatch/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({ status, notes }),
  });
}

export async function healthCheck(): Promise<{
  success: boolean;
  service: string;
  gemini: string;
}> {
  return request('/api/health');
}
