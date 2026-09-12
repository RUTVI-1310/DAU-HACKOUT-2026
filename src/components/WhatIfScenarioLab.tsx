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
    <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/90 shadow-2xl space-y-6 sm:space-y-7 relative overflow-hidden">
      {/* Top subtle ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500/60 via-indigo-500/40 to-transparent"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-xs">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Interactive "What-If" Contingency &amp; Weather Simulation Studio
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Stress-test grid stability under sudden cloud incursions, extreme wind drop-offs, and tariff volatility.
            </p>
          </div>
        </div>

        <button
          onClick={onReset}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700/80 bg-slate-900/90 hover:bg-slate-800 text-xs font-bold text-slate-200 transition shadow-xs cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset to Normal Baseline</span>
        </button>
      </div>

      {/* Interactive Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        
        {/* 1. Cloud Cover Spike */}
        <div className="glass-panel p-4.5 rounded-xl border border-amber-500/30 bg-slate-900/80 shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center space-x-1.5">
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Cloud Cover Incursion</span>
            </span>
            <span className="font-mono text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
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
            className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Clear Sky (-30%)</span>
            <span>Overcast (+80%)</span>
          </div>
        </div>

        {/* 2. Wind Velocity Multiplier */}
        <div className="glass-panel p-4.5 rounded-xl border border-cyan-500/30 bg-slate-900/80 shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center space-x-1.5">
              <Wind className="w-4 h-4 text-cyan-400" />
              <span>Wind Speed Multiplier</span>
            </span>
            <span className="font-mono text-cyan-300 bg-cyan-500/20 border border-cyan-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
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
            className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Lull (0.2x)</span>
            <span>Gale Force (2.2x)</span>
          </div>
        </div>

        {/* 3. Temperature Offset */}
        <div className="glass-panel p-4.5 rounded-xl border border-orange-500/30 bg-slate-900/80 shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center space-x-1.5">
              <Thermometer className="w-4 h-4 text-orange-400" />
              <span>Ambient Temp Shift</span>
            </span>
            <span className="font-mono text-orange-300 bg-orange-500/20 border border-orange-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
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
            className="w-full accent-orange-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>Cold Front (-10°C)</span>
            <span>Heatwave (+15°C)</span>
          </div>
        </div>

        {/* 4. Base Tariff (₹/MWh) */}
        <div className="glass-panel p-4.5 rounded-xl border border-emerald-500/30 bg-slate-900/80 shadow-md space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-slate-200">
            <span className="flex items-center space-x-1.5">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
              <span>PPA Base Electricity Rate</span>
            </span>
            <span className="font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
              ₹{Math.round(params.tariffBaseUSDperMWh * 80).toLocaleString()}
            </span>
          </div>
          <input
            type="range"
            min="20"
            max="180"
            step="5"
            value={params.tariffBaseUSDperMWh}
            onChange={(e) => handleTariffChange(parseFloat(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>₹1,600/MWh</span>
            <span>₹14,400/MWh Peak</span>
          </div>
        </div>
      </div>

      {/* Real-time Scenario Explanation Bar */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shadow-inner">
        <div className="flex items-center space-x-2.5">
          <CloudLightning className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span className="text-slate-300 leading-relaxed font-sans">
            {mod.activePreset === 'NORMAL' && 'Normal synoptic atmospheric profile: steady trade winds and typical clearsky diurnal solar radiation.'}
            {mod.activePreset === 'CLOUD_FRONT' && 'Severe cloud incursion event: steep solar drop-off triggers Duck Curve evening ramp protection protocol.'}
            {mod.activePreset === 'WIND_LULL' && 'Atmospheric high-pressure blocking system: wind generation falls below 15% capacity, requiring spinning peaker alerts.'}
            {mod.activePreset === 'GALE_CUTOUT' && 'High-wind storm front: wind speeds exceeding 25.0 m/s trigger automated turbine aerodynamic feathering to protect gearboxes.'}
            {mod.activePreset === 'HEATWAVE' && 'Extreme thermal condition: PV module cells exceed 62°C, causing a ~14% thermal derating on solar conversion efficiency.'}
          </span>
        </div>

        <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-1 rounded-lg shrink-0 font-bold">
          Physics Engine: Active
        </span>
      </div>
    </div>
  );
};
