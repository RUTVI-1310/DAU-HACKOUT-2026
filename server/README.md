# GridSense AI – Backend

Production-ready Node.js + Express + TypeScript API that powers the GridSense AI renewable forecasting platform.

## Features

- **Physics + multi-model forecasting engine**  
  Solar (GHI → DC → AC with tracker & temperature derating) and wind (IEC-style power curve) baselines, then Prophet / LSTM / XGBoost / Ensemble blend with P10–P90 uncertainty bands.

- **Automated grid action recommendations**  
  BESS charge/discharge, curtailment, peaker startup, demand-response for over-generation, duck-curve ramps, wind lulls, and high-wind cut-out.

- **Gemini-enhanced rationales** (optional)  
  When `GEMINI_API_KEY` is set and the client sends `enhanceWithAI: true`, critical/high-priority actions receive polished operator narratives.

- **Plant portfolio & fleet totals**

- **Dispatch / execution log** (in-memory; swap for Redis/Postgres in production)

- **Validation** (Zod), **rate limiting**, **Helmet**, **CORS**, structured error responses.

## Quick start

```bash
cd server
cp .env.example .env
# Edit .env – at minimum set GEMINI_API_KEY if you want AI narratives

npm install
npm run dev          # http://localhost:4000  (tsx watch)
```

Production:

```bash
npm run build
npm start
```

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Service info & route list |
| GET | `/api/health` | Liveness + Gemini status |
| GET | `/api/plants` | Full fleet + totals |
| GET | `/api/plants/:id` | Single plant |
| POST | `/api/forecast` | Run forecast (body optional) |
| GET | `/api/forecast/health` | Engine self-test |
| POST | `/api/forecast/scenario-brief` | NL briefing for a What-If preset |
| GET | `/api/dispatch` | List execution logs |
| GET | `/api/dispatch/:id` | Single log |
| POST | `/api/dispatch` | Create dispatch log |
| PATCH | `/api/dispatch/:id` | Update status |

### Example – forecast

```bash
curl -s -X POST http://localhost:4000/api/forecast \
  -H 'Content-Type: application/json' \
  -d '{
    "horizonHours": 48,
    "selectedPlantId": "ALL",
    "weatherModifier": { "activePreset": "CLOUD_FRONT" },
    "enhanceWithAI": true
  }' | jq '.summary'
```

### Example – dispatch

```bash
curl -s -X POST http://localhost:4000/api/dispatch \
  -H 'Content-Type: application/json' \
  -d '{
    "actionId": "REC-ACT-BESS-CHG-12",
    "title": "Dispatch BESS Fleet: Fast Bulk Charging (180 MW)",
    "type": "BESS_CHARGE",
    "magnitudeMW": 180,
    "targetAsset": "Desert Sun & Valley BESS Hubs",
    "operator": "OP-421"
  }'
```

## Environment

| Variable | Default | Notes |
|----------|---------|-------|
| `PORT` | `4000` | |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma-separated |
| `GEMINI_API_KEY` | — | Required for AI narratives |
| `GEMINI_MODEL` | `gemini-2.0-flash` | |
| `RATE_LIMIT_WINDOW_MS` | `60000` | |
| `RATE_LIMIT_MAX` | `120` | |

## Frontend integration

Point the Vite app at this API (e.g. `VITE_API_BASE=http://localhost:4000`) and replace the client-side `runForecastingEngine` call with:

```ts
const res = await fetch(`${import.meta.env.VITE_API_BASE}/api/forecast`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ...params, enhanceWithAI: true }),
});
const data = await res.json();
// data.points, data.summary, data.params
```

A ready-to-use client helper lives at `src/services/apiClient.ts` in the frontend package (see project root).

## Architecture notes

- Forecasting logic is pure TypeScript and can be unit-tested without a running server.
- Dispatch store is in-memory for demo; replace `dispatchStore.ts` with a real persistence layer for multi-instance deploys.
- Gemini calls are best-effort and never fail the forecast response.
