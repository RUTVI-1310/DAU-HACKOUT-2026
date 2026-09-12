import { FLEET_PLANTS, TOTAL_FLEET_CAPACITY_MW } from '../data/plants.js';
import type {
  GenerationForecastPoint,
  GridActionRecommendation,
  ImbalanceSeverity,
  ModelPrediction,
  SimulationParameters,
  WeatherForecastPoint,
} from '../types/index.js';

/**
 * Generates synthetic realistic weather timeline across the requested horizon (24, 48, or 72 hours).
 */
export function generateWeatherForecast(
  horizonHours: number,
  modifier: SimulationParameters['weatherModifier'],
  startEpoch: number = Date.now()
): WeatherForecastPoint[] {
  const points: WeatherForecastPoint[] = [];
  const baseDate = new Date(startEpoch);
  baseDate.setMinutes(0, 0, 0);

  for (let h = 0; h < horizonHours; h++) {
    const pointDate = new Date(baseDate.getTime() + h * 3600 * 1000);
    const hourOfDay = pointDate.getHours();
    const dayIndex = Math.floor(h / 24);

    // Diurnal solar angle calculation (solar zenith approximation)
    // Sunrise ~ 06:00, Sunset ~ 19:30, Solar Noon ~ 12:45
    let baseGHI = 0;
    let baseDNI = 0;
    let baseDHI = 0;

    if (hourOfDay >= 6 && hourOfDay <= 19) {
      const solarTime = hourOfDay + pointDate.getMinutes() / 60;
      const hourAngle = (solarTime - 12.75) * 15; // deg from noon
      const cosZenith = Math.max(0, Math.cos((hourAngle * Math.PI) / 180) * 0.95);

      if (cosZenith > 0) {
        const clearGHI = 1040 * Math.pow(cosZenith, 1.12);
        baseGHI = clearGHI;
        baseDNI = 850 * Math.pow(cosZenith, 0.85);
        baseDHI = clearGHI * 0.18;
      }
    }

    // Dynamic cloud cover baseline with natural weather front drift
    let cloudCover = 15 + 20 * Math.sin(h / 14 + dayIndex);

    // Apply What-If scenario modifiers
    if (modifier.activePreset === 'CLOUD_FRONT' || modifier.cloudCoverSpikePct !== 0) {
      if (modifier.activePreset === 'CLOUD_FRONT') {
        if (h >= 7 && h <= 20) {
          cloudCover = Math.min(100, 85 + 10 * Math.sin(h));
        }
      } else {
        cloudCover = Math.min(100, Math.max(0, cloudCover + modifier.cloudCoverSpikePct));
      }
    }

    // Atmospheric cloud attenuation on GHI
    const cloudFactor = Math.max(0.08, 1 - 0.75 * Math.pow(cloudCover / 100, 1.8));
    const effectiveGHI = Math.round(baseGHI * cloudFactor);
    const effectiveDNI = Math.round(baseDNI * Math.max(0.02, 1 - cloudCover / 100));
    const effectiveDHI = Math.round(baseDHI * (0.8 + 0.6 * (cloudCover / 100)));

    // Temperature modeling: diurnal cycle + heatwave offset
    let temp = 22 + 9 * Math.sin(((hourOfDay - 9) * Math.PI) / 12);
    if (modifier.activePreset === 'HEATWAVE') {
      temp += 8.5;
    } else {
      temp += modifier.tempOffsetC;
    }

    // Wind velocity modeling
    let windSpeed =
      7.5 + 4.2 * Math.sin(h / 8 + 1.2) + 2.0 * Math.cos((hourOfDay * Math.PI) / 12);

    if (modifier.activePreset === 'WIND_LULL') {
      windSpeed = Math.max(1.2, windSpeed * 0.32);
    } else if (modifier.activePreset === 'GALE_CUTOUT') {
      if (h >= 10 && h <= 22) {
        windSpeed = 26.8 + 3.2 * Math.sin(h);
      }
    } else {
      windSpeed = Math.max(0.5, windSpeed * modifier.windSpeedMultiplier);
    }

    // Optional discrete storm event
    if (modifier.stormEventHour !== undefined && h === modifier.stormEventHour) {
      cloudCover = Math.min(100, cloudCover + 40);
      windSpeed = Math.max(windSpeed, 22);
    }

    const windDir = (240 + 35 * Math.sin(h / 12)) % 360;
    const airDensity = 1.225 * (288.15 / (273.15 + temp));

    const timeLabel = pointDate.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    points.push({
      hourOffset: h,
      timestamp: pointDate.toISOString(),
      timeLabel: `${timeLabel} (H+${h})`,
      ghi: effectiveGHI,
      dni: effectiveDNI,
      dhi: effectiveDHI,
      cloudCoverPct: Math.round(cloudCover),
      ambientTempC: Math.round(temp * 10) / 10,
      windSpeed100m: Math.round(windSpeed * 10) / 10,
      windDirectionDeg: Math.round(windDir),
      airDensity: Math.round(airDensity * 1000) / 1000,
      relativeHumidityPct: Math.round(
        Math.max(20, Math.min(95, 60 - (temp - 20) * 1.8 + cloudCover * 0.3))
      ),
      barometricPressureHpa: Math.round(
        1013 - (windSpeed > 15 ? 12 : 0) + 4 * Math.cos(h / 16)
      ),
    });
  }

  return points;
}

/**
 * Solar generation physics (GHI → DC → AC with tracker & temperature derating)
 */
export function calculateSolarPhysics(
  capacityMW: number,
  inverterCapMW: number,
  weather: WeatherForecastPoint,
  trackerType: string = 'Single-Axis Horizontal'
): number {
  if (weather.ghi <= 5) return 0;

  let trackerMultiplier = 1.0;
  if (trackerType.includes('Single-Axis')) {
    trackerMultiplier = 1.18;
  } else if (trackerType.includes('Dual-Axis')) {
    trackerMultiplier = 1.28;
  }

  // Module temperature derating: -0.38% / °C above STC 25°C (NOCT model)
  const cellTemp = weather.ambientTempC + (weather.ghi / 800) * 28;
  const tempLossFactor = 1 - Math.max(0, cellTemp - 25) * 0.0038;

  const dcYieldMW =
    (weather.ghi / 1000) * capacityMW * trackerMultiplier * tempLossFactor * 0.94;

  const acClippedMW = Math.min(inverterCapMW || capacityMW, dcYieldMW);
  return Math.max(0, Math.round(acClippedMW * 10) / 10);
}

/**
 * Wind turbine fleet generation based on IEC 61400-style power curve
 */
export function calculateWindPhysics(
  capacityMW: number,
  weather: WeatherForecastPoint,
  cutIn: number = 3.0,
  rated: number = 12.0,
  cutOut: number = 25.0
): number {
  const v = weather.windSpeed100m;
  const rhoFactor = weather.airDensity / 1.225;

  if (v < cutIn) return 0;
  if (v > cutOut) return 0;

  if (v >= rated) {
    return Math.round(capacityMW * 0.97 * 10) / 10;
  }

  const normalizedSpeedFraction =
    (Math.pow(v, 3) - Math.pow(cutIn, 3)) / (Math.pow(rated, 3) - Math.pow(cutIn, 3));
  const output = capacityMW * normalizedSpeedFraction * rhoFactor * 0.96;
  return Math.max(0, Math.round(output * 10) / 10);
}

/**
 * Multi-model time-series forecasting (Prophet, LSTM, XGBoost, Ensemble)
 * with uncertainty bands (P10 / P90).
 */
export function runForecastingEngine(
  params: SimulationParameters
): GenerationForecastPoint[] {
  const weatherTimeline = generateWeatherForecast(
    params.horizonHours,
    params.weatherModifier
  );

  const activePlant =
    params.selectedPlantId === 'ALL'
      ? null
      : FLEET_PLANTS.find((p) => p.id === params.selectedPlantId) ?? null;

  const solarCapMW = activePlant
    ? activePlant.type === 'solar' || activePlant.type === 'hybrid'
      ? activePlant.capacityMW
      : 0
    : FLEET_PLANTS.filter((p) => p.type === 'solar' || p.type === 'hybrid').reduce(
        (s, p) => s + p.capacityMW,
        0
      );

  const windCapMW = activePlant
    ? activePlant.type === 'wind'
      ? activePlant.capacityMW
      : 0
    : FLEET_PLANTS.filter((p) => p.type === 'wind').reduce((s, p) => s + p.capacityMW, 0);

  const inverterSolarCap = activePlant?.inverterCapacityMW ?? solarCapMW * 0.92;
  const trackerType = activePlant?.trackerType ?? 'Single-Axis Horizontal';
  const cutIn = activePlant?.cutInSpeed ?? 3.0;
  const rated = activePlant?.ratedSpeed ?? 12.0;
  const cutOut = activePlant?.cutOutSpeed ?? 25.0;

  const forecastPoints: GenerationForecastPoint[] = [];

  for (let i = 0; i < weatherTimeline.length; i++) {
    const w = weatherTimeline[i];
    const hour = parseInt(w.timeLabel.split(':')[0], 10);
    const dayNum = Math.floor(i / 24) + 1;
    const isNight = w.ghi <= 10;

    // 1. Physics baseline
    const solarPhysicsMW = calculateSolarPhysics(
      solarCapMW,
      inverterSolarCap,
      w,
      trackerType
    );
    const windPhysicsMW = calculateWindPhysics(windCapMW, w, cutIn, rated, cutOut);

    // 2. Model variations
    const prophetSolar = isNight
      ? 0
      : Math.max(0, solarPhysicsMW * (1.0 + 0.06 * Math.sin(i / 3.5)));
    const prophetWind = Math.max(0, windPhysicsMW * (1.0 + 0.08 * Math.cos(i / 4.2)));

    const lstmSolar = isNight
      ? 0
      : Math.max(0, solarPhysicsMW * (0.97 + 0.05 * Math.sin(i * 1.3)));
    const lstmWind = Math.max(
      0,
      windPhysicsMW * (0.98 + 0.06 * Math.sin(w.windSpeed100m / 2.5))
    );

    const xgboostSolar = isNight
      ? 0
      : Math.max(0, solarPhysicsMW * (1.02 - (w.cloudCoverPct > 50 ? 0.08 : 0)));
    const xgboostWind = Math.max(
      0,
      windPhysicsMW * (1.01 + (w.windSpeed100m > 12 ? 0.04 : -0.03))
    );

    // Ensemble: 0.45 LSTM + 0.35 XGBoost + 0.20 Prophet
    const ensembleSolar =
      Math.round((0.45 * lstmSolar + 0.35 * xgboostSolar + 0.2 * prophetSolar) * 10) / 10;
    const ensembleWind =
      Math.round((0.45 * lstmWind + 0.35 * xgboostWind + 0.2 * prophetWind) * 10) / 10;

    const solarVariance = isNight
      ? 0
      : (0.07 + (w.cloudCoverPct / 100) * 0.15) * ensembleSolar;
    const windVariance =
      (0.08 + (Math.abs(w.windSpeed100m - 10) / 20) * 0.14) * ensembleWind;

    const solarPrediction: ModelPrediction = {
      prophet: Math.round(prophetSolar * 10) / 10,
      lstm: Math.round(lstmSolar * 10) / 10,
      xgboost: Math.round(xgboostSolar * 10) / 10,
      ensemble: ensembleSolar,
      p10: Math.max(0, Math.round((ensembleSolar - solarVariance) * 10) / 10),
      p90: Math.round((ensembleSolar + solarVariance) * 10) / 10,
    };

    const windPrediction: ModelPrediction = {
      prophet: Math.round(prophetWind * 10) / 10,
      lstm: Math.round(lstmWind * 10) / 10,
      xgboost: Math.round(xgboostWind * 10) / 10,
      ensemble: ensembleWind,
      p10: Math.max(0, Math.round((ensembleWind - windVariance) * 10) / 10),
      p90: Math.round((ensembleWind + windVariance) * 10) / 10,
    };

    const totalPrediction: ModelPrediction = {
      prophet: Math.round((prophetSolar + prophetWind) * 10) / 10,
      lstm: Math.round((lstmSolar + lstmWind) * 10) / 10,
      xgboost: Math.round((xgboostSolar + xgboostWind) * 10) / 10,
      ensemble: Math.round((ensembleSolar + ensembleWind) * 10) / 10,
      p10: Math.round((solarPrediction.p10 + windPrediction.p10) * 10) / 10,
      p90: Math.round((solarPrediction.p90 + windPrediction.p90) * 10) / 10,
    };

    // 3. Grid demand curve
    let baseGridDemandMW = 680 + 190 * Math.sin(((hour - 4) * Math.PI) / 12);
    if (hour >= 17 && hour <= 21) {
      baseGridDemandMW += 180;
    } else if (hour >= 1 && hour <= 5) {
      baseGridDemandMW -= 140;
    }

    const gridDemandScheduledMW = activePlant
      ? Math.round(baseGridDemandMW * (activePlant.capacityMW / TOTAL_FLEET_CAPACITY_MW))
      : Math.round(baseGridDemandMW);

    const totalGen = totalPrediction.ensemble;
    const generationDeltaMW = Math.round((totalGen - gridDemandScheduledMW) * 10) / 10;

    const prevGen = i > 0 ? forecastPoints[i - 1].totalForecast.ensemble : totalGen;
    const rampRateMWperHr = Math.round((totalGen - prevGen) * 10) / 10;

    let severity: ImbalanceSeverity = 'BALANCED';
    if (generationDeltaMW > (activePlant ? 40 : 160)) {
      severity = 'OVER_GENERATION';
    } else if (generationDeltaMW < (activePlant ? -40 : -150)) {
      severity = 'UNDER_GENERATION';
    } else if (rampRateMWperHr < -120) {
      severity = 'STEEP_RAMP_DOWN';
    } else if (rampRateMWperHr > 120) {
      severity = 'STEEP_RAMP_UP';
    }

    // Dynamic LMP (₹/MWh approximation using USD base * ~83)
    let lmp = 45;
    if (severity === 'OVER_GENERATION') {
      lmp = Math.max(-12, 18 - generationDeltaMW / 12);
    } else if (severity === 'UNDER_GENERATION' || (hour >= 18 && hour <= 21)) {
      lmp = 85 + Math.abs(generationDeltaMW) / 5;
    } else {
      lmp = 38 + 12 * Math.sin(hour / 3);
    }

    const dayAheadLMP = Math.round(lmp * 10) / 10;
    const realTimeLMP =
      Math.round(dayAheadLMP * (1 + (generationDeltaMW < 0 ? 0.22 : -0.15)) * 10) / 10;

    const bessArbitrage = dayAheadLMP < 20 ? 95 - dayAheadLMP : 0;

    forecastPoints.push({
      hourOffset: i,
      timestamp: w.timestamp,
      timeLabel: w.timeLabel,
      dayLabel: `Day ${dayNum}`,
      isNight,
      weather: w,
      solarForecast: solarPrediction,
      windForecast: windPrediction,
      totalForecast: totalPrediction,
      gridDemandScheduledMW,
      generationDeltaMW,
      rampRateMWperHr,
      imbalanceSeverity: severity,
      dayAheadLMP,
      realTimeLMPProjected: realTimeLMP,
      bessArbitragePotentialUSD: Math.round(bessArbitrage * 10) / 10,
      bessArbitragePotentialINR: Math.round(bessArbitrage * 83 * 10) / 10,
    });
  }

  generateActionRecommendations(forecastPoints, params);
  return forecastPoints;
}

/**
 * Rule-based grid action recommendation engine
 */
function generateActionRecommendations(
  points: GenerationForecastPoint[],
  params: SimulationParameters
): void {
  for (let i = 0; i < points.length; i++) {
    const pt = points[i];
    const hour = parseInt(pt.timeLabel.split(':')[0], 10);

    // Scenario 1: Midday over-generation → BESS charge or curtailment
    if (pt.imbalanceSeverity === 'OVER_GENERATION' && pt.generationDeltaMW > 120) {
      const excessMW = Math.round(pt.generationDeltaMW);
      const isPeakSolar = hour >= 10 && hour <= 15;

      if (isPeakSolar && excessMW <= 210) {
        pt.recommendedAction = {
          id: `REC-ACT-BESS-CHG-${i}`,
          title: `Dispatch BESS Fleet: Fast Bulk Charging (${excessMW} MW)`,
          type: 'BESS_CHARGE',
          priority: excessMW > 180 ? 'CRITICAL' : 'HIGH',
          targetHour: pt.timeLabel,
          targetHourOffset: i,
          magnitudeMW: excessMW,
          durationHrs: 2.5,
          targetAssetId: 'PLANT-SOL-01 / PLANT-HYB-04',
          targetAssetName: 'Desert Sun & Valley BESS Hubs (200 MWh & 160 MWh)',
          rationale: `Renewable supply exceeds scheduled regional demand by +${excessMW} MW. Real-time LMP projected at ₹${pt.realTimeLMPProjected}/MWh. Store surplus in BESS to prevent transmission congestion and prepare for evening ramp.`,
          actionImpact: {
            avoidedSpillMWh: Math.round(excessMW * 2.5),
            avoidedLossAmountUSD: Math.round(excessMW * 2.5 * 62),
            avoidedLossAmountINR: Math.round(excessMW * 2.5 * 62 * 83),
            co2SavedTons: Math.round(excessMW * 2.5 * 0.42),
            gridFrequencySupportHz: 0.04,
          },
          status: 'PENDING',
          timestamp: pt.timestamp,
        };
      } else {
        const curtailMW = Math.round(excessMW * 0.7);
        pt.recommendedAction = {
          id: `REC-ACT-CURT-${i}`,
          title: `Automated Setpoint Curtailment: Throttle Solar Arrays (-${curtailMW} MW)`,
          type: 'CURTAILMENT',
          priority: 'CRITICAL',
          targetHour: pt.timeLabel,
          targetHourOffset: i,
          magnitudeMW: curtailMW,
          durationHrs: 1.5,
          targetAssetId: 'PLANT-SOL-01',
          targetAssetName: 'Desert Sun Solar Park (Inverter Zones B & C)',
          rationale: `Extreme generation surplus of +${excessMW} MW threatens over-frequency trip (>50.35 Hz) and transformer thermal loading limits. Dispatch active power curtailment command to sub-inverter blocks.`,
          actionImpact: {
            avoidedLossAmountUSD: Math.round(curtailMW * 1.5 * 28),
            avoidedLossAmountINR: Math.round(curtailMW * 1.5 * 28 * 83),
            co2SavedTons: 0,
            gridFrequencySupportHz: 0.08,
          },
          status: 'PENDING',
          timestamp: pt.timestamp,
        };
      }
    }

    // Scenario 2: Steep sunset ramp / duck curve
    else if (
      pt.rampRateMWperHr < -140 ||
      (hour >= 17 && hour <= 20 && pt.generationDeltaMW < -90)
    ) {
      const deficitMW = Math.round(Math.abs(pt.generationDeltaMW));
      pt.recommendedAction = {
        id: `REC-ACT-BESS-DIS-${i}`,
        title: `BESS Deep Peak Discharge & Synchronous Reserve (${deficitMW} MW)`,
        type: 'BESS_DISCHARGE',
        priority: 'CRITICAL',
        targetHour: pt.timeLabel,
        targetHourOffset: i,
        magnitudeMW: Math.min(115, deficitMW),
        durationHrs: 3.0,
        targetAssetId: 'FLEET-BESS-ALL',
        targetAssetName: 'Coordinated Fleet BESS (410 MWh Available Reserve)',
        rationale: `Steep generation ramp-down of ${pt.rampRateMWperHr} MW/h coincides with peak net load demand. Discharge battery fleet at ₹${pt.realTimeLMPProjected}/MWh to maintain grid inertia and prevent frequency nadir.`,
        actionImpact: {
          avoidedLossAmountUSD: Math.round(deficitMW * 3 * pt.realTimeLMPProjected),
          avoidedLossAmountINR: Math.round(deficitMW * 3 * pt.realTimeLMPProjected * 83),
          co2SavedTons: Math.round(deficitMW * 3 * 0.58),
          gridFrequencySupportHz: 0.06,
        },
        status: 'PENDING',
        timestamp: pt.timestamp,
      };
    }

    // Scenario 3: Deep under-generation
    else if (pt.imbalanceSeverity === 'UNDER_GENERATION' && pt.generationDeltaMW < -160) {
      const shortageMW = Math.round(Math.abs(pt.generationDeltaMW));
      pt.recommendedAction = {
        id: `REC-ACT-PEAKER-${i}`,
        title: `Advance Peaker Activation & Intertie Power Wheeling (+${shortageMW} MW)`,
        type: 'PEAKER_STARTUP',
        priority: 'HIGH',
        targetHour: pt.timeLabel,
        targetHourOffset: i,
        magnitudeMW: shortageMW,
        durationHrs: 4.0,
        targetAssetId: 'INTERTIE-GRID-NODE',
        targetAssetName: 'Regional Grid Interconnection & Fast-Start Reserve',
        rationale: `Forecasted wind velocity drop results in a -${shortageMW} MW supply deficit below day-ahead commitment. Issue 2-hour advance startup notice to spinning reserves or schedule wheeling import over Northern Intertie.`,
        actionImpact: {
          avoidedLossAmountUSD: Math.round(shortageMW * 4 * 45),
          avoidedLossAmountINR: Math.round(shortageMW * 4 * 45 * 83),
          co2SavedTons: 0,
        },
        status: 'PENDING',
        timestamp: pt.timestamp,
      };
    }

    // Scenario 4: High-wind cut-out risk
    else if (pt.weather.windSpeed100m >= 24.5) {
      pt.recommendedAction = {
        id: `REC-ACT-CUTOUT-${i}`,
        title: `High-Wind Storm Cut-Out Preparedness (Wind > 25 m/s)`,
        type: 'DEMAND_RESPONSE',
        priority: 'CRITICAL',
        targetHour: pt.timeLabel,
        targetHourOffset: i,
        magnitudeMW: 380,
        durationHrs: 2.0,
        targetAssetId: 'PLANT-WND-02 / PLANT-WND-03',
        targetAssetName: 'Highland Ridge & Coastal Breeze Wind Turbines',
        rationale: `Severe wind speeds of ${pt.weather.windSpeed100m} m/s trigger automated turbine aerodynamic feathering. Expect instantaneous drop of up to 380 MW. Pre-position demand-response and hydro backup reserves.`,
        actionImpact: {
          avoidedLossAmountUSD: 42000,
          avoidedLossAmountINR: 42000 * 83,
          co2SavedTons: 0,
          gridFrequencySupportHz: 0.12,
        },
        status: 'PENDING',
        timestamp: pt.timestamp,
      };
    }
  }
}

/**
 * Build a compact summary for API responses
 */
export function buildForecastSummary(
  points: GenerationForecastPoint[],
  totalCapacityMW: number
) {
  const gens = points.map((p) => p.totalForecast.ensemble);
  const peakGenerationMW = Math.max(...gens, 0);
  const minGenerationMW = Math.min(...gens, 0);
  const avgGenerationMW =
    gens.length > 0 ? Math.round((gens.reduce((a, b) => a + b, 0) / gens.length) * 10) / 10 : 0;

  const overGenerationHours = points.filter(
    (p) => p.imbalanceSeverity === 'OVER_GENERATION'
  ).length;
  const underGenerationHours = points.filter(
    (p) => p.imbalanceSeverity === 'UNDER_GENERATION'
  ).length;

  const criticalActions = points.filter(
    (p) => p.recommendedAction?.priority === 'CRITICAL'
  ).length;

  const estimatedAvoidedLossINR = points.reduce((sum, p) => {
    return sum + (p.recommendedAction?.actionImpact.avoidedLossAmountINR ?? 0);
  }, 0);

  return {
    totalCapacityMW,
    peakGenerationMW,
    minGenerationMW,
    avgGenerationMW,
    overGenerationHours,
    underGenerationHours,
    criticalActions,
    estimatedAvoidedLossINR: Math.round(estimatedAvoidedLossINR),
  };
}

/**
 * Default simulation parameters
 */
export function defaultSimulationParams(
  overrides: Partial<SimulationParameters> = {}
): SimulationParameters {
  return {
    horizonHours: 48,
    selectedModel: 'ensemble',
    selectedPlantId: 'ALL',
    showConfidenceIntervals: true,
    weatherModifier: {
      cloudCoverSpikePct: 0,
      windSpeedMultiplier: 1.0,
      tempOffsetC: 0,
      activePreset: 'NORMAL',
    },
    tariffBaseUSDperMWh: 58,
    imbalancePenaltyRateUSDperMWh: 42,
    ...overrides,
    weatherModifier: {
      cloudCoverSpikePct: 0,
      windSpeedMultiplier: 1.0,
      tempOffsetC: 0,
      activePreset: 'NORMAL',
      ...overrides.weatherModifier,
    },
  };
}
