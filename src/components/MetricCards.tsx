import React from 'react';
import { 
  Zap, 
  TrendingUp, 
  TrendingDown, 
  BatteryCharging, 
  AlertOctagon, 
  IndianRupee, 
  Leaf, 
  SunMedium, 
  Wind 
} from 'lucide-react';
import { GenerationForecastPoint } from '../types';

interface MetricCardsProps {
  forecastData: GenerationForecastPoint[];
  selectedModel: 'ensemble' | 'prophet' | 'lstm' | 'xgboost';
}

export const MetricCards: React.FC<MetricCardsProps> = ({ forecastData, selectedModel }) => {
  if (!forecastData || forecastData.length === 0) return null;

  // Total energy yield (MWh) across horizon
  const totalMWh = Math.round(
    forecastData.reduce((sum, pt) => sum + pt.totalForecast[selectedModel], 0)
  );

  const solarMWh = Math.round(
    forecastData.reduce((sum, pt) => sum + pt.solarForecast[selectedModel], 0)
  );

  const windMWh = Math.round(
    forecastData.reduce((sum, pt) => sum + pt.windForecast[selectedModel], 0)
  );

  // Peak output
  const peakOutputMW = Math.max(
    ...forecastData.map(pt => pt.totalForecast[selectedModel])
  );

  // Max ramp rates
  const maxRampUp = Math.max(...forecastData.map(pt => pt.rampRateMWperHr));
  const maxRampDown = Math.min(...forecastData.map(pt => pt.rampRateMWperHr));

  // Imbalance counts
  const overGenHours = forecastData.filter(pt => pt.imbalanceSeverity === 'OVER_GENERATION').length;
  const underGenHours = forecastData.filter(pt => pt.imbalanceSeverity === 'UNDER_GENERATION').length;
  const rampAlertHours = forecastData.filter(
    pt => pt.imbalanceSeverity === 'STEEP_RAMP_DOWN' || pt.imbalanceSeverity === 'STEEP_RAMP_UP'
  ).length;

  // Financial opportunity & Avoided Curtailment (INR)
  const totalArbitrageValueINR = Math.round(
    forecastData.reduce((sum, pt) => sum + (pt.bessArbitragePotentialUSD * 80 * (pt.generationDeltaMW > 0 ? 35 : 0)), 0)
  );

  // Avoided CO2 tons (approx 0.45 tons CO2 per MWh displaced from natural gas combined cycle)
  const co2TonsDisplaced = Math.round(totalMWh * 0.45);

  const solarPct = totalMWh > 0 ? Math.round((solarMWh / totalMWh) * 100) : 0;
  const windPct = 100 - solarPct;
  const utilizationPct = Math.min(100, Math.round((peakOutputMW / 1230) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
      {/* 1. Total Generation Yield */}
      <div className="glass-panel glass-panel-hover p-5 sm:p-6 rounded-2xl border border-slate-800/90 shadow-xl flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500 via-emerald-400/40 to-transparent"></div>
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Forecast Yield Horizon</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-emerald-500/20 transition-all">
              <Zap className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {totalMWh.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-emerald-400 font-mono uppercase">MWh</span>
          </div>

          {/* Solar vs Wind Split Visualizer */}
          <div className="mt-3 space-y-1">
            <div className="w-full bg-slate-800/90 h-1.5 rounded-full overflow-hidden flex">
              <div className="bg-amber-400 h-full transition-all duration-500" style={{ width: `${solarPct}%` }} title={`Solar: ${solarPct}%`}></div>
              <div className="bg-cyan-400 h-full transition-all duration-500" style={{ width: `${windPct}%` }} title={`Wind: ${windPct}%`}></div>
            </div>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center space-x-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Solar: <strong className="text-slate-200 font-mono">{solarMWh.toLocaleString()}</strong></span>
          </span>
          <span className="flex items-center space-x-1.5 font-medium">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Wind: <strong className="text-slate-200 font-mono">{windMWh.toLocaleString()}</strong></span>
          </span>
        </div>
      </div>

      {/* 2. Peak Generation & Capacity Factor */}
      <div className="glass-panel glass-panel-hover p-5 sm:p-6 rounded-2xl border border-slate-800/90 shadow-xl flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-cyan-400/40 to-transparent"></div>
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Peak Generation</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-cyan-500/20 transition-all">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              {peakOutputMW.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-cyan-400 font-mono uppercase">MW</span>
          </div>

          {/* Utilization bar */}
          <div className="mt-3 space-y-1">
            <div className="w-full bg-slate-800/90 h-1.5 rounded-full overflow-hidden">
              <div className="bg-cyan-500 h-full rounded-full transition-all duration-500" style={{ width: `${utilizationPct}%` }}></div>
            </div>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Fleet Peak Utilization</span>
          <span className="font-bold text-cyan-300 bg-cyan-500/15 border border-cyan-500/30 px-2 py-0.5 rounded font-mono text-[11px]">
            {utilizationPct}% Max Cap
          </span>
        </div>
      </div>

      {/* 3. Ramp Gradient & Imbalance Exposure */}
      <div className="glass-panel glass-panel-hover p-5 sm:p-6 rounded-2xl border border-slate-800/90 shadow-xl flex flex-col justify-between relative overflow-hidden group">
        <div className={`absolute top-0 left-0 right-0 h-[2px] ${
          maxRampDown < -140 
            ? 'bg-gradient-to-r from-rose-500 via-rose-400/40 to-transparent' 
            : 'bg-gradient-to-r from-slate-500 via-slate-400/30 to-transparent'
        }`}></div>
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Max Ramping Delta</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
              maxRampDown < -140 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}>
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-3xl font-black font-mono tracking-tight ${
              maxRampDown < -140 ? 'text-rose-400' : 'text-white'
            }`}>
              {maxRampDown}
            </span>
            <span className="text-xs font-semibold text-slate-400 font-mono">MW/hr</span>
          </div>

          <div className="mt-3 text-[11px] text-slate-400 flex items-center space-x-1.5">
            <span className="font-medium">Duck-Curve Ramp Hazard:</span>
            <span className={`font-bold uppercase text-[10px] px-1.5 py-0.5 rounded ${
              maxRampDown < -140 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
            }`}>
              {maxRampDown < -140 ? 'High Gradient' : 'Nominal'}
            </span>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400 font-medium">Imbalance Flags:</span>
          <span className="font-semibold text-slate-300 space-x-1 font-mono text-[11px]">
            <span className="text-amber-400 font-bold">{overGenHours}h Over</span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-rose-400 font-bold">{underGenHours}h Under</span>
          </span>
        </div>
      </div>

      {/* 4. BESS Arbitrage & Carbon Avoided */}
      <div className="glass-panel glass-panel-hover p-5 sm:p-6 rounded-2xl border border-slate-800/90 shadow-xl flex flex-col justify-between relative overflow-hidden group">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500 via-amber-400/40 to-transparent"></div>
        <div>
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Arbitrage &amp; Green Value</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-105 group-hover:bg-amber-500/20 transition-all">
              <BatteryCharging className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              ₹{totalArbitrageValueINR.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-amber-400 uppercase">Yield</span>
          </div>

          <div className="mt-3 text-[11px] text-slate-400 flex items-center space-x-1.5">
            <span className="text-emerald-400 font-semibold flex items-center space-x-1">
              <Leaf className="w-3.5 h-3.5 text-emerald-400" />
              <span>{co2TonsDisplaced.toLocaleString()} t CO₂ displaced</span>
            </span>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span className="text-slate-400 font-medium">BESS Dispatch Ready</span>
          <span className="text-[11px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded font-mono font-bold">
            98.5% Available
          </span>
        </div>
      </div>
    </div>
  );
};
