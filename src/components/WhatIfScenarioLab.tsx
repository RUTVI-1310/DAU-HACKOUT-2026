import React from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Sun, 
  Wind, 
  Thermometer, 
  IndianRupee, 
  AlertTriangle, 
  Zap, 
  ShieldCheck, 
  CloudLightning 
} from 'lucide-react';
import { SimulationParameters } from '../types';

interface WhatIfScenarioLabProps {
  params: SimulationParameters;
  onParamsChange: (newParams: SimulationParameters) => void;
  onReset: () => void;
}

export const WhatIfScenarioLab: React.FC<WhatIfScenarioLabProps> = ({
  params,
  onParamsChange,
  onReset,
}) => {
  const mod = params.weatherModifier;

  const handleCloudChange = (val: number) => {
    onParamsChange({
      ...params,
      weatherModifier: {
        ...mod,
        cloudCoverSpikePct: val,
        activePreset: val === 0 && mod.windSpeedMultiplier === 1.0 && mod.tempOffsetC === 0 ? 'NORMAL' : 'CLOUD_FRONT',
      },
    });
  };

  const handleWindChange = (val: number) => {
    onParamsChange({
      ...params,
      weatherModifier: {
        ...mod,
        windSpeedMultiplier: val,
        activePreset: val === 1.0 && mod.cloudCoverSpikePct === 0 && mod.tempOffsetC === 0 ? 'NORMAL' : 'WIND_LULL',
      },
    });
  };

  const handleTempChange = (val: number) => {
    onParamsChange({
      ...params,
      weatherModifier: {
        ...mod,
        tempOffsetC: val,
        activePreset: val === 0 && mod.cloudCoverSpikePct === 0 && mod.windSpeedMultiplier === 1.0 ? 'NORMAL' : 'HEATWAVE',
      },
    });
  };

  const handleTariffChange = (val: number) => {
    onParamsChange({
      ...params,
      tariffBaseUSDperMWh: val,
    });
  };

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-6 sm:space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Interactive "What-If" Contingency &amp; Weather Simulation Studio
            </h3>
            <p className="text-xs text-slate-500">
              Stress-test the grid under sudden cloud incursions, extreme wind drop-offs, and tariff volatility.
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-700 transition"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
          <span>Reset to Normal Baseline</span>
        </button>
      </div>

      {/* Interactive Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        
        {/* 1. Cloud Cover Spike */}
        <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center space-x-1.5">
              <Sun className="w-4 h-4 text-amber-500" />
              <span>Cloud Cover Incursion</span>
            </span>
            <span className="font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
              {mod.cloudCoverSpikePct > 0 ? `+${mod.cloudCoverSpikePct}%` : `${mod.cloudCoverSpikePct}%`}
            </span>
          </div>
          <input
            type="range"
            min="-30"
            max="80"
            step="5"
            value={mod.cloudCoverSpikePct}
            onChange={(e) => handleCloudChange(parseFloat(e.target.value))}
            className="w-full accent-amber-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Clear Sky (-30%)</span>
            <span>Overcast (+80%)</span>
          </div>
        </div>

        {/* 2. Wind Velocity Multiplier */}
        <div className="p-4 rounded-xl bg-cyan-50/50 border border-cyan-200/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center space-x-1.5">
              <Wind className="w-4 h-4 text-cyan-500" />
              <span>Wind Speed Multiplier</span>
            </span>
            <span className="font-mono text-cyan-800 bg-cyan-100 px-2 py-0.5 rounded">
              {mod.windSpeedMultiplier.toFixed(1)}x
            </span>
          </div>
          <input
            type="range"
            min="0.2"
            max="2.2"
            step="0.1"
            value={mod.windSpeedMultiplier}
            onChange={(e) => handleWindChange(parseFloat(e.target.value))}
            className="w-full accent-cyan-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Lull (0.2x)</span>
            <span>Gale Force (2.2x)</span>
          </div>
        </div>

        {/* 3. Temperature Offset */}
        <div className="p-4 rounded-xl bg-orange-50/50 border border-orange-200/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center space-x-1.5">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span>Ambient Temp Shift</span>
            </span>
            <span className="font-mono text-orange-800 bg-orange-100 px-2 py-0.5 rounded">
              {mod.tempOffsetC > 0 ? `+${mod.tempOffsetC}°C` : `${mod.tempOffsetC}°C`}
            </span>
          </div>
          <input
            type="range"
            min="-10"
            max="15"
            step="1"
            value={mod.tempOffsetC}
            onChange={(e) => handleTempChange(parseFloat(e.target.value))}
            className="w-full accent-orange-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>Cold Front (-10°C)</span>
            <span>Heatwave (+15°C)</span>
          </div>
        </div>

        {/* 4. Base Tariff (₹/MWh) */}
        <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-200/60 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-800">
            <span className="flex items-center space-x-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <span>PPA Base Electricity Rate</span>
            </span>
            <span className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              ₹{Math.round(params.tariffBaseUSDperMWh * 80).toLocaleString()}/MWh
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="180"
            step="5"
            value={params.tariffBaseUSDperMWh}
            onChange={(e) => handleTariffChange(parseFloat(e.target.value))}
            className="w-full accent-emerald-600 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>₹1,600/MWh</span>
            <span>₹14,400/MWh Peak</span>
          </div>
        </div>
      </div>

      {/* Real-time Scenario Explanation Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <CloudLightning className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-slate-300">
            {mod.activePreset === 'NORMAL' && 'Normal synoptic atmospheric profile: steady trade winds and typical clearsky diurnal solar radiation.'}
            {mod.activePreset === 'CLOUD_FRONT' && 'Severe cloud incursion event: steep solar drop-off triggers Duck Curve evening ramp protection protocol.'}
            {mod.activePreset === 'WIND_LULL' && 'Atmospheric high-pressure blocking system: wind generation falls below 15% capacity, requiring spinning peaker alerts.'}
            {mod.activePreset === 'GALE_CUTOUT' && 'High-wind storm front: wind speeds exceeding 25.0 m/s trigger automated turbine aerodynamic feathering to protect gearboxes.'}
            {mod.activePreset === 'HEATWAVE' && 'Extreme thermal condition: PV module cells exceed 62°C, causing a ~14% thermal derating on solar conversion efficiency.'}
          </span>
        </div>

        <span className="font-mono text-[11px] text-emerald-400 bg-slate-800 px-2.5 py-1 rounded shrink-0">
          Physics Engine: Active
        </span>
      </div>
    </div>
  );
};
