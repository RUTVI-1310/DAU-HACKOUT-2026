import React from 'react';
import { 
  Zap, 
  Sun, 
  Wind, 
  Clock, 
  Cpu, 
  Layers, 
  AlertTriangle, 
  Play, 
  Pause, 
  Download, 
  RefreshCw,
  Activity,
  Sliders
} from 'lucide-react';
import { SimulationParameters } from '../types';
import { FLEET_PLANTS, TOTAL_FLEET_CAPACITY_MW } from '../data/plants';

interface NavbarProps {
  params: SimulationParameters;
  onParamsChange: (newParams: SimulationParameters) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentSimHour: number;
  onExportSchedule: () => void;
  onOpenAuditLog: () => void;
  onResetScenarios: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  params,
  onParamsChange,
  isPlaying,
  onTogglePlay,
  currentSimHour,
  onExportSchedule,
  onOpenAuditLog,
  onResetScenarios,
}) => {
  const activePlant = params.selectedPlantId === 'ALL'
    ? null
    : FLEET_PLANTS.find(p => p.id === params.selectedPlantId);

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 text-slate-100 shadow-md">
      {/* Top Brand & Global Grid Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between py-3 gap-3">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3.5">
            <img 
              src="/gridsense-logo.png" 
              alt="GridSense AI Logo" 
              className="w-11 h-11 object-contain rounded-xl bg-white p-1 border border-slate-700 shadow-md shadow-emerald-500/20"
              referrerPolicy="no-referrer"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight text-white">GridSense AI</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Renewable AI Forecast OS
                </span>
                <span className="flex items-center space-x-1 text-[11px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2 py-0.5 rounded">
                  <Activity className="w-3 h-3 animate-pulse text-emerald-400" />
                  <span>50.02 Hz</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Smarter Forecasts. Stronger Grids. &bull; 24–72h Curtailment, BESS &amp; Grid Dispatch Engine
              </p>
            </div>
          </div>

          {/* Controls: Model, Horizon, Site, Actions */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            
            {/* Live Playback Tick */}
            <button
              id="btn-play-sim"
              onClick={onTogglePlay}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold border transition shadow-sm ${
                isPlaying 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-500'
              }`}
              title={isPlaying ? 'Pause auto-progressing time simulation' : 'Start live clock simulation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? `Live (H+${currentSimHour})` : 'Play Live'}</span>
            </button>

            {/* Time Horizon Selector */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700">
              <span className="px-2 text-slate-400 font-medium flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Horizon:</span>
              </span>
              {([24, 48, 72] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => onParamsChange({ ...params, horizonHours: h })}
                  className={`px-2.5 py-1 rounded-md font-bold transition ${
                    params.horizonHours === h
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>

            {/* Forecasting Model Selector */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700">
              <span className="px-2 text-slate-400 font-medium flex items-center space-x-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>Model:</span>
              </span>
              <select
                id="select-model"
                value={params.selectedModel}
                onChange={(e) => onParamsChange({ ...params, selectedModel: e.target.value as any })}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer pr-2 py-1"
              >
                <option value="ensemble" className="bg-slate-800">Ensemble (Prophet + LSTM + XGBoost)</option>
                <option value="lstm" className="bg-slate-800">LSTM Deep Neural Net</option>
                <option value="xgboost" className="bg-slate-800">XGBoost Gradient Boosted Trees</option>
                <option value="prophet" className="bg-slate-800">Prophet Diurnal Decomposition</option>
              </select>
            </div>

            {/* Site / Asset Portfolio Selector */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-1 border border-slate-700">
              <span className="px-2 text-slate-400 font-medium flex items-center space-x-1">
                <Layers className="w-3 h-3 text-amber-400" />
                <span>Asset:</span>
              </span>
              <select
                id="select-plant"
                value={params.selectedPlantId}
                onChange={(e) => onParamsChange({ ...params, selectedPlantId: e.target.value })}
                className="bg-transparent text-slate-200 font-bold focus:outline-none cursor-pointer pr-2 py-1 max-w-[170px] truncate"
              >
                <option value="ALL" className="bg-slate-800">All Fleet ({TOTAL_FLEET_CAPACITY_MW} MW)</option>
                {FLEET_PLANTS.map(plant => (
                  <option key={plant.id} value={plant.id} className="bg-slate-800">
                    {plant.name} ({plant.capacityMW} MW)
                  </option>
                ))}
              </select>
            </div>

            {/* Export Schedule & Audit Log */}
            <div className="flex items-center gap-2">
              <button
                id="btn-export-schedule"
                onClick={onExportSchedule}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="Download ISO Dispatch Order Schedule (CSV / JSON)"
              >
                <Download className="w-3.5 h-3.5 text-slate-300" />
                <span>Export Dispatch</span>
              </button>

              <button
                id="btn-open-audit"
                onClick={onOpenAuditLog}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
                title="View Dispatched Actions Audit Trail"
              >
                <span>Audit Log</span>
              </button>
            </div>
          </div>
        </div>

        {/* Quick Scenario Injection Control Ribbon */}
        <div className="flex flex-wrap items-center justify-between py-2 border-t border-slate-800/80 text-xs gap-2">
          <div className="flex items-center space-x-2 text-slate-400">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-300">Live "What-If" Weather Injection:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => onParamsChange({
                ...params,
                weatherModifier: {
                  cloudCoverSpikePct: 0,
                  windSpeedMultiplier: 1.0,
                  tempOffsetC: 0,
                  activePreset: 'NORMAL'
                }
              })}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition ${
                params.weatherModifier.activePreset === 'NORMAL'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              Normal Synoptic
            </button>

            <button
              onClick={() => onParamsChange({
                ...params,
                weatherModifier: {
                  cloudCoverSpikePct: 70,
                  windSpeedMultiplier: 1.0,
                  tempOffsetC: -3,
                  activePreset: 'CLOUD_FRONT'
                }
              })}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition flex items-center space-x-1 ${
                params.weatherModifier.activePreset === 'CLOUD_FRONT'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3 h-3 text-amber-400" />
              <span>Midday Storm Front (+70% Cloud)</span>
            </button>

            <button
              onClick={() => onParamsChange({
                ...params,
                weatherModifier: {
                  cloudCoverSpikePct: 0,
                  windSpeedMultiplier: 0.3,
                  tempOffsetC: 0,
                  activePreset: 'WIND_LULL'
                }
              })}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition flex items-center space-x-1 ${
                params.weatherModifier.activePreset === 'WIND_LULL'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <Wind className="w-3 h-3 text-cyan-400" />
              <span>Atmospheric Wind Lull (&lt;2.5 m/s)</span>
            </button>

            <button
              onClick={() => onParamsChange({
                ...params,
                weatherModifier: {
                  cloudCoverSpikePct: 0,
                  windSpeedMultiplier: 2.2,
                  tempOffsetC: -2,
                  activePreset: 'GALE_CUTOUT'
                }
              })}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition flex items-center space-x-1 ${
                params.weatherModifier.activePreset === 'GALE_CUTOUT'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-rose-400" />
              <span>Gale Storm Cut-Out (&gt;25 m/s)</span>
            </button>

            <button
              onClick={() => onParamsChange({
                ...params,
                weatherModifier: {
                  cloudCoverSpikePct: -10,
                  windSpeedMultiplier: 0.8,
                  tempOffsetC: 8.5,
                  activePreset: 'HEATWAVE'
                }
              })}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition flex items-center space-x-1 ${
                params.weatherModifier.activePreset === 'HEATWAVE'
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                  : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              <span>Heatwave PV Derate (+8.5°C)</span>
            </button>

            <button
              onClick={onResetScenarios}
              className="px-2 py-1 rounded text-slate-400 hover:text-white transition"
              title="Reset weather parameters to baseline"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
