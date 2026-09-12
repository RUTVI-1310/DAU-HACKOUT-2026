# GridSense AI – Perfected Backend

Complete production-ready backend lives in the **`server/`** directory.

## What’s included

```
server/
├── package.json              # Express, Zod, Helmet, rate-limit, @google/genai, uuid
├── tsconfig.json
├── .env.example
├── README.md                 # Full API docs & curl examples
└── src/
    ├── index.ts              # App entry – CORS, Helmet, rate limit, routes
    ├── types/index.ts        # Shared domain types
    ├── data/plants.ts        # Fleet portfolio (4 plants)
    ├── services/
    │   ├── forecastingEngine.ts   # Physics + Prophet/LSTM/XGBoost/Ensemble + actions
    │   ├── geminiService.ts       # Optional AI narrative enhancement
    │   └── dispatchStore.ts       # In-memory execution log (swap for DB later)
    ├── middleware/
    │   ├── validate.ts            # Zod schemas for forecast & dispatch bodies
    │   └── errorHandler.ts
    └── routes/
        ├── health.ts
        ├── plants.ts
        ├── forecast.ts            # POST /api/forecast, scenario-brief, health
        └── dispatch.ts            # CRUD-style dispatch logs
```

## Run the backend

```bash
cd server
cp .env.example .env
# Set GEMINI_API_KEY if you want AI-enhanced rationales

npm install
npm run dev     # → http://localhost:4000
```

## Key endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/api/health` | Liveness + Gemini status |
| `GET` | `/api/plants` | Fleet list + capacity totals |
| `POST` | `/api/forecast` | Run full multi-model forecast (+ optional Gemini) |
| `POST` | `/api/forecast/scenario-brief` | NL briefing for What-If presets |
| `GET/POST/PATCH` | `/api/dispatch` | Execution audit trail |

### Minimal forecast request

```json
POST /api/forecast
{
  "horizonHours": 48,
  "selectedPlantId": "ALL",
  "weatherModifier": { "activePreset": "CLOUD_FRONT" },
  "enhanceWithAI": true
}
```

Response includes `points[]` (full horizon), `summary`, and `params`.

## Frontend bridge

A typed client is available at:

```
src/services/apiClient.ts
```

Set in the frontend `.env` / `.env.local`:

```
VITE_API_BASE=http://localhost:4000
```

Then replace the client-side `useMemo(() => runForecastingEngine(params), …)` with:

```ts
const data = await runForecast({ ...params, enhanceWithAI: true });
// data.points, data.summary
```

The original client-side engine remains intact for offline / AI Studio demos.

## Design choices

1. **Engine is pure & portable** – no Express dependency inside `forecastingEngine.ts`.
2. **Gemini is optional & non-blocking** – forecast always succeeds even if the key is missing.
3. **Validation first** – Zod rejects bad horizons, multipliers, action types before any work.
4. **Ready for real storage** – swap `dispatchStore.ts` for Redis/Postgres without touching routes.
5. **Security baseline** – Helmet, CORS allow-list, rate limiting, structured errors.

See `server/README.md` for full curl examples and environment reference.
