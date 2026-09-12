-- ====================================================================
-- PREDICTIVE MAINTENANCE PLATFORM (DAU-HACKOUT-2026)
-- Complete PostgreSQL / Supabase Production Schema
-- Team EVILCODER: Rutvi Raval, Krish Shah, Pratham Shah, Hitarth Vyas
-- ====================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. ENUM DEFINITIONS
-- ====================================================================

DO $$ BEGIN
    CREATE TYPE asset_type_enum AS ENUM ('WIND', 'SOLAR');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE asset_status_enum AS ENUM ('HEALTHY', 'WATCH', 'WARNING', 'CRITICAL');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_enum AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE priority_enum AS ENUM ('P1', 'P2', 'P3');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE work_order_status_enum AS ENUM ('ALERT', 'INSPECTION', 'ASSIGNED', 'RESOLVED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE log_tone_enum AS ENUM ('teal', 'amber', 'blue', 'green', 'red');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ====================================================================
-- 2. TABLE DEFINITIONS
-- ====================================================================

-- 2.1 System Parameters & Tariff Configuration
CREATE TABLE IF NOT EXISTS system_config (
    id VARCHAR(32) PRIMARY KEY DEFAULT 'default',
    currency VARCHAR(8) NOT NULL DEFAULT 'INR',
    tariff_rate_per_kwh NUMERIC(8, 2) NOT NULL DEFAULT 6.00,
    anomaly_threshold NUMERIC(4, 3) NOT NULL DEFAULT 0.350,
    efficiency_loss_threshold NUMERIC(4, 3) NOT NULL DEFAULT 0.050,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.2 Certified Field Technicians
CREATE TABLE IF NOT EXISTS technicians (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    specialization VARCHAR(64) NOT NULL, -- e.g., 'Mechanical & Drive-Train', 'Power Electronics', 'Solar Inverter'
    contact_phone VARCHAR(32),
    contact_email VARCHAR(128),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.3 Renewable Assets (Wind Turbines & Solar Inverters)
CREATE TABLE IF NOT EXISTS assets (
    id VARCHAR(32) PRIMARY KEY, -- e.g., 'WT-017', 'ST-008'
    name VARCHAR(128) NOT NULL,
    type asset_type_enum NOT NULL,
    location VARCHAR(128) NOT NULL, -- e.g., 'Kutch North • Gujarat'
    state VARCHAR(64) NOT NULL,
    capacity_mw NUMERIC(6, 2) NOT NULL, -- Nameplate capacity in MW
    health_score INT NOT NULL DEFAULT 100 CHECK (health_score >= 0 AND health_score <= 100),
    status asset_status_enum NOT NULL DEFAULT 'HEALTHY',
    risk risk_enum NOT NULL DEFAULT 'LOW',
    priority priority_enum NOT NULL DEFAULT 'P3',
    current_power_mw NUMERIC(6, 3) NOT NULL,
    expected_power_mw NUMERIC(6, 3) NOT NULL,
    power_lost_mw NUMERIC(6, 3) GENERATED ALWAYS AS (GREATEST(0, expected_power_mw - current_power_mw)) STORED,
    revenue_loss_per_hour_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
    probable_issue TEXT NOT NULL DEFAULT 'No material anomaly',
    recommended_action TEXT NOT NULL DEFAULT 'Continue normal monitoring',
    assigned_technician_id VARCHAR(32) REFERENCES technicians(id) ON DELETE SET NULL,
    last_telemetry_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.4 SCADA High-Frequency Telemetry Readings (Time-Series)
CREATE TABLE IF NOT EXISTS telemetry_readings (
    id BIGSERIAL PRIMARY KEY,
    asset_id VARCHAR(32) NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- Wind specific metrics
    wind_speed NUMERIC(5, 2), -- m/s
    rpm NUMERIC(7, 2), -- rotor/generator RPM
    vibration NUMERIC(5, 2), -- mm/s RMS (ISO 10816-21)
    -- Solar specific metrics
    irradiance NUMERIC(6, 2), -- W/m² (GHI)
    soiling_ratio NUMERIC(4, 3), -- 0.00 to 1.00
    -- Shared electrical & thermal metrics
    temperature NUMERIC(5, 2) NOT NULL, -- °C (Bearing/Inverter)
    phase_current NUMERIC(6, 2), -- Amperes
    grid_voltage NUMERIC(6, 2) DEFAULT 690.0, -- Volts
    power_output_mw NUMERIC(6, 3) NOT NULL, -- MW
    power_efficiency NUMERIC(5, 3), -- actual / expected
    -- Machine Learning anomaly scores
    anomaly_score NUMERIC(5, 3) DEFAULT 0.000, -- 0.000 to 1.000
    is_anomaly BOOLEAN NOT NULL DEFAULT FALSE,
    scenario_tag VARCHAR(32) DEFAULT 'normal' -- 'normal', 'bearing', 'generator', 'gearbox'
);

-- 2.5 Explainable Anomaly Detection Events
CREATE TABLE IF NOT EXISTS anomaly_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id VARCHAR(32) NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    anomaly_score NUMERIC(5, 3) NOT NULL,
    root_cause VARCHAR(128) NOT NULL,
    severity priority_enum NOT NULL DEFAULT 'P2',
    vibration_deviation_pct NUMERIC(6, 2) DEFAULT 0,
    temperature_deviation_pct NUMERIC(6, 2) DEFAULT 0,
    power_loss_mw NUMERIC(6, 3) NOT NULL DEFAULT 0,
    hourly_financial_loss_inr NUMERIC(10, 2) NOT NULL DEFAULT 0,
    model_version VARCHAR(32) DEFAULT 'IsolationForest-v1.4',
    is_acknowledged BOOLEAN NOT NULL DEFAULT FALSE,
    work_order_created BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2.6 Maintenance Work Orders & Dispatch Queue
CREATE TABLE IF NOT EXISTS work_orders (
    id VARCHAR(32) PRIMARY KEY, -- e.g., 'WO-284'
    asset_id VARCHAR(32) NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    issue TEXT NOT NULL,
    priority priority_enum NOT NULL DEFAULT 'P2',
    status work_order_status_enum NOT NULL DEFAULT 'ALERT',
    technician_name VARCHAR(128) NOT NULL,
    technician_id VARCHAR(32) REFERENCES technicians(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2.7 Fleet Activity Trail / Audit Log
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGSERIAL PRIMARY KEY,
    time_display VARCHAR(32) NOT NULL, -- e.g., '09:42:16'
    title TEXT NOT NULL,
    detail TEXT NOT NULL,
    tone log_tone_enum NOT NULL DEFAULT 'teal',
    asset_id VARCHAR(32) REFERENCES assets(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- 3. PERFORMANCE INDEXES
-- ====================================================================

CREATE INDEX IF NOT EXISTS idx_telemetry_asset_timestamp ON telemetry_readings(asset_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_telemetry_timestamp ON telemetry_readings(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_assets_status ON assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_work_orders_asset_id ON work_orders(asset_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_status ON work_orders(status);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_anomaly_events_asset_id ON anomaly_events(asset_id);

-- ====================================================================
-- 4. AUTOMATIC TIMESTAMP TRIGGER
-- ====================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_assets_updated_at ON assets;
CREATE TRIGGER trg_assets_updated_at
    BEFORE UPDATE ON assets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_work_orders_updated_at ON work_orders;
CREATE TRIGGER trg_work_orders_updated_at
    BEFORE UPDATE ON work_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_technicians_updated_at ON technicians;
CREATE TRIGGER trg_technicians_updated_at
    BEFORE UPDATE ON technicians
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ====================================================================
-- 5. FLEET SUMMARY VIEWS (For Instant Dashboard Aggregation)
-- ====================================================================

CREATE OR REPLACE VIEW fleet_kpi_summary AS
SELECT
    COUNT(*) AS total_assets,
    ROUND(SUM(capacity_mw), 1) AS total_capacity_mw,
    ROUND(SUM(current_power_mw), 2) AS current_generation_mw,
    ROUND(SUM(expected_power_mw), 2) AS expected_generation_mw,
    ROUND(SUM(power_lost_mw), 2) AS power_lost_mw,
    ROUND(AVG(health_score)) AS average_health_score,
    ROUND(SUM(revenue_loss_per_hour_inr)) AS total_revenue_loss_per_hour_inr,
    ROUND(SUM(revenue_loss_per_hour_inr) * 24) AS projected_daily_loss_inr,
    COUNT(*) FILTER (WHERE status IN ('WARNING', 'CRITICAL')) AS assets_needing_action,
    COUNT(*) FILTER (WHERE type = 'WIND') AS wind_assets_count,
    COUNT(*) FILTER (WHERE type = 'SOLAR') AS solar_assets_count
FROM assets;

CREATE OR REPLACE VIEW active_alerts_view AS
SELECT
    wo.id AS work_order_id,
    wo.asset_id,
    a.name AS asset_name,
    a.type AS asset_type,
    a.location,
    wo.issue,
    wo.priority,
    wo.status,
    wo.technician_name,
    a.revenue_loss_per_hour_inr,
    wo.scheduled_date,
    wo.created_at
FROM work_orders wo
JOIN assets a ON wo.asset_id = a.id
WHERE wo.status != 'RESOLVED'
ORDER BY
    CASE wo.priority
        WHEN 'P1' THEN 1
        WHEN 'P2' THEN 2
        WHEN 'P3' THEN 3
        ELSE 4
    END,
    a.revenue_loss_per_hour_inr DESC;

-- ====================================================================
-- 6. SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS on all tables
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE telemetry_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE anomaly_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access (anon and authenticated) for hackathon demo evaluation
CREATE POLICY "Public Read Assets" ON assets FOR SELECT USING (true);
CREATE POLICY "Public Update Assets" ON assets FOR UPDATE USING (true);
CREATE POLICY "Public Insert Assets" ON assets FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Telemetry" ON telemetry_readings FOR SELECT USING (true);
CREATE POLICY "Public Insert Telemetry" ON telemetry_readings FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Work Orders" ON work_orders FOR SELECT USING (true);
CREATE POLICY "Public Insert Work Orders" ON work_orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public Update Work Orders" ON work_orders FOR UPDATE USING (true);

CREATE POLICY "Public Read Activity Logs" ON activity_logs FOR SELECT USING (true);
CREATE POLICY "Public Insert Activity Logs" ON activity_logs FOR INSERT WITH CHECK (true);

CREATE POLICY "Public Read Technicians" ON technicians FOR SELECT USING (true);
CREATE POLICY "Public Read Config" ON system_config FOR SELECT USING (true);

-- ====================================================================
-- 7. SUPABASE REALTIME REPLICATION (For Live Telemetry Streams)
-- ====================================================================

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE telemetry_readings;
    ALTER PUBLICATION supabase_realtime ADD TABLE work_orders;
    ALTER PUBLICATION supabase_realtime ADD TABLE activity_logs;
    ALTER PUBLICATION supabase_realtime ADD TABLE assets;
EXCEPTION
    WHEN undefined_object THEN null;
    WHEN duplicate_object THEN null;
END $$;
