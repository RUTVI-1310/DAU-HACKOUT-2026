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
