import { v4 as uuidv4 } from 'uuid';
import type { ActionType, ExecutionLog } from '../types/index.js';

/** In-memory store. Replace with Redis / Postgres in production. */
const logs: ExecutionLog[] = [
  {
    id: 'DISP-8921',
    actionId: 'INIT-BESS-CHG',
    title: 'Dispatch BESS Fleet: Fast Bulk Charging (160 MW)',
    type: 'BESS_CHARGE',
    magnitudeMW: 160,
    targetAsset: 'Desert Sun & Valley BESS Hubs',
    dispatchedAt: new Date(Date.now() - 3600_000).toISOString(),
    operator: 'OP-421 (Grid Shift Lead)',
    status: 'COMPLETED',
    notes: 'Executed automated setpoint to absorb midday solar surge.',
  },
];

export function listLogs(limit = 50): ExecutionLog[] {
  return [...logs]
    .sort((a, b) => new Date(b.dispatchedAt).getTime() - new Date(a.dispatchedAt).getTime())
    .slice(0, limit);
}

export function getLog(id: string): ExecutionLog | undefined {
  return logs.find((l) => l.id === id);
}

export interface DispatchInput {
  actionId: string;
  title: string;
  type: ActionType;
  magnitudeMW: number;
  targetAsset: string;
  operator?: string;
  notes?: string;
}

export function createDispatch(input: DispatchInput): ExecutionLog {
  const log: ExecutionLog = {
    id: `DISP-${uuidv4().slice(0, 8).toUpperCase()}`,
    actionId: input.actionId,
    title: input.title,
    type: input.type,
    magnitudeMW: input.magnitudeMW,
    targetAsset: input.targetAsset,
    dispatchedAt: new Date().toISOString(),
    operator: input.operator || 'SYSTEM',
    status: 'ACTIVE',
    notes: input.notes || 'Dispatched via GridSense AI Action Center.',
  };
  logs.unshift(log);
  // Cap memory growth
  if (logs.length > 500) logs.length = 500;
  return log;
}

export function updateDispatchStatus(
  id: string,
  status: ExecutionLog['status'],
  notes?: string
): ExecutionLog | null {
  const log = logs.find((l) => l.id === id);
  if (!log) return null;
  log.status = status;
  if (notes) log.notes = notes;
  return log;
}
