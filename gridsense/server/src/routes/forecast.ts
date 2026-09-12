import { Router } from 'express';
import {
  buildForecastSummary,
  defaultSimulationParams,
  runForecastingEngine,
} from '../services/forecastingEngine.js';
import { enhanceForecastActions, generateScenarioBrief, isGeminiAvailable } from '../services/geminiService.js';
import { TOTAL_FLEET_CAPACITY_MW } from '../data/plants.js';
import { validateBody, forecastBodySchema } from '../middleware/validate.js';
import type { ForecastResponse, SimulationParameters } from '../types/index.js';

const router = Router();

/**
 * POST /api/forecast
 * Body: ForecastRequest (all fields optional)
 * Returns full horizon with optional Gemini-enhanced action rationales.
 */
router.post('/', validateBody(forecastBodySchema), async (req, res, next) => {
  try {
    const body = req.body as {
      horizonHours?: 24 | 48 | 72;
      selectedModel?: SimulationParameters['selectedModel'];
      selectedPlantId?: string;
      showConfidenceIntervals?: boolean;
      weatherModifier?: Partial<SimulationParameters['weatherModifier']>;
      tariffBaseUSDperMWh?: number;
      imbalancePenaltyRateUSDperMWh?: number;
      enhanceWithAI?: boolean;
    };

    const params = defaultSimulationParams({
      horizonHours: body.horizonHours,
      selectedModel: body.selectedModel,
      selectedPlantId: body.selectedPlantId,
      showConfidenceIntervals: body.showConfidenceIntervals,
      weatherModifier: body.weatherModifier,
      tariffBaseUSDperMWh: body.tariffBaseUSDperMWh,
      imbalancePenaltyRateUSDperMWh: body.imbalancePenaltyRateUSDperMWh,
    });

    const points = runForecastingEngine(params);

    if (body.enhanceWithAI && isGeminiAvailable()) {
      await enhanceForecastActions(points);
    }

    const summary = buildForecastSummary(points, TOTAL_FLEET_CAPACITY_MW);

    const response: ForecastResponse = {
      success: true,
      generatedAt: new Date().toISOString(),
      params,
      points,
      summary,
    };

    res.json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/forecast/scenario-brief
 * Generates a short NL briefing for a What-If preset using Gemini.
 */
router.post('/scenario-brief', async (req, res, next) => {
  try {
    const {
      preset = 'NORMAL',
      horizonHours = 48,
      peakGenerationMW = 0,
      overGenerationHours = 0,
      underGenerationHours = 0,
      criticalActions = 0,
    } = req.body ?? {};

    const brief = await generateScenarioBrief(String(preset), Number(horizonHours), {
      peakGenerationMW: Number(peakGenerationMW),
      overGenerationHours: Number(overGenerationHours),
      underGenerationHours: Number(underGenerationHours),
      criticalActions: Number(criticalActions),
    });

    res.json({
      success: true,
      brief,
      geminiAvailable: isGeminiAvailable(),
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/forecast/health – quick engine self-test
 */
router.get('/health', (_req, res) => {
  const params = defaultSimulationParams({ horizonHours: 24 });
  const points = runForecastingEngine(params);
  res.json({
    success: true,
    engine: 'ok',
    sampleHours: points.length,
    geminiAvailable: isGeminiAvailable(),
  });
});

export default router;
