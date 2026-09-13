# PREDICTIVE MAINTENANCE FOR SOLAR & WIND RENEWABLE ASSETS
### DAU-HACKOUT-2026 — Team EVILCODER

A full-stack, ML-driven predictive maintenance platform for renewable utility assets (Wind Turbines & Solar Inverters), featuring real-time telemetry streaming, multi-sensor anomaly detection, explainable diagnostics, and automated work order dispatch.

---

## 👥 Team EVILCODER
- **Rutvi Raval** (`RUTVI-1310`) — Lead ML / Anomaly Pipeline & Feature Engineering
- **Krish Shah** — Lead Full-Stack / Platform Architecture & UI/UX
- **Pratham Shah** — Telemetry Simulation & Sensor Hardware Emulation
- **Hitarth Vyas** — Financial Modeling & Industrial Domain Logic

---

## 🌟 Key Features

1. **Fleet Command Center**
   - Real-time fleet health aggregation across 18 wind and solar assets.
   - Live generation vs. expected generation curves.
   - Financial loss estimation (projected downtime cost @ ₹6.00/kWh).

2. **Asset Registry & Diagnostic Views**
   - Granular health indexes (0–100) and risk categorizations (Low, Medium, High / P1, P2, P3).
   - Deep-dive diagnostic page for `WT-017` and other critical assets with vibration, temperature, RPM, and power output telemetry.
   - Explainable ML diagnostics detailing root cause likelihoods.

3. **Live Fault Simulation Studio (`/simulation`)**
   - 4 fault injection signatures:
     - **Normal operation**: Baseline stable operation.
     - **Bearing degradation**: Vibration drift & nacelle temperature elevation.
     - **Generator overheating**: Stator current spikes & thermal runaway.
     - **Gearbox instability**: Harmonic vibration spikes & erratic RPM fluctuation.
   - Interactive 7-step storyline tracking anomaly progression from sensor ingestion to technician dispatch.

4. **Maintenance Queue & Work Order Management (`/maintenance`)**
   - Lifecycle tracking: `ALERT` → `INSPECTION` → `ASSIGNED` → `RESOLVED`.
   - Direct work order creation with priority tagging and technician allocation.

5. **What-If Scenario Simulator (`/what-if`) — Feature 52**
   - Interactive stress-testing simulator for environmental anomalies, operational derating, and maintenance deferral.
   - Granular slider controls: Ambient Temperature offset (-5°C to +20°C), Wind Velocity multiplier (0.5x to 2.5x), PV Soiling/dust opacity (0% to 50%), SLDC Curtailment mandate (0% to 80%), Service deferral window (0 to 30 days), and Proactive load derating (50% to 100%).
   - Industrial presets: *Extreme Summer Heatwave*, *Kutch High-Wind Gale & Cut-Out*, *Thar Desert Soiling*, *SLDC 30% Grid Curtailment*, and *WT-017 14-Day Maintenance Deferral*.
   - Dynamic real-time KPI impacts: Health score, Remaining Useful Life (RUL in days/operating hours), Failure Probability (%), and Financial loss (₹/hr & 30-day cumulative).
   - 28-day Weibull wear-out degradation curve and AI prescriptive mitigation recommendations.

6. **Forecast Studio (`/forecast`) — Feature 53**
   - Multi-horizon renewable generation forecasting: 6h Intraday (15-min blocks), 24h Day-Ahead (hourly for DAM scheduling), and 7d Week-Ahead.
   - Multi-model ensemble comparisons: Ensemble Blend (94.8% MAPE), Gradient-Boosted ML (XGBoost), NWP Numerical Physics, and Persistence Baseline.
   - Probabilistic uncertainty bands: P10 (Conservative Guarantee), P50 (Expected Forecast), and P90 (Optimistic Bound).
   - Indian CERC Deviation Settlement Mechanism (DSM ±10% permissible band) compliance tracking.
   - Automated AI Optimal Maintenance Window identification: locates generation lull hours and calculates opportunity cost savings for work order dispatch.

7. **Standalone Embedded API & Telemetry Engine**
   - Integrated zero-dependency backend providing REST endpoints (`/api/assets`, `/api/simulation/telemetry`, `/api/what-if/presets`, `/api/what-if/simulate`, `/api/forecast`, `/api/forecast/schedule-window`, `/api/work-orders`, `/api/metrics/fleet`).

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)

### Run the Application
```bash
# Clone the repository
git clone https://github.com/RUTVI-1310/DAU-HACKOUT-2026.git
cd DAU-HACKOUT-2026

# Start the application server
npm start
# or
node server.mjs
```

The application will launch on **http://localhost:3000**.
- **Frontend App**: `http://localhost:3000`
- **Fleet API**: `http://localhost:3000/api/assets`
- **Simulation API**: `http://localhost:3000/api/simulation/telemetry?scenario=bearing&tick=5`
- **Health Check**: `http://localhost:3000/api/healthz`

---

## 🛠️ Architecture & Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Recharts, Wouter routing.
- **Backend**: Node.js HTTP/REST engine with live telemetry emulation & Isolation Forest anomaly heuristics.
- **Color Palette & Design**: Light-themed Ivory canvas (`#F7F5EF`), Forest-Green sidebar (`#122C25`), Emerald accents (`#1B6350`), and DM Mono / Manrope typography.
