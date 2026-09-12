import { GoogleGenAI } from '@google/genai';
import type { GenerationForecastPoint, GridActionRecommendation } from '../types/index.js';

const apiKey = process.env.GEMINI_API_KEY;
const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash';

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  if (!apiKey) return null;
  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

/**
 * Enhance a single action rationale with a concise, operator-ready narrative.
 * Falls back silently if Gemini is unavailable.
 */
export async function enhanceActionRationale(
  action: GridActionRecommendation,
  contextPoint?: GenerationForecastPoint
): Promise<string> {
  const ai = getClient();
  if (!ai) return action.rationale;

  const weatherCtx = contextPoint
    ? `Weather: GHI ${contextPoint.weather.ghi} W/m², cloud ${contextPoint.weather.cloudCoverPct}%, wind ${contextPoint.weather.windSpeed100m} m/s, temp ${contextPoint.weather.ambientTempC}°C.`
    : '';

  const prompt = `You are a senior grid operations advisor for a renewable fleet (solar + wind + BESS).
Rewrite the following dispatch recommendation into a clear, professional 2-3 sentence operator brief.
Keep technical numbers exact. Use Indian Rupee (₹) for money. Do not invent new numbers.
Do not use markdown. Output only the narrative text.

Action type: ${action.type}
Title: ${action.title}
Magnitude: ${action.magnitudeMW} MW for ${action.durationHrs} h
Priority: ${action.priority}
Original rationale: ${action.rationale}
${weatherCtx}
Impact: avoided loss ≈ ₹${action.actionImpact.avoidedLossAmountINR.toLocaleString('en-IN')}, CO₂ ${action.actionImpact.co2SavedTons} t.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.35,
        maxOutputTokens: 220,
      },
    });

    const text = response.text?.trim();
    return text && text.length > 20 ? text : action.rationale;
  } catch (err) {
    console.warn('[Gemini] enhanceActionRationale failed:', (err as Error).message);
    return action.rationale;
  }
}

/**
 * Batch-enhance recommended actions present on the forecast horizon.
 * Only processes actions with priority CRITICAL or HIGH to control cost/latency.
 */
export async function enhanceForecastActions(
  points: GenerationForecastPoint[],
  maxActions = 8
): Promise<void> {
  const ai = getClient();
  if (!ai) return;

  const candidates: { point: GenerationForecastPoint; action: GridActionRecommendation }[] = [];
  for (const pt of points) {
    if (
      pt.recommendedAction &&
      (pt.recommendedAction.priority === 'CRITICAL' ||
        pt.recommendedAction.priority === 'HIGH')
    ) {
      candidates.push({ point: pt, action: pt.recommendedAction });
    }
  }

  const toProcess = candidates.slice(0, maxActions);

  await Promise.all(
    toProcess.map(async ({ point, action }) => {
      const narrative = await enhanceActionRationale(action, point);
      action.aiNarrative = narrative;
      // Optionally replace the main rationale for UI simplicity
      action.rationale = narrative;
    })
  );
}

/**
 * Generate a short natural-language scenario briefing for What-If mode.
 */
export async function generateScenarioBrief(
  preset: string,
  horizonHours: number,
  summary: {
    peakGenerationMW: number;
    overGenerationHours: number;
    underGenerationHours: number;
    criticalActions: number;
  }
): Promise<string> {
  const ai = getClient();
  if (!ai) {
    return `Scenario "${preset}" over ${horizonHours}h: peak ${summary.peakGenerationMW} MW, ${summary.overGenerationHours} over-gen hours, ${summary.underGenerationHours} under-gen hours, ${summary.criticalActions} critical actions.`;
  }

  const prompt = `You are GridSense AI. Write a 3-sentence operational briefing for grid operators about the weather scenario "${preset}" simulated over the next ${horizonHours} hours.
Key metrics: peak generation ${summary.peakGenerationMW} MW, over-generation hours ${summary.overGenerationHours}, under-generation hours ${summary.underGenerationHours}, critical dispatch actions ${summary.criticalActions}.
Be concise, factual, and action-oriented. No markdown.`;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: { temperature: 0.4, maxOutputTokens: 180 },
    });
    return response.text?.trim() || 'Scenario briefing unavailable.';
  } catch (err) {
    console.warn('[Gemini] generateScenarioBrief failed:', (err as Error).message);
    return `Scenario "${preset}" simulated. Review forecast and action center for details.`;
  }
}

export function isGeminiAvailable(): boolean {
  return Boolean(apiKey);
}
