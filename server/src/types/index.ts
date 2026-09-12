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
  cutInSpeed?: number;
  ratedSpeed?: number;
  cutOutSpeed?: number;
  bessPowerMW?: number;
  bessCapacityMWh?: number;
  bessCurrentSoC?: number;
  currentOutputMW: number;
  availabilityPct: number;
}

export interface WeatherForecastPoint {
  hourOffset: number;
  timestamp: string;
  timeLabel: string;
  ghi: number;
  dni: number;
  dhi: number;
  cloudCoverPct: number;
  ambientTempC: number;
  windSpeed100m: number;
  windDirectionDeg: number;
  airDensity: number;
  relativeHumidityPct: number;
  barometricPressureHpa: number;
}

export interface ModelPrediction {
  prophet: number;
  lstm: number;
  xgboost: number;
  ensemble: number;
  p10: number;
  p90: number;
}

export type ImbalanceSeverity =
  | 'BALANCED'
  | 'OVER_GENERATION'
  | 'UNDER_GENERATION'
  | 'STEEP_RAMP_UP'
  | 'STEEP_RAMP_DOWN';

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
    avoidedLossAmountUSD: number;
    avoidedLossAmountINR: number;
    co2SavedTons: number;
    gridFrequencySupportHz?: number;
  };
  status: 'PENDING' | 'DISPATCHED' | 'DISMISSED';
  timestamp: string;
  /** Optional Gemini-refined narrative */
  aiNarrative?: string;
}

export interface GenerationForecastPoint {
  hourOffset: number;
  timestamp: string;
  timeLabel: string;
  dayLabel: string;
  isNight: boolean;
  weather: WeatherForecastPoint;
  solarForecast: ModelPrediction;
  windForecast: ModelPrediction;
  totalForecast: ModelPrediction;
  gridDemandScheduledMW: number;
  generationDeltaMW: number;
  rampRateMWperHr: number;
  imbalanceSeverity: ImbalanceSeverity;
  dayAheadLMP: number;
  realTimeLMPProjected: number;
  bessArbitragePotentialUSD: number;
  bessArbitragePotentialINR: number;
  recommendedAction?: GridActionRecommendation;
}

export interface SimulationParameters {
  horizonHours: 24 | 48 | 72;
  selectedModel: 'ensemble' | 'prophet' | 'lstm' | 'xgboost';
  selectedPlantId: 'ALL' | string;
  showConfidenceIntervals: boolean;
  weatherModifier: {
    cloudCoverSpikePct: number;
    windSpeedMultiplier: number;
    tempOffsetC: number;
    stormEventHour?: number;
    activePreset: 'NORMAL' | 'CLOUD_FRONT' | 'WIND_LULL' | 'GALE_CUTOUT' | 'HEATWAVE';
  };
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

export interface ForecastRequest {
  horizonHours?: 24 | 48 | 72;
  selectedModel?: 'ensemble' | 'prophet' | 'lstm' | 'xgboost';
  selectedPlantId?: 'ALL' | string;
  showConfidenceIntervals?: boolean;
  weatherModifier?: Partial<SimulationParameters['weatherModifier']>;
  tariffBaseUSDperMWh?: number;
  imbalancePenaltyRateUSDperMWh?: number;
  /** When true, call Gemini to polish action rationales */
  enhanceWithAI?: boolean;
}

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

export interface ApiError {
  success: false;
  error: string;
  details?: unknown;
}
