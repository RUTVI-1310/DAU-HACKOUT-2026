export type PlantType = 'solar' | 'wind' | 'hybrid';

export interface Plant {
  id: string;
  name: string;
  type: PlantType;
  capacityMW: number;
  location: string;
  coordinates: [number, number];
  technology: string;
  commissionedYear: number;
  inverterCapacityMW?: number;
  trackerType?: 'Single-Axis Horizontal' | 'Fixed-Tilt 25°' | 'Dual-Axis' | 'N/A';
  turbineCount?: number;
  turbineModel?: string;
  cutInSpeed?: number; // m/s
  ratedSpeed?: number; // m/s
  cutOutSpeed?: number; // m/s
  bessPowerMW?: number;
  bessCapacityMWh?: number;
  bessCurrentSoC?: number; // % State of Charge
  currentOutputMW: number;
  availabilityPct: number;
}

export interface WeatherForecastPoint {
  hourOffset: number;
  timestamp: string;
  timeLabel: string;
  ghi: number; // Global Horizontal Irradiance (W/m²)
  dni: number; // Direct Normal Irradiance (W/m²)
  dhi: number; // Diffuse Horizontal Irradiance (W/m²)
  cloudCoverPct: number; // 0-100%
  ambientTempC: number; // °C
  windSpeed100m: number; // m/s at 100m hub height
  windDirectionDeg: number; // 0-360°
  airDensity: number; // kg/m³
  relativeHumidityPct: number; // %
  barometricPressureHpa: number; // hPa
}

export interface ModelPrediction {
  prophet: number;
  lstm: number;
  xgboost: number;
  ensemble: number;
  p10: number; // 10th percentile (conservative)
  p90: number; // 90th percentile (optimistic)
}

export type ImbalanceSeverity = 'BALANCED' | 'OVER_GENERATION' | 'UNDER_GENERATION' | 'STEEP_RAMP_UP' | 'STEEP_RAMP_DOWN';

export type ActionType = 
  | 'BESS_CHARGE' 
  | 'BESS_DISCHARGE' 
  | 'CURTAILMENT' 
  | 'PEAKER_STARTUP' 
  | 'INTERTIE_EXPORT' 
  | 'DEMAND_RESPONSE';

export type ActionPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'INFO';

export interface GridActionRecommendation {
  id: string;
  title: string;
  type: ActionType;
  priority: ActionPriority;
  targetHour: string;
  targetHourOffset: number;
  magnitudeMW: number;
  durationHrs: number;
  targetAssetId: string;
  targetAssetName: string;
  rationale: string;
  actionImpact: {
    avoidedSpillMWh?: number;
    avoidedLossAmountUSD: number; // backward compatibility
    avoidedLossAmountINR: number; // ₹ value
    co2SavedTons: number;
    gridFrequencySupportHz?: number;
  };
  status: 'PENDING' | 'DISPATCHED' | 'DISMISSED';
  timestamp: string;
  /** Optional Gemini-refined narrative from backend */
  aiNarrative?: string;
}

export interface GenerationForecastPoint {
  hourOffset: number;
  timestamp: string;
  timeLabel: string;
  dayLabel: string;
  isNight: boolean;
  weather: WeatherForecastPoint;
  
  // Power predictions
  solarForecast: ModelPrediction;
  windForecast: ModelPrediction;
  totalForecast: ModelPrediction;
  
  // Grid interaction
  gridDemandScheduledMW: number;
  generationDeltaMW: number; // totalForecast.ensemble - gridDemandScheduledMW
  rampRateMWperHr: number;
  imbalanceSeverity: ImbalanceSeverity;
  
  // Market economics (in ₹ INR / MWh)
  dayAheadLMP: number; // ₹/MWh
  realTimeLMPProjected: number; // ₹/MWh
  bessArbitragePotentialUSD: number; // For backward compatibility
  bessArbitragePotentialINR: number; // ₹/MWh arbitrage upside
  
  recommendedAction?: GridActionRecommendation;
}

export interface SimulationParameters {
  horizonHours: 24 | 48 | 72;
  selectedModel: 'ensemble' | 'prophet' | 'lstm' | 'xgboost';
  selectedPlantId: 'ALL' | string;
  showConfidenceIntervals: boolean;
  
  // Weather scenario modifiers ("What-If" engine)
  weatherModifier: {
    cloudCoverSpikePct: number; // -50% to +80%
    windSpeedMultiplier: number; // 0.2x to 2.0x
    tempOffsetC: number; // -10 to +15°C
    stormEventHour?: number; // specific hour where sudden squall hits
    activePreset: 'NORMAL' | 'CLOUD_FRONT' | 'WIND_LULL' | 'GALE_CUTOUT' | 'HEATWAVE';
  };
  
  // Market parameters (in ₹ / MWh)
  tariffBaseUSDperMWh: number;
  imbalancePenaltyRateUSDperMWh: number;
}

export interface ExecutionLog {
  id: string;
  actionId: string;
  title: string;
  type: ActionType;
  magnitudeMW: number;
  targetAsset: string;
  dispatchedAt: string;
  operator: string;
  status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  notes: string;
}

/** API request body for POST /api/forecast */
export interface ForecastRequest {
  horizonHours?: 24 | 48 | 72;
  selectedModel?: 'ensemble' | 'prophet' | 'lstm' | 'xgboost';
  selectedPlantId?: 'ALL' | string;
  showConfidenceIntervals?: boolean;
  weatherModifier?: Partial<SimulationParameters['weatherModifier']>;
  tariffBaseUSDperMWh?: number;
  imbalancePenaltyRateUSDperMWh?: number;
  enhanceWithAI?: boolean;
}

/** API response from POST /api/forecast */
export interface ForecastResponse {
  success: true;
  generatedAt: string;
  params: SimulationParameters;
  points: GenerationForecastPoint[];
  summary: {
    totalCapacityMW: number;
    peakGenerationMW: number;
    minGenerationMW: number;
    avgGenerationMW: number;
    overGenerationHours: number;
    underGenerationHours: number;
    criticalActions: number;
    estimatedAvoidedLossINR: number;
  };
}
