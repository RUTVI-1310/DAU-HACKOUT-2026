# 🗄️ Zero-to-Hero Database Guide: PostgreSQL & Supabase
### Predictive Maintenance Platform — DAU-HACKOUT-2026 (Team EVILCODER)

> **Don't worry if you are a beginner with zero database knowledge!**  
> Follow this simple, 5-minute guide. Everything has been pre-written for you in ready-to-run SQL scripts.

---

## 💡 What is PostgreSQL & Supabase?

- **PostgreSQL**: An enterprise-grade relational database that safely stores your renewable energy assets, SCADA sensor telemetry, and maintenance work orders.
- **Supabase**: A free, cloud-hosted platform that gives you a PostgreSQL database in the cloud, with an intuitive visual dashboard (like a spreadsheet) and an instant SQL runner.

---

## ⚡ 4-Step Quick Setup (Takes Under 3 Minutes)

### Step 1: Create a Free Project on Supabase
1. Go to **[https://supabase.com](https://supabase.com)** and click **"Start your project"** (you can sign in with your GitHub account).
2. Click **"New project"**.
3. Fill in the fields:
   - **Name**: `Renewable-Maintenance` (or `DAU-HACKOUT-2026`)
   - **Database Password**: Enter a strong password and save it somewhere.
   - **Region**: Select any region close to you (e.g., `Mumbai / South Asia`).
   - **Pricing Plan**: Select **Free**.
4. Click **"Create new project"** and wait ~60 seconds for Supabase to provision your database.

---

### Step 2: Run the 1-Click Database Script
We have prepared a single, all-in-one SQL script: [`database/setup_all.sql`](file:///c:/Users/Krish%20Shah/Downloads/gridsense-ai-perfected/gridsense/database/setup_all.sql).

1. In your Supabase project dashboard, look at the left sidebar and click on **"SQL Editor"** (the icon looks like `>_` or a terminal).
2. Click **"New query"** (green button or plus icon).
3. Open the file [`database/setup_all.sql`](file:///c:/Users/Krish%20Shah/Downloads/gridsense-ai-perfected/gridsense/database/setup_all.sql) on your computer, copy the entire content, and paste it into the Supabase SQL Editor.
4. Click the green **"Run"** button in the bottom right (or press `Ctrl + Enter`).
5. You will see:
   ```text
   Success. No rows returned.
   ```
🎉 **Congratulations! Your entire database is now live!**

---

### Step 3: Inspect Your Data Visually (Table Editor)
Now you can see your data just like Microsoft Excel or Google Sheets:
1. In the Supabase left sidebar, click on **"Table Editor"** (the grid / table icon).
2. Explore your new tables:
   - **`assets`**: Browse all 18 Wind Turbines and Solar Inverters across Gujarat, Rajasthan, Karnataka, Madhya Pradesh, and Tamil Nadu. Notice `WT-017` flagged with `WARNING` and `P1` priority.
   - **`telemetry_readings`**: View high-frequency SCADA telemetry (vibration, temperature, RPM, wind speed, power output, and anomaly scores).
   - **`work_orders`**: Review the active dispatch lifecycle (`WO-284`, `WO-281`, `WO-279`, `WO-276`).
   - **`technicians`**: View certified maintenance personnel (Aarav Mehta, Mira Shah, Kabir Rao, Rohan Das).
   - **`activity_logs`**: See the real-time audit signal trail.

---

### Step 4: Connect Supabase to the Application (Optional)
If you want the web application to talk directly to your cloud Supabase database:
1. In Supabase, click on **"Project Settings"** (the gear icon at the bottom of the left sidebar).
2. Click on **"API"** in the settings menu.
3. You will see:
   - **Project URL**: (e.g., `https://abcdefghijklm.supabase.co`)
   - **Project API Keys**: Copy the **`anon` `public`** key.
4. Create a `.env` file in the `gridsense` directory (you can duplicate `.env.example`) and fill in:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
5. Restart the server with `npm start` or `node server.mjs`.

> **Note**: Even without configuring `.env`, the platform runs perfectly using its built-in API and simulation engine, so your presentation will never fail!

---

## 🏆 Database Architecture Details (For Hackathon Judges)

If evaluators or judges ask technical questions about your database design, highlight these key points:

| Feature | Description |
| :--- | :--- |
| **Relational Integrity** | Full foreign-key constraints linking SCADA telemetry and maintenance work orders to assets and certified technicians. |
| **Time-Series Optimization** | Composite B-tree index on `(asset_id, timestamp DESC)` for sub-millisecond retrieval of rolling sensor windows. |
| **Calculated Columns** | PostgreSQL `GENERATED ALWAYS AS (expected_power - current_power) STORED` for zero-overhead power deficit calculations. |
| **Automated Triggers** | `update_updated_at_column()` PL/pgSQL triggers automatically maintaining audit timestamps on record updates. |
| **Analytical Views** | Pre-computed `fleet_kpi_summary` and `active_alerts_view` aggregating fleet-wide metrics without expensive runtime queries. |
| **Row Level Security (RLS)** | Enabled across all tables with explicit security policies ready for enterprise role-based access control. |
| **Supabase Realtime** | Integrated WebSocket publication on `telemetry_readings` and `work_orders` for live dashboard streaming. |

---

## 📁 File Structure Reference

```text
gridsense/
├── database/
│   ├── schema.sql       # DDL: Tables, Enums, Indexes, Views, Triggers, RLS Policies
│   ├── seed.sql         # DML: Pre-seeded 18 assets, technicians, work orders & telemetry
│   └── setup_all.sql    # Combined 1-click script for Supabase SQL Editor
├── src/
│   └── lib/
│       └── supabaseClient.ts  # Typed Supabase client with automatic fallback
├── DATABASE_GUIDE.md    # This guide
└── .env.example         # Environment template for Supabase credentials
```
