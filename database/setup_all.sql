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
    CREATE TYPE user_role_enum AS ENUM ('GRID_OPERATOR', 'UTILITY_COMPANY', 'PLANT_OWNER', 'ENERGY_TRADER');
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

-- 2.0 Role-Based Users (Problem Statement Personas)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'GRID_OPERATOR',
    organization VARCHAR(128) NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login_at TIMESTAMPTZ
);

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
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
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
-- ====================================================================
-- PREDICTIVE MAINTENANCE PLATFORM (DAU-HACKOUT-2026)
-- Complete Seed Data Script (18 Assets, Historical Telemetry & Orders)
-- Team EVILCODER: Rutvi Raval, Krish Shah, Pratham Shah, Hitarth Vyas
-- ====================================================================

-- 0. Seed Users (Problem Statement Personas)
INSERT INTO users (id, name, email, role, organization, password_hash)
VALUES
    ('usr_grid_01', 'Neel Sharma', 'operator@gridsense.energy', 'GRID_OPERATOR', 'Gujarat State Load Dispatch Center (SLDC)', '$2a$12$e8q4L51N.z4yN9qV2b08YeK38PjW4XbI3vF2'),
    ('usr_util_02', 'Priya Patel', 'utility@tatapower.com', 'UTILITY_COMPANY', 'Tata Power Transmission & Distribution', '$2a$12$e8q4L51N.z4yN9qV2b08YeK38PjW4XbI3vF2'),
    ('usr_plant_03', 'Aarav Mehta', 'owner@adanigreen.com', 'PLANT_OWNER', 'Adani Green Energy Ltd (Kutch & Pavagada)', '$2a$12$e8q4L51N.z4yN9qV2b08YeK38PjW4XbI3vF2'),
    ('usr_trade_04', 'Vikram Malhotra', 'trader@iexindia.com', 'ENERGY_TRADER', 'Indian Energy Exchange (IEX) Power Desk', '$2a$12$e8q4L51N.z4yN9qV2b08YeK38PjW4XbI3vF2')
ON CONFLICT (email) DO NOTHING;

-- 1. System Configuration
INSERT INTO system_config (id, currency, tariff_rate_per_kwh, anomaly_threshold, efficiency_loss_threshold)
VALUES ('default', 'INR', 6.00, 0.350, 0.050)
ON CONFLICT (id) DO UPDATE SET
    tariff_rate_per_kwh = EXCLUDED.tariff_rate_per_kwh,
    anomaly_threshold = EXCLUDED.anomaly_threshold;

-- 2. Certified Technicians
INSERT INTO technicians (id, name, specialization, contact_phone, contact_email)
VALUES
    ('TECH-001', 'Aarav Mehta', 'Drive-Train & Mechanical Bearings', '+91 98765 43210', 'aarav.mehta@evilcoder.grid'),
    ('TECH-002', 'Mira Shah', 'Generator Windings & Nacelle Cooling', '+91 98765 43211', 'mira.shah@evilcoder.grid'),
    ('TECH-003', 'Kabir Rao', 'Solar Inverter Electronics & Thermal Heat-Sinks', '+91 98765 43212', 'kabir.rao@evilcoder.grid'),
    ('TECH-004', 'Rohan Das', 'PV Module Soiling & String Balancing', '+91 98765 43213', 'rohan.das@evilcoder.grid'),
    ('TECH-005', 'Priya Patel', 'High-Voltage Switchgear & SCADA Telemetry', '+91 98765 43214', 'priya.patel@evilcoder.grid')
ON CONFLICT (id) DO NOTHING;

-- 3. 18 Renewable Assets (Wind & Solar across India)
INSERT INTO assets (id, name, type, location, state, capacity_mw, health_score, status, risk, priority, current_power_mw, expected_power_mw, revenue_loss_per_hour_inr, probable_issue, recommended_action, assigned_technician_id, last_telemetry_at)
VALUES
    -- WIND ASSETS (Primary Demo Focus: WT-017)
    ('WT-017', 'Kutch Wind Unit 17', 'WIND', 'Kutch North • Gujarat', 'Gujarat', 2.00, 63, 'WARNING', 'HIGH', 'P1', 1.600, 1.950, 2100.00, 'Bearing degradation', 'Inspect drive-train bearing within 24 hours', 'TECH-001', NOW() - INTERVAL '12 SECONDS'),
    ('WT-004', 'Kutch Wind Unit 04', 'WIND', 'Kutch North • Gujarat', 'Gujarat', 2.00, 91, 'HEALTHY', 'LOW', 'P3', 1.870, 1.920, 300.00, 'No material anomaly', 'Continue normal monitoring', NULL, NOW() - INTERVAL '2 MINUTES'),
    ('WT-021', 'Jaisalmer Ridge Unit 21', 'WIND', 'Jaisalmer Ridge • Rajasthan', 'Rajasthan', 2.00, 76, 'WATCH', 'MEDIUM', 'P2', 1.720, 1.900, 1080.00, 'Early temperature drift', 'Review nacelle cooling at next round', 'TECH-002', NOW() - INTERVAL '4 MINUTES'),
    ('WT-001', 'Kutch Wind Unit 01', 'WIND', 'Kutch North • Gujarat', 'Gujarat', 2.00, 95, 'HEALTHY', 'LOW', 'P3', 1.890, 1.910, 120.00, 'No material anomaly', 'Continue normal monitoring', NULL, NOW() - INTERVAL '1 MINUTE'),
    ('WT-002', 'Kutch Wind Unit 02', 'WIND', 'Kutch North • Gujarat', 'Gujarat', 2.00, 93, 'HEALTHY', 'LOW', 'P3', 1.880, 1.900, 120.00, 'No material anomaly', 'Continue normal monitoring', NULL, NOW() - INTERVAL '3 MINUTES'),
    ('WT-008', 'Jaisalmer Ridge Unit 08', 'WIND', 'Jaisalmer Ridge • Rajasthan', 'Rajasthan', 2.00, 89, 'HEALTHY', 'LOW', 'P3', 1.840, 1.890, 300.00, 'No material anomaly', 'Continue normal monitoring', NULL, NOW() - INTERVAL '5 MINUTES'),
    ('WT-012', 'Muppandal Ridge Unit 12', 'WIND', 'Muppandal • Tamil Nadu', 'Tamil Nadu', 2.10, 92, 'HEALTHY', 'LOW', 'P3', 1.980, 2.020, 240.00, 'No material anomaly', 'Continue normal monitoring', NULL, NOW() - INTERVAL '2 MINUTES'),
    ('WT-015', 'Muppandal Ridge Unit 15', 'WIND', 'Muppandal • Tamil Nadu', 'Tamil Nadu', 2.10, 78, 'WATCH', 'MEDIUM', 'P2', 1.790, 2.010, 1320.00, 'Pitch actuator hysteresis', 'Calibrate blade pitch sensor', 'TECH-005', NOW() - INTERVAL '6 MINUTES'),
    ('WT-023', 'Dhalgaon Unit 23', 'WIND', 'Sangli • Maharashtra', 'Maharashtra', 2.00, 94, 'HEALTHY', 'LOW', 'P3', 1.860, 1.890, 180.00, 'No material anomaly', 'Continue normal monitoring', NULL, NOW() - INTERVAL '4 MINUTES'),

    -- SOLAR ASSETS
    ('ST-008', 'Pavagada Array 08', 'SOLAR', 'Pavagada East • Karnataka', 'Karnataka', 2.50, 88, 'HEALTHY', 'LOW', 'P3', 2.060, 2.220, 960.00, 'Moderate soiling', 'Include in next cleaning route', 'TECH-004', NOW() - INTERVAL '1 MINUTE'),
    ('ST-013', 'Rewa Central Inverter 13', 'SOLAR', 'Rewa South • Madhya Pradesh', 'Madhya Pradesh', 2.50, 82, 'WATCH', 'MEDIUM', 'P2', 1.940, 2.180, 1440.00, 'Panel temperature deviation', 'Inspect inverter air intake', 'TECH-003', NOW() - INTERVAL '3 MINUTES'),
    ('ST-022', 'Kamuthi Array 22', 'SOLAR', 'Kamuthi • Tamil Nadu', 'Tamil Nadu', 2.50, 96, 'HEALTHY', 'LOW', 'P3', 2.300, 2.340, 240.00, 'No material anomaly', 'Continue normal monitoring', NULL, NOW() - INTERVAL '6 MINUTES'),
    ('ST-001', 'Pavagada Array 01', 'SOLAR', 'Pavagada East • Karnataka', 'Karnataka', 2.50, 97, 'HEALTHY', 'LOW', 'P3', 2.320, 2.350, 180.00, 'No material anomaly', 'Continue normal monitoring', NULL, NOW() - INTERVAL '2 MINUTES'),
    ('ST-003', 'Pavagada Array 03', 'SOLAR', 'Pavagada East • Karnataka', 'Karnataka', 2.50, 94, 'HEALTHY', 'LOW', 'P3', 2.280, 2.320, 240.00, 'No material anomaly', 'Continue normal monitoring', NULL, NOW() - INTERVAL '5 MINUTES'),
    ('ST-009', 'Rewa Central Inverter 09', 'SOLAR', 'Rewa South • Madhya Pradesh', 'Madhya Pradesh', 2.50, 91, 'HEALTHY', 'LOW', 'P3', 2.240, 2.300, 360.00, 'No material anomaly', 'Continue normal monitoring', NULL, NOW() - INTERVAL '3 MINUTES'),
    ('ST-016', 'Bhadla Solar Unit 16', 'SOLAR', 'Bhadla Phase IV • Rajasthan', 'Rajasthan', 3.00, 95, 'HEALTHY', 'LOW', 'P3', 2.820, 2.860, 240.00, 'No material anomaly', 'Continue normal monitoring', NULL, NOW() - INTERVAL '1 MINUTE'),
    ('ST-018', 'Bhadla Solar Unit 18', 'SOLAR', 'Bhadla Phase IV • Rajasthan', 'Rajasthan', 3.00, 74, 'WATCH', 'MEDIUM', 'P2', 2.450, 2.840, 2340.00, 'Inverter bridge temperature rise', 'Check IGBT cooling pump', 'TECH-003', NOW() - INTERVAL '7 MINUTES'),
    ('ST-025', 'Kamuthi Array 25', 'SOLAR', 'Kamuthi • Tamil Nadu', 'Tamil Nadu', 2.50, 93, 'HEALTHY', 'LOW', 'P3', 2.260, 2.310, 300.00, 'No material anomaly', 'Continue normal monitoring', NULL, NOW() - INTERVAL '4 MINUTES')
ON CONFLICT (id) DO UPDATE SET
    health_score = EXCLUDED.health_score,
    status = EXCLUDED.status,
    risk = EXCLUDED.risk,
    priority = EXCLUDED.priority,
    current_power_mw = EXCLUDED.current_power_mw,
    expected_power_mw = EXCLUDED.expected_power_mw,
    revenue_loss_per_hour_inr = EXCLUDED.revenue_loss_per_hour_inr,
    probable_issue = EXCLUDED.probable_issue,
    recommended_action = EXCLUDED.recommended_action,
    assigned_technician_id = EXCLUDED.assigned_technician_id;

-- 4. Work Orders (Lifecycle: ALERT -> INSPECTION -> ASSIGNED -> RESOLVED)
INSERT INTO work_orders (id, asset_id, issue, priority, status, technician_name, technician_id, scheduled_date, notes, created_at, resolved_at)
VALUES
    ('WO-284', 'WT-017', 'Bearing degradation', 'P1', 'ALERT', 'Aarav Mehta', 'TECH-001', CURRENT_DATE, 'Verify drive-train vibration signature and high-speed bearing grease sample.', NOW() - INTERVAL '2 HOURS', NULL),
    ('WO-281', 'ST-013', 'Panel temperature deviation', 'P2', 'ASSIGNED', 'Kabir Rao', 'TECH-003', CURRENT_DATE + 1, 'Inspect inverter air intake and thermal heat-sink paths.', NOW() - INTERVAL '5 HOURS', NULL),
    ('WO-279', 'WT-021', 'Early temperature drift', 'P2', 'INSPECTION', 'Mira Shah', 'TECH-002', CURRENT_DATE, 'Review nacelle cooling fan telemetry and thermal bypass.', NOW() - INTERVAL '1 DAY', NULL),
    ('WO-276', 'ST-008', 'Moderate soiling', 'P3', 'RESOLVED', 'Rohan Das', 'TECH-004', CURRENT_DATE - 1, 'Cleaning route completed on strings 14-22. Irradiance restored.', NOW() - INTERVAL '2 DAYS', NOW() - INTERVAL '6 HOURS')
ON CONFLICT (id) DO NOTHING;

-- 5. Activity Log (Audit Signal Trail for Command Center)
INSERT INTO activity_logs (time_display, title, detail, tone, asset_id, created_at)
VALUES
    ('09:42:16', 'WT-017 anomaly score crossed watch band', 'Vibration +18% over rolling baseline (ISO 10816-21)', 'amber', 'WT-017', NOW() - INTERVAL '25 MINUTES'),
    ('09:39:04', 'Inspection assigned to Aarav Mehta', 'Bearing check • due today (WO-284 generated)', 'teal', 'WT-017', NOW() - INTERVAL '28 MINUTES'),
    ('09:33:51', 'ST-013 moved into watch status', 'Power efficiency at 89.0% vs clear-sky baseline', 'blue', 'ST-013', NOW() - INTERVAL '34 MINUTES'),
    ('09:18:22', 'WT-004 inspection resolved', 'No material action required after field vibration check', 'green', 'WT-004', NOW() - INTERVAL '49 MINUTES'),
    ('08:45:10', 'Fleet telemetry sync completed', 'All 18 assets reporting nominal SCADA heartbeats', 'teal', NULL, NOW() - INTERVAL '82 MINUTES');

-- 6. Historical Telemetry for WT-017 (Showing Progressive Bearing Degradation)
INSERT INTO telemetry_readings (asset_id, timestamp, wind_speed, rpm, vibration, temperature, phase_current, grid_voltage, power_output_mw, power_efficiency, anomaly_score, is_anomaly, scenario_tag)
VALUES
    ('WT-017', NOW() - INTERVAL '90 MINUTES', 11.20, 1504.0, 3.12, 64.0, 27.9, 690.0, 1.918, 0.984, 0.050, FALSE, 'normal'),
    ('WT-017', NOW() - INTERVAL '80 MINUTES', 11.15, 1502.5, 3.18, 64.2, 28.0, 690.0, 1.912, 0.981, 0.080, FALSE, 'normal'),
    ('WT-017', NOW() - INTERVAL '70 MINUTES', 11.30, 1501.0, 3.25, 64.5, 28.1, 690.0, 1.905, 0.977, 0.120, FALSE, 'normal'),
    ('WT-017', NOW() - INTERVAL '60 MINUTES', 11.25, 1499.0, 3.42, 64.8, 28.3, 690.0, 1.885, 0.967, 0.220, FALSE, 'bearing'),
    ('WT-017', NOW() - INTERVAL '50 MINUTES', 11.10, 1497.0, 3.65, 65.3, 28.5, 690.0, 1.840, 0.944, 0.380, TRUE, 'bearing'),
    ('WT-017', NOW() - INTERVAL '40 MINUTES', 11.40, 1495.5, 3.88, 65.9, 28.6, 690.0, 1.785, 0.915, 0.520, TRUE, 'bearing'),
    ('WT-017', NOW() - INTERVAL '30 MINUTES', 11.20, 1493.0, 4.05, 66.7, 28.8, 690.0, 1.720, 0.882, 0.690, TRUE, 'bearing'),
    ('WT-017', NOW() - INTERVAL '20 MINUTES', 11.35, 1491.0, 4.18, 67.4, 29.0, 690.0, 1.660, 0.851, 0.780, TRUE, 'bearing'),
    ('WT-017', NOW() - INTERVAL '10 MINUTES', 11.25, 1489.5, 4.30, 68.1, 29.1, 690.0, 1.605, 0.823, 0.840, TRUE, 'bearing'),
    ('WT-017', NOW(),                        11.30, 1488.0, 4.35, 68.5, 29.2, 690.0, 1.600, 0.821, 0.843, TRUE, 'bearing');

-- 7. Anomaly Event Record for WT-017
INSERT INTO anomaly_events (asset_id, detected_at, anomaly_score, root_cause, severity, vibration_deviation_pct, temperature_deviation_pct, power_loss_mw, hourly_financial_loss_inr, model_version, is_acknowledged, work_order_created)
VALUES
    ('WT-017', NOW() - INTERVAL '25 MINUTES', 0.843, 'Bearing degradation', 'P1', 31.00, 8.40, 0.350, 2100.00, 'IsolationForest-v1.4', TRUE, TRUE);

-- ====================================================================
-- 8. FEATURE 52: What-If Scenario Presets
-- ====================================================================

CREATE TABLE IF NOT EXISTS what_if_scenarios (
    id VARCHAR(64) PRIMARY KEY,
    name TEXT NOT NULL,
    category VARCHAR(64) NOT NULL,
    description TEXT NOT NULL,
    temperature_offset NUMERIC DEFAULT 0,
    wind_speed_factor NUMERIC DEFAULT 1.0,
    irradiance_factor NUMERIC DEFAULT 1.0,
    soiling_factor NUMERIC DEFAULT 0,
    curtailment_pct NUMERIC DEFAULT 0,
    maintenance_delay_days INTEGER DEFAULT 0,
    derate_pct NUMERIC DEFAULT 100,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO what_if_scenarios (id, name, category, description, temperature_offset, wind_speed_factor, irradiance_factor, soiling_factor, curtailment_pct, maintenance_delay_days, derate_pct)
VALUES
    ('heatwave', 'Extreme Summer Heatwave', 'Environmental', '+8°C ambient temperature rise causing inverter thermal derating and solar PV cell degradation (-0.4%/°C).', 8.0, 1.0, 1.05, 5.0, 0.0, 0, 100.0),
    ('gale_wind', 'Kutch High-Wind Gale & Cut-Out', 'Aerodynamic', 'Wind speed gusts reaching 23.5 m/s near cut-out threshold (25 m/s), triggering blade pitch feathering and vibration alerts.', 1.0, 1.9, 0.9, 10.0, 0.0, 0, 100.0),
    ('dust_soiling', 'Thar Desert Soiling & Dust Storm', 'Environmental', '+35% heavy particulate accumulation on solar arrays and nacelle air filters in Rajasthan/Gujarat.', 3.0, 1.1, 0.75, 35.0, 0.0, 0, 100.0),
    ('grid_curtailment', 'SLDC 30% Peak Grid Curtailment', 'Grid Directive', 'State Load Dispatch Center (SLDC) orders mandatory 30% active power curtailment due to regional transmission congestion.', 0.0, 1.0, 1.0, 0.0, 30.0, 0, 70.0),
    ('maintenance_deferral', 'WT-017 14-Day Maintenance Deferral', 'Operations & Risk', 'Simulates operating WT-017 with existing drive-train vibration for 14 additional days without technician intervention.', 4.0, 1.15, 1.0, 0.0, 0.0, 14, 100.0)
ON CONFLICT (id) DO NOTHING;

-- ====================================================================
-- 9. FEATURE 53: Generation Forecast Logs & Dispatch Windows
-- ====================================================================

CREATE TABLE IF NOT EXISTS generation_forecasts (
    id SERIAL PRIMARY KEY,
    asset_id VARCHAR(32) NOT NULL,
    forecast_horizon VARCHAR(16) NOT NULL,
    model_type VARCHAR(32) NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL,
    expected_power_mw NUMERIC NOT NULL,
    optimistic_power_mw NUMERIC NOT NULL,
    pessimistic_power_mw NUMERIC NOT NULL,
    dsm_lower_bound_mw NUMERIC NOT NULL,
    dsm_upper_bound_mw NUMERIC NOT NULL,
    tariff_inr_per_kwh NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

