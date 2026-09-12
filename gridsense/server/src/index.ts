import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

import healthRouter from './routes/health.js';
import plantsRouter from './routes/plants.js';
import forecastRouter from './routes/forecast.js';
import dispatchRouter from './routes/dispatch.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const PORT = Number(process.env.PORT) || 4000;
const CORS_ORIGINS = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const app = express();

// Security & parsing
app.use(helmet({ contentSecurityPolicy: false }));
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow non-browser / same-origin / listed origins
      if (!origin || CORS_ORIGINS.includes(origin) || CORS_ORIGINS.includes('*')) {
        cb(null, true);
      } else {
        cb(new Error(`CORS blocked for origin: ${origin}`));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

// Rate limiting
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
    max: Number(process.env.RATE_LIMIT_MAX) || 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, error: 'Too many requests, please try again later.' },
  })
);

// Routes
app.use('/api/health', healthRouter);
app.use('/api/plants', plantsRouter);
app.use('/api/forecast', forecastRouter);
app.use('/api/dispatch', dispatchRouter);

// Root
app.get('/', (_req, res) => {
  res.json({
    name: 'GridSense AI Backend',
    version: '1.0.0',
    docs: {
      health: 'GET /api/health',
      plants: 'GET /api/plants',
      plantById: 'GET /api/plants/:id',
      forecast: 'POST /api/forecast',
      forecastHealth: 'GET /api/forecast/health',
      scenarioBrief: 'POST /api/forecast/scenario-brief',
      dispatchList: 'GET /api/dispatch',
      dispatchCreate: 'POST /api/dispatch',
      dispatchUpdate: 'PATCH /api/dispatch/:id',
    },
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n  ⚡ GridSense AI Backend running on http://localhost:${PORT}`);
  console.log(`  📡 CORS origins: ${CORS_ORIGINS.join(', ')}`);
  console.log(
    `  🤖 Gemini: ${process.env.GEMINI_API_KEY ? 'configured' : 'NOT configured (set GEMINI_API_KEY)'}\n`
  );
});

export default app;
