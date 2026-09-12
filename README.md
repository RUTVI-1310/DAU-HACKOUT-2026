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

5. **Standalone Embedded API & Telemetry Engine**
   - Integrated zero-dependency backend providing REST endpoints (`/api/assets`, `/api/simulation/telemetry`, `/api/work-orders`, `/api/metrics/fleet`).

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
