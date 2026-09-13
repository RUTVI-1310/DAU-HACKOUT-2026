import { useState, useMemo, useEffect } from 'react';
import { Link } from 'wouter';
import {
  SlidersHorizontal,
  Flame,
  Wind,
  Sun,
  AlertTriangle,
  Clock,
  TrendingDown,
  Gauge,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  Wrench,
  ShieldAlert,
  ArrowRight,
  ChevronRight,
  Zap,
  Activity,
  Calendar,
  Layers,
  Thermometer,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ChartTooltip,
  AreaChart,
  Area,
  Legend,
} from 'recharts';

export interface WhatIfParams {
  assetId: string;
  temperatureOffset: number;
  windSpeedFactor: number;
  irradianceFactor: number;
  soilingFactor: number;
  curtailmentPct: number;
  maintenanceDelayDays: number;
  deratePct: number;
}

export interface PresetScenario {
  id: string;
  name: string;
  category: string;
  badge: string;
  description: string;
  params: WhatIfParams;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'heatwave',
    name: 'Extreme Summer Heatwave',
    category: 'Environmental Stress',
    badge: 'Thermal Derate',
    description: '+8°C ambient temperature rise causing inverter thermal derating and solar PV cell efficiency loss (-0.4%/°C).',
    params: {
      assetId: 'WT-017',
      temperatureOffset: 8,
      windSpeedFactor: 1.0,
      irradianceFactor: 1.05,
      soilingFactor: 5,
      curtailmentPct: 0,
      maintenanceDelayDays: 0,
      deratePct: 100,
    },
  },
  {
    id: 'gale_wind',
    name: 'Kutch High-Wind Gale & Cut-Out',
    category: 'Aerodynamic Limit',
    badge: 'Cut-Out Stall',
    description: 'Wind gusts exceeding 23.5 m/s near cut-out threshold (25 m/s), triggering pitch feathering and vibration alarms.',
    params: {
      assetId: 'WT-017',
      temperatureOffset: 1,
      windSpeedFactor: 1.95,
      irradianceFactor: 0.9,
      soilingFactor: 10,
      curtailmentPct: 0,
      maintenanceDelayDays: 0,
      deratePct: 100,
    },
  },
  {
    id: 'dust_soiling',
    name: 'Thar Desert Soiling & Dust Storm',
    category: 'Optical Attenuation',
    badge: 'PV Soiling',
    description: '+35% heavy particulate accumulation on solar arrays and nacelle air filters in Rajasthan/Gujarat.',
    params: {
      assetId: 'ST-013',
      temperatureOffset: 3,
      windSpeedFactor: 1.1,
      irradianceFactor: 0.75,
      soilingFactor: 35,
      curtailmentPct: 0,
      maintenanceDelayDays: 0,
      deratePct: 100,
    },
  },
  {
    id: 'grid_curtailment',
    name: 'SLDC 30% Grid Curtailment Directive',
    category: 'Grid Mandate',
    badge: 'Active Curtailment',
    description: 'State Load Dispatch Center orders mandatory 30% active power curtailment due to transmission congestion.',
    params: {
      assetId: 'WT-017',
      temperatureOffset: 0,
      windSpeedFactor: 1.0,
      irradianceFactor: 1.0,
      soilingFactor: 0,
      curtailmentPct: 30,
      maintenanceDelayDays: 0,
      deratePct: 70,
    },
  },
  {
    id: 'maintenance_deferral',
    name: 'WT-017 14-Day Maintenance Deferral',
    category: 'Operational Risk',
    badge: 'Catastrophic Wear',
    description: 'Simulates operating WT-017 with existing drive-train vibration for 14 additional days without technician servicing.',
    params: {
      assetId: 'WT-017',
      temperatureOffset: 4,
      windSpeedFactor: 1.15,
      irradianceFactor: 1.0,
      soilingFactor: 0,
      curtailmentPct: 0,
      maintenanceDelayDays: 14,
      deratePct: 100,
    },
  },
];

const ASSET_LIST = [
  { id: 'WT-017', type: 'WIND', location: 'Kutch North · Gujarat', capacity: 2.0, baseHealth: 63, basePower: 1.60, expectedPower: 1.95 },
  { id: 'WT-004', type: 'WIND', location: 'Kutch North · Gujarat', capacity: 2.0, baseHealth: 91, basePower: 1.87, expectedPower: 1.92 },
  { id: 'WT-021', type: 'WIND', location: 'Jaisalmer Ridge · Rajasthan', capacity: 2.0, baseHealth: 76, basePower: 1.72, expectedPower: 1.90 },
  { id: 'ST-008', type: 'SOLAR', location: 'Pavagada East · Karnataka', capacity: 2.5, baseHealth: 88, basePower: 2.06, expectedPower: 2.22 },
  { id: 'ST-013', type: 'SOLAR', location: 'Rewa South · Madhya Pradesh', capacity: 2.5, baseHealth: 82, basePower: 1.94, expectedPower: 2.18 },
  { id: 'ST-022', type: 'SOLAR', location: 'Kamuthi · Tamil Nadu', capacity: 2.5, baseHealth: 96, basePower: 2.30, expectedPower: 2.34 },
];

export function WhatIfPage() {
  const [selectedAssetId, setSelectedAssetId] = useState('WT-017');
  const [activePreset, setActivePreset] = useState<string | null>('maintenance_deferral');

  const [tempOffset, setTempOffset] = useState(4);
  const [windFactor, setWindFactor] = useState(1.15);
  const [irradianceFactor, setIrradianceFactor] = useState(1.0);
  const [soilingFactor, setSoilingFactor] = useState(0);
  const [curtailmentPct, setCurtailmentPct] = useState(0);
  const [delayDays, setDelayDays] = useState(14);
  const [deratePct, setDeratePct] = useState(100);

  const [appliedMitigation, setAppliedMitigation] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const currentAsset = useMemo(
    () => ASSET_LIST.find((a) => a.id === selectedAssetId) || ASSET_LIST[0],
    [selectedAssetId]
  );

  const applyPreset = (preset: PresetScenario) => {
    setActivePreset(preset.id);
    setSelectedAssetId(preset.params.assetId);
    setTempOffset(preset.params.temperatureOffset);
    setWindFactor(preset.params.windSpeedFactor);
    setIrradianceFactor(preset.params.irradianceFactor);
    setSoilingFactor(preset.params.soilingFactor);
    setCurtailmentPct(preset.params.curtailmentPct);
    setDelayDays(preset.params.maintenanceDelayDays);
    setDeratePct(preset.params.deratePct);
    setAppliedMitigation(false);
    showToast(`Loaded preset: ${preset.name}`);
  };

  const resetToBaseline = () => {
    setActivePreset(null);
    setTempOffset(0);
    setWindFactor(1.0);
    setIrradianceFactor(1.0);
    setSoilingFactor(0);
    setCurtailmentPct(0);
    setDelayDays(0);
    setDeratePct(100);
    setAppliedMitigation(false);
    showToast('Reset to nominal baseline telemetry');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Physical & Mechanical Simulation
  const simulation = useMemo(() => {
    const isWind = currentAsset.type === 'WIND';
    const baseTemp = isWind ? 64.0 : 42.0;
    const baseVib = isWind ? (currentAsset.id === 'WT-017' ? 4.3 : 3.1) : 0.8;
    const baseWind = 11.2;
    const cap = currentAsset.capacity;

    const simTemp = Number((baseTemp + tempOffset + delayDays * 0.45 - (100 - deratePct) * 0.08).toFixed(2));
    const delayFatigue = 1.0 + Math.pow(delayDays / 8.5, 1.6) * 0.42;
    const derateRelief = deratePct / 100.0;
    const simVib = Number(
      (
        baseVib *
        (isWind ? (windFactor > 1.8 ? 1.45 : windFactor > 1.2 ? 1.2 : 1.0) : 1.0) *
        delayFatigue *
        (0.6 + 0.4 * derateRelief)
      ).toFixed(2)
    );

    const simWind = Number((baseWind * windFactor).toFixed(2));
    const isCutOut = isWind && simWind >= 25.0;

    let unconstrainedPower = currentAsset.basePower;
    if (isWind) {
      if (isCutOut) {
        unconstrainedPower = 0.0;
      } else {
        const windEff = Math.min(1.0, Math.pow(Math.min(simWind, 13.0) / 11.2, 2.5));
        unconstrainedPower = Math.min(cap, cap * windEff);
        if (simTemp > 72) {
          unconstrainedPower *= 1 - (simTemp - 72) * 0.015;
        }
      }
    } else {
      const thermalLoss = Math.max(0, (simTemp - 25) * 0.004);
      const opticalLoss = soilingFactor / 100.0;
      unconstrainedPower = Math.min(cap, cap * 0.92 * irradianceFactor * (1 - opticalLoss) * (1 - thermalLoss));
    }

    let simPower = unconstrainedPower * derateRelief;
    if (curtailmentPct > 0) {
      simPower *= 1 - curtailmentPct / 100.0;
    }
    simPower = Math.max(0, Number(simPower.toFixed(3)));

    const vibImpact = Math.max(0, (simVib - 3.2) * 14.0);
    const tempImpact = Math.max(0, (simTemp - (isWind ? 65 : 45)) * 2.8);
    const delayImpact = delayDays * 2.4;
    const simHealth = Math.max(
      12,
      Math.min(100, Math.round(currentAsset.baseHealth - vibImpact - tempImpact - delayImpact + (100 - deratePct) * 0.15))
    );

    let simRulDays = Math.max(
      1.2,
      Number(((simHealth / 100.0) * 120 / delayFatigue * (1.1 - (1 - derateRelief) * 0.3)).toFixed(1))
    );
    if (simHealth < 35 || simVib > 5.8) simRulDays = Math.max(0.8, Number((simRulDays * 0.35).toFixed(1)));

    const failureProbability = Number(
      Math.min(97.2, Math.max(2.0, (100 - simHealth) * 0.88 + delayDays * 1.8 + (simVib > 5.0 ? 25 : 0))).toFixed(1)
    );

    const powerLossMW = Math.max(0, Number((currentAsset.expectedPower - simPower).toFixed(3)));
    const hourlyLossINR = Math.round(powerLossMW * 1000 * 6.0);
    const cumulative30DayLossINR = Math.round(hourlyLossINR * 24 * 30);
    const catastrophicRiskINR = failureProbability > 60 ? 3850000 : failureProbability > 30 ? 1250000 : 0;

    let simStatus = 'HEALTHY';
    if (simHealth < 35 || failureProbability > 70) simStatus = 'CRITICAL';
    else if (simHealth < 55 || failureProbability > 40) simStatus = 'WARNING';
    else if (simHealth < 75 || failureProbability > 20) simStatus = 'WATCH';

    let prescriptiveAction = 'Operating telemetry is within nominal parameters. Continue standard monitoring.';
    if (isCutOut) {
      prescriptiveAction =
        'CRITICAL: Wind speeds exceeding 25.0 m/s cut-out threshold. Feather blades and engage pitch brakes immediately to prevent overspeed destruction.';
    } else if (delayDays >= 10 && failureProbability > 65) {
      prescriptiveAction = `URGENT: Maintenance deferral of ${delayDays} days elevates catastrophic gearbox/bearing seizure risk to ${failureProbability}%. Proactively derate unit to 70% and dispatch emergency repair team within 24 hours to avoid ₹38.5 Lakhs rebuild cost.`;
    } else if (simTemp > 74) {
      prescriptiveAction =
        'High thermal excursion detected. Activate auxiliary heat-exchanger pumps or throttle active power output by 15% to prevent stator insulation breakdown.';
    } else if (soilingFactor >= 20) {
      prescriptiveAction = `Severe array soiling is causing ${powerLossMW} MW generation curtailment (loss of ₹${hourlyLossINR.toLocaleString('en-IN')}/hr). Dispatch automated water-spray washing units to recover output.`;
    } else if (curtailmentPct > 0) {
      prescriptiveAction = `SLDC ${curtailmentPct}% active power curtailment in effect. Divert ${powerLossMW} MW excess generation to on-site BESS (Battery Storage System) to preserve commercial revenue.`;
    }

    // 28-day projection trajectory
    const projection = Array.from({ length: 15 }, (_, i) => {
      const day = i * 2;
      const dayHealth = Math.max(6, Math.round(simHealth - day * (failureProbability / 28.0)));
      const dayPower = Math.max(0.1, Number((simPower * (1 - day * 0.018)).toFixed(2)));
      const dayVib = Number((simVib + day * 0.11).toFixed(2));
      const dayTemp = Number((simTemp + Math.sin(day) * 1.4).toFixed(1));
      return {
        day: `Day ${day}`,
        baselineHealth: Math.max(25, Math.round(currentAsset.baseHealth - day * 0.7)),
        simulatedHealth: dayHealth,
        baselinePower: currentAsset.basePower,
        simulatedPower: dayPower,
        vibration: dayVib,
        temperature: dayTemp,
      };
    });

    return {
      simTemp,
      simVib,
      simWind,
      isCutOut,
      simPower,
      simHealth,
      simRulDays,
      failureProbability,
      powerLossMW,
      hourlyLossINR,
      cumulative30DayLossINR,
      catastrophicRiskINR,
      simStatus,
      prescriptiveAction,
      projection,
    };
  }, [
    currentAsset,
    tempOffset,
    windFactor,
    irradianceFactor,
    soilingFactor,
    curtailmentPct,
    delayDays,
    deratePct,
  ]);

  const handleApplyDerate = () => {
    setDeratePct(70);
    setAppliedMitigation(true);
    showToast('Proactive 70% derate applied: Thermal stress & vibration reduced');
  };

  const handleCreateWorkOrder = async () => {
    try {
      await fetch('/api/work-orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetId: currentAsset.id,
          issue: `What-If Prescriptive: ${simulation.simStatus} Risk (${activePreset || 'Custom Stress Test'})`,
          priority: simulation.simStatus === 'CRITICAL' ? 'P1' : simulation.simStatus === 'WARNING' ? 'P2' : 'P3',
          technician: 'Aarav Mehta',
          scheduledDate: new Date().toISOString().split('T')[0],
          notes: `${simulation.prescriptiveAction} | Predicted RUL: ${simulation.simRulDays} days. Catastrophic risk: ₹${simulation.catastrophicRiskINR.toLocaleString('en-IN')}`,
        }),
      });
    } catch {
      // offline fallback
    }
    showToast(`Preventative work order draft dispatched for ${currentAsset.id}`);
  };

  return (
    <div className="mx-auto max-w-[1450px] fade-up space-y-7">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2">
            <span className="eyebrow text-[hsl(var(--primary))] font-bold">
              Feature 52 · Predictive Simulation Engine
            </span>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
              Interactive What-If Studio
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">
            What-If Scenario Simulator
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-3xl">
            Stress-test renewable assets under simulated environmental anomalies, maintenance delays, and grid directives.
            Quantify degradation trajectory, remaining useful life (RUL), and revenue impact before taking field action.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            data-testid="button-whatif-reset"
            onClick={resetToBaseline}
            className="flex items-center gap-1.5 rounded-xl border bg-[hsl(var(--card))] px-3.5 py-2 text-xs font-bold hover:bg-[hsl(var(--muted))] transition"
          >
            <RotateCcw size={14} />
            Reset Baseline
          </button>
          <Link
            href="/forecast"
            data-testid="link-whatif-to-forecast"
            className="flex items-center gap-1.5 rounded-xl bg-[hsl(var(--primary))] px-3.5 py-2 text-xs font-bold text-[hsl(var(--primary-foreground))] shadow-md hover:opacity-95 transition"
          >
            Go to Forecast Studio
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div
          data-testid="whatif-toast"
          className="fixed bottom-6 right-6 z-50 rounded-xl bg-[hsl(var(--primary))] px-4 py-3 text-xs font-bold text-[hsl(var(--primary-foreground))] shadow-2xl fade-up flex items-center gap-2"
        >
          <CheckCircle2 size={16} />
          {toastMessage}
        </div>
      )}

      {/* Presets Strip */}
      <div className="panel p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="eyebrow text-muted-foreground flex items-center gap-2">
            <Sparkles size={14} className="text-[hsl(var(--primary))]" />
            <span>Industrial Scenario Presets (1-Click Stress Tests)</span>
          </div>
          <span className="mono text-[11px] text-muted-foreground">Select to load pre-calibrated parameter envelope</span>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PRESET_SCENARIOS.map((preset) => {
            const isSelected = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                data-testid={`preset-card-${preset.id}`}
                onClick={() => applyPreset(preset)}
                className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] ring-1 ring-[hsl(var(--primary))]'
                    : 'bg-[hsl(var(--card))] hover:bg-[hsl(var(--muted)/0.5)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      {preset.category}
                    </span>
                    <span
                      className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                        preset.id === 'maintenance_deferral'
                          ? 'bg-red-100 text-red-800'
                          : preset.id === 'heatwave'
                          ? 'bg-amber-100 text-amber-800'
                          : preset.id === 'gale_wind'
                          ? 'bg-sky-100 text-sky-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {preset.badge}
                    </span>
                  </div>
                  <strong className="block text-xs font-bold leading-snug">{preset.name}</strong>
                  <p className="mt-1 text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-[hsl(var(--primary))]">
                    <CheckCircle2 size={12} /> Active Scenario
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Left Control Deck, Right Analytics & Charts */}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_1.85fr]">
        {/* Left: Interactive Controls */}
        <div className="space-y-6">
          <div className="panel p-5">
            <div className="flex items-center justify-between pb-3 border-b">
              <div className="flex items-center gap-2">
                <SlidersHorizontal size={16} className="text-[hsl(var(--primary))]" />
                <h2 className="text-base font-bold">Simulation Parameter Deck</h2>
              </div>
              {/* Asset Selector */}
              <select
                data-testid="select-whatif-asset"
                value={selectedAssetId}
                onChange={(e) => {
                  setSelectedAssetId(e.target.value);
                  setActivePreset(null);
                }}
                className="rounded-lg border bg-[hsl(var(--background))] px-2.5 py-1 text-xs font-bold outline-none"
              >
                {ASSET_LIST.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.id} · {a.type} ({a.location.split(' · ')[0]})
                  </option>
                ))}
              </select>
            </div>

            {/* Asset Status Quick View */}
            <div className="my-4 rounded-xl border bg-[hsl(var(--muted)/0.35)] p-3 flex items-center justify-between text-xs">
              <div>
                <span className="mono font-bold text-sm">{currentAsset.id}</span>
                <span className="ml-2 text-muted-foreground">{currentAsset.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground">
                  Cap: <strong className="mono text-foreground">{currentAsset.capacity} MW</strong>
                </span>
                <span className="text-muted-foreground">
                  Health: <strong className="mono text-foreground">{currentAsset.baseHealth}/100</strong>
                </span>
              </div>
            </div>

            {/* Sliders Container */}
            <div className="space-y-5 pt-2">
              {/* 1. Ambient Temperature Offset */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Thermometer size={14} className="text-amber-600" />
                    Ambient Temperature Offset
                  </span>
                  <span className="mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                    {tempOffset > 0 ? `+${tempOffset}` : tempOffset} °C (Sim: {simulation.simTemp}°C)
                  </span>
                </div>
                <input
                  type="range"
                  data-testid="slider-temp-offset"
                  min={-5}
                  max={20}
                  step={1}
                  value={tempOffset}
                  onChange={(e) => {
                    setTempOffset(Number(e.target.value));
                    setActivePreset(null);
                  }}
                  className="w-full accent-[hsl(var(--primary))] cursor-pointer h-1.5 bg-muted rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>-5°C (Winter)</span>
                  <span>0°C (Baseline)</span>
                  <span>+20°C (Heatwave Peak)</span>
                </div>
              </div>

              {/* 2. Wind Speed Multiplier */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Wind size={14} className="text-sky-600" />
                    Wind Velocity Multiplier
                  </span>
                  <span className="mono font-bold px-2 py-0.5 rounded bg-sky-50 text-sky-900 border border-sky-200">
                    {windFactor.toFixed(2)}x ({simulation.simWind} m/s)
                  </span>
                </div>
                <input
                  type="range"
                  data-testid="slider-wind-factor"
                  min={0.5}
                  max={2.5}
                  step={0.05}
                  value={windFactor}
                  onChange={(e) => {
                    setWindFactor(Number(e.target.value));
                    setActivePreset(null);
                  }}
                  className="w-full accent-[hsl(var(--primary))] cursor-pointer h-1.5 bg-muted rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0.5x (Lull 5.6 m/s)</span>
                  <span>1.0x (Rated 11.2 m/s)</span>
                  <span className="text-red-600 font-bold">2.5x (Cut-out 28 m/s)</span>
                </div>
              </div>

              {/* 3. Solar Soiling & Dust Loss */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Sun size={14} className="text-amber-500" />
                    PV Array Soiling / Optical Dust Loss
                  </span>
                  <span className="mono font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-900 border border-amber-200">
                    {soilingFactor}% dust opacity
                  </span>
                </div>
                <input
                  type="range"
                  data-testid="slider-soiling-factor"
                  min={0}
                  max={50}
                  step={2}
                  value={soilingFactor}
                  onChange={(e) => {
                    setSoilingFactor(Number(e.target.value));
                    setActivePreset(null);
                  }}
                  className="w-full accent-[hsl(var(--primary))] cursor-pointer h-1.5 bg-muted rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0% (Clean Modules)</span>
                  <span>25% (Moderate Dust)</span>
                  <span>50% (Desert Dust Storm)</span>
                </div>
              </div>

              {/* 4. Maintenance Deferral Window */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Clock size={14} className="text-red-600" />
                    Service Deferral Window (Days Deferred)
                  </span>
                  <span className="mono font-bold px-2 py-0.5 rounded bg-red-50 text-red-900 border border-red-200">
                    +{delayDays} days unserviced
                  </span>
                </div>
                <input
                  type="range"
                  data-testid="slider-delay-days"
                  min={0}
                  max={30}
                  step={1}
                  value={delayDays}
                  onChange={(e) => {
                    setDelayDays(Number(e.target.value));
                    setActivePreset(null);
                  }}
                  className="w-full accent-red-600 cursor-pointer h-1.5 bg-muted rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0 Days (Immediate Fix)</span>
                  <span>14 Days (Critical Window)</span>
                  <span className="text-red-700 font-bold">30 Days (Catastrophic)</span>
                </div>
              </div>

              {/* 5. SLDC Active Curtailment Mandate */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Zap size={14} className="text-purple-600" />
                    SLDC Grid Curtailment Directive
                  </span>
                  <span className="mono font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200">
                    {curtailmentPct}% curtailment
                  </span>
                </div>
                <input
                  type="range"
                  data-testid="slider-curtailment"
                  min={0}
                  max={80}
                  step={5}
                  value={curtailmentPct}
                  onChange={(e) => {
                    setCurtailmentPct(Number(e.target.value));
                    setActivePreset(null);
                  }}
                  className="w-full accent-purple-600 cursor-pointer h-1.5 bg-muted rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>0% (Full Dispatch)</span>
                  <span>40% (Partial Grid Lock)</span>
                  <span>80% (Emergency Curtailment)</span>
                </div>
              </div>

              {/* 6. Proactive Operational Derating */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="font-semibold flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-700" />
                    Proactive Operating Derating Cap
                  </span>
                  <span className="mono font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-900 border border-emerald-200">
                    {deratePct}% nameplate load
                  </span>
                </div>
                <input
                  type="range"
                  data-testid="slider-derate-pct"
                  min={50}
                  max={100}
                  step={5}
                  value={deratePct}
                  onChange={(e) => {
                    setDeratePct(Number(e.target.value));
                    setActivePreset(null);
                  }}
                  className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-muted rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>50% (Conservative Relief)</span>
                  <span>75% (Balanced Derate)</span>
                  <span>100% (Full Continuous)</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Prescriptive Mitigation Card */}
          <div className="panel p-5 border-l-4 border-l-amber-500 bg-amber-50/30">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-2">
              <AlertTriangle size={15} className="text-amber-600" />
              AI Prescriptive Engineering Recommendation
            </div>
            <p className="text-xs leading-relaxed text-amber-950 font-medium">
              {simulation.prescriptiveAction}
            </p>

            <div className="mt-4 pt-3 border-t border-amber-200 flex flex-wrap gap-2">
              <button
                data-testid="button-apply-derate"
                onClick={handleApplyDerate}
                disabled={deratePct <= 70}
                className="flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow hover:bg-emerald-700 transition disabled:opacity-50"
              >
                <ShieldCheck size={13} />
                {appliedMitigation ? '70% Derate Active' : 'Apply 70% Proactive Derate'}
              </button>

              <button
                data-testid="button-whatif-workorder"
                onClick={handleCreateWorkOrder}
                className="flex items-center gap-1.5 rounded-lg border bg-[hsl(var(--card))] px-3 py-2 text-xs font-bold hover:bg-[hsl(var(--muted))] transition"
              >
                <Wrench size={13} />
                Dispatch Preventative Work Order
              </button>
            </div>
          </div>
        </div>

        {/* Right: Real-Time Dynamic Outcomes & Trajectory Charts */}
        <div className="space-y-6">
          {/* KPI Outcome Cards */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {/* Health Score */}
            <div className="panel p-4">
              <div className="eyebrow text-muted-foreground">Simulated Health</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="mono text-3xl font-extrabold">
                  {simulation.simHealth}
                </span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    simulation.simHealth > 75
                      ? 'bg-emerald-500'
                      : simulation.simHealth > 50
                      ? 'bg-amber-500'
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${simulation.simHealth}%` }}
                />
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                Base: {currentAsset.baseHealth} ({simulation.simHealth - currentAsset.baseHealth >= 0 ? '+' : ''}
                {simulation.simHealth - currentAsset.baseHealth})
              </div>
            </div>

            {/* Remaining Useful Life */}
            <div className="panel p-4">
              <div className="eyebrow text-muted-foreground">Estimated RUL</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="mono text-3xl font-extrabold text-amber-700">
                  {simulation.simRulDays}
                </span>
                <span className="text-xs text-muted-foreground">Days</span>
              </div>
              <div className="mt-2 text-[11px] font-bold text-muted-foreground">
                {Math.round(simulation.simRulDays * 24)} operating hrs
              </div>
              <div className="mt-1 text-[10px] text-muted-foreground">
                Baseline: ~42.0 days
              </div>
            </div>

            {/* Failure Probability */}
            <div className="panel p-4">
              <div className="eyebrow text-muted-foreground">Failure Risk</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span
                  className={`mono text-3xl font-extrabold ${
                    simulation.failureProbability > 60
                      ? 'text-red-700'
                      : simulation.failureProbability > 30
                      ? 'text-amber-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {simulation.failureProbability}%
                </span>
              </div>
              <div className="mt-2">
                <span
                  className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    simulation.simStatus === 'CRITICAL'
                      ? 'bg-red-100 text-red-800'
                      : simulation.simStatus === 'WARNING'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {simulation.simStatus} TIER
                </span>
              </div>
            </div>

            {/* Financial Revenue Exposure */}
            <div className="panel p-4">
              <div className="eyebrow text-muted-foreground">Hourly Loss @ ₹6/kWh</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="mono text-2xl font-extrabold text-red-700">
                  ₹{simulation.hourlyLossINR.toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-muted-foreground">/hr</span>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground">
                30-Day Exposure: <strong>₹{(simulation.cumulative30DayLossINR / 100000).toFixed(2)} Lakhs</strong>
              </div>
              {simulation.catastrophicRiskINR > 0 && (
                <div className="mt-1 text-[10px] text-red-700 font-bold">
                  Catastrophic Risk: ₹{(simulation.catastrophicRiskINR / 100000).toFixed(1)}L
                </div>
              )}
            </div>
          </div>

          {/* Telemetry Sensor Deltas Grid */}
          <div className="panel overflow-hidden">
            <div className="border-b px-5 py-3.5 flex items-center justify-between">
              <div className="eyebrow text-muted-foreground">Simulated Telemetry vs Baseline</div>
              <div className="text-xs text-muted-foreground">Asset: <strong className="mono">{currentAsset.id}</strong></div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-4 sm:divide-y-0">
              <div className="p-4">
                <div className="text-[10px] text-muted-foreground">Active Power</div>
                <div className="mono text-lg font-bold mt-1">
                  {simulation.simPower.toFixed(2)} <small className="text-xs text-muted-foreground">MW</small>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Base: {currentAsset.basePower.toFixed(2)} MW ({simulation.simPower < currentAsset.basePower ? '-' : '+'}
                  {Math.abs(simulation.simPower - currentAsset.basePower).toFixed(2)})
                </div>
              </div>

              <div className="p-4">
                <div className="text-[10px] text-muted-foreground">Bearing Vibration</div>
                <div className={`mono text-lg font-bold mt-1 ${simulation.simVib > 4.5 ? 'text-red-700' : ''}`}>
                  {simulation.simVib.toFixed(2)} <small className="text-xs text-muted-foreground">mm/s</small>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  ISO Limit: 4.50 mm/s
                </div>
              </div>

              <div className="p-4">
                <div className="text-[10px] text-muted-foreground">Core Temperature</div>
                <div className={`mono text-lg font-bold mt-1 ${simulation.simTemp > 72 ? 'text-amber-800' : ''}`}>
                  {simulation.simTemp.toFixed(1)} <small className="text-xs text-muted-foreground">°C</small>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Thermal Trip: 78.0 °C
                </div>
              </div>

              <div className="p-4">
                <div className="text-[10px] text-muted-foreground">Wind Regime</div>
                <div className={`mono text-lg font-bold mt-1 ${simulation.isCutOut ? 'text-red-700 font-extrabold' : ''}`}>
                  {simulation.simWind.toFixed(1)} <small className="text-xs text-muted-foreground">m/s</small>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {simulation.isCutOut ? 'BLADES FEATHERED' : 'Normal Aero Band'}
                </div>
              </div>
            </div>
          </div>

          {/* Chart 1: 28-Day Health Trajectory Projection */}
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="eyebrow text-muted-foreground">Degradation Trajectory</div>
                <h3 className="text-base font-bold mt-1">
                  28-Day Health Degradation Projection (Baseline vs What-If)
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-emerald-600" /> Baseline
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-red-500" /> What-If Simulated
                </span>
              </div>
            </div>

            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={simulation.projection}>
                  <defs>
                    <linearGradient id="simHealthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="hsl(42 22% 84% / .65)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={35} unit="%" />
                  <ChartTooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid hsl(42 22% 84%)',
                      fontSize: 12,
                      background: 'hsl(45 42% 98%)',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="baselineHealth"
                    stroke="#16a34a"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    fill="none"
                    name="Baseline Health"
                  />
                  <Area
                    type="monotone"
                    dataKey="simulatedHealth"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    fill="url(#simHealthGrad)"
                    name="What-If Health"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
              <span>Non-linear fatigue model (Weibull wear-out accumulation)</span>
              <span className="font-bold text-red-700">
                Tipping point into critical zone: Day {Math.max(2, Math.round(simulation.simRulDays * 0.75))}
              </span>
            </div>
          </div>

          {/* Chart 2: Power Output & Vibration Movement */}
          <div className="panel p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="eyebrow text-muted-foreground">Telemetry Movement</div>
                <h3 className="text-base font-bold mt-1">Power Output vs Vibration Drift</h3>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-[hsl(var(--primary))]" /> Power (MW)
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-amber-600" /> Vibration (mm/s)
                </span>
              </div>
            </div>

            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={simulation.projection}>
                  <CartesianGrid stroke="hsl(42 22% 84% / .65)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis
                    yAxisId="left"
                    domain={[0, 2.5]}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={35}
                    unit=" MW"
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 8]}
                    tick={{ fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    width={45}
                    unit=" mm/s"
                  />
                  <ChartTooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: '1px solid hsl(42 22% 84%)',
                      fontSize: 12,
                      background: 'hsl(45 42% 98%)',
                    }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="simulatedPower"
                    stroke="hsl(164 52% 30%)"
                    strokeWidth={2.5}
                    dot={false}
                    name="Power (MW)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="vibration"
                    stroke="#d97706"
                    strokeWidth={2}
                    dot={false}
                    name="Vibration (mm/s)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
