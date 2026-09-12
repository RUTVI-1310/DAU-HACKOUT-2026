import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

/**
 * Supabase client instance.
 * If credentials are not configured, client operations will be skipped or routed to local API.
 */
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Types matching the database tables
export interface DbAsset {
  id: string;
  name: string;
  type: 'WIND' | 'SOLAR';
  location: string;
  state: string;
  capacity_mw: number;
  health_score: number;
  status: 'HEALTHY' | 'WATCH' | 'WARNING' | 'CRITICAL';
  risk: 'LOW' | 'MEDIUM' | 'HIGH';
  priority: 'P1' | 'P2' | 'P3';
  current_power_mw: number;
  expected_power_mw: number;
  power_lost_mw: number;
  revenue_loss_per_hour_inr: number;
  probable_issue: string;
  recommended_action: string;
  assigned_technician_id?: string;
  last_telemetry_at: string;
}

export interface DbWorkOrder {
  id: string;
  asset_id: string;
  issue: string;
  priority: 'P1' | 'P2' | 'P3';
  status: 'ALERT' | 'INSPECTION' | 'ASSIGNED' | 'RESOLVED';
  technician_name: string;
  scheduled_date: string;
  notes: string;
  created_at: string;
  resolved_at?: string;
}

export interface DbTelemetryReading {
  id: number;
  asset_id: string;
  timestamp: string;
  wind_speed?: number;
  rpm?: number;
  vibration?: number;
  temperature: number;
  current?: number;
  power_output_mw: number;
  anomaly_score: number;
  is_anomaly: boolean;
}

/**
 * Fetch all assets from Supabase or fallback to local REST endpoint
 */
export async function fetchFleetAssets() {
  if (supabase) {
    const { data, error } = await supabase
      .from('assets')
      .select('*')
      .order('id');
    if (!error && data && data.length > 0) return data;
  }
  const res = await fetch('/api/assets');
  return res.json();
}

/**
 * Fetch work orders from Supabase or fallback to local REST endpoint
 */
export async function fetchWorkOrders() {
  if (supabase) {
    const { data, error } = await supabase
      .from('work_orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) return data;
  }
  const res = await fetch('/api/work-orders');
  return res.json();
}

/**
 * Advance work order lifecycle status in Supabase or local API
 */
export async function updateWorkOrderStatus(orderId: string, nextStatus: string) {
  if (supabase) {
    const { data, error } = await supabase
      .from('work_orders')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();
    if (!error && data) return data;
  }
  const res = await fetch(`/api/work-orders/${orderId}/advance`, { method: 'PATCH' });
  return res.json();
}
