import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';

export const forecastBodySchema = z.object({
  horizonHours: z.union([z.literal(24), z.literal(48), z.literal(72)]).optional(),
  selectedModel: z
    .enum(['ensemble', 'prophet', 'lstm', 'xgboost'])
    .optional(),
  selectedPlantId: z.string().optional(),
  showConfidenceIntervals: z.boolean().optional(),
  weatherModifier: z
    .object({
      cloudCoverSpikePct: z.number().min(-50).max(80).optional(),
      windSpeedMultiplier: z.number().min(0.2).max(2.0).optional(),
      tempOffsetC: z.number().min(-10).max(15).optional(),
      stormEventHour: z.number().int().min(0).max(71).optional(),
      activePreset: z
        .enum(['NORMAL', 'CLOUD_FRONT', 'WIND_LULL', 'GALE_CUTOUT', 'HEATWAVE'])
        .optional(),
    })
    .optional(),
  tariffBaseUSDperMWh: z.number().min(0).max(500).optional(),
  imbalancePenaltyRateUSDperMWh: z.number().min(0).max(500).optional(),
  enhanceWithAI: z.boolean().optional(),
});

export const dispatchBodySchema = z.object({
  actionId: z.string().min(1),
  title: z.string().min(1),
  type: z.enum([
    'BESS_CHARGE',
    'BESS_DISCHARGE',
    'CURTAILMENT',
    'PEAKER_STARTUP',
    'INTERTIE_EXPORT',
    'DEMAND_RESPONSE',
  ]),
  magnitudeMW: z.number().positive(),
  targetAsset: z.string().min(1),
  operator: z.string().optional(),
  notes: z.string().optional(),
});

export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: result.error.flatten(),
      });
    }
    req.body = result.data;
    next();
  };
}
