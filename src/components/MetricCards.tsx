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

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
      {/* 1. Total Generation Yield */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-emerald-300 transition group">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Forecast Energy Yield</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition">
              <Zap className="w-4 h-4 fill-current" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {totalMWh.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">MWh</span>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center space-x-1">
            <SunMedium className="w-3.5 h-3.5 text-amber-500" />
            <span>Solar: <strong>{solarMWh.toLocaleString()}</strong></span>
          </span>
          <span className="flex items-center space-x-1">
            <Wind className="w-3.5 h-3.5 text-cyan-500" />
            <span>Wind: <strong>{windMWh.toLocaleString()}</strong></span>
          </span>
        </div>
      </div>

      {/* 2. Peak Generation & Capacity Factor */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-cyan-300 transition group">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Peak Generation</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center group-hover:scale-105 transition">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              {peakOutputMW.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">MW</span>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Fleet Peak Utilization</span>
          <span className="font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
            {Math.round((peakOutputMW / 1230) * 100)}% Max Capacity
          </span>
        </div>
      </div>

      {/* 3. Ramp Gradient & Imbalance Exposure */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-rose-300 transition group">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Max Ramping Delta</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${
              maxRampDown < -140 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'
            }`}>
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-2xl font-black tracking-tight ${
              maxRampDown < -140 ? 'text-rose-600' : 'text-slate-900'
            }`}>
              {maxRampDown}
            </span>
            <span className="text-xs font-semibold text-slate-500">MW / hour</span>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500">Imbalance Windows:</span>
          <span className="font-semibold text-slate-700 space-x-1">
            <span className="text-amber-600 font-bold">{overGenHours}h Over</span>
            <span>&bull;</span>
            <span className="text-rose-600 font-bold">{underGenHours}h Under</span>
          </span>
        </div>
      </div>

      {/* 4. BESS Arbitrage & Carbon Avoided */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between hover:border-amber-300 transition group">
        <div>
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-bold uppercase tracking-wider">Arbitrage &amp; Green Value</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition">
              <BatteryCharging className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{totalArbitrageValueINR.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">Shift Value</span>
          </div>
        </div>

        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <span className="flex items-center space-x-1 text-emerald-700 font-semibold">
            <Leaf className="w-3.5 h-3.5 text-emerald-600" />
            <span>{co2TonsDisplaced.toLocaleString()} t CO₂ displaced</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">BESS Fleet</span>
        </div>
      </div>
    </div>
  );
};
