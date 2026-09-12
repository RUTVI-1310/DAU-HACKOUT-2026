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
    <header className="bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 sticky top-0 z-40 text-slate-100 shadow-xl transition-all">
      {/* Top Brand & Global Grid Status Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between py-3.5 gap-4">
          
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3.5">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/30 to-cyan-500/30 rounded-2xl blur-xs opacity-75 group-hover:opacity-100 transition duration-300"></div>
              <img 
                src="/gridsense-logo.png" 
                alt="GridSense AI Logo" 
                className="relative w-11 h-11 object-contain rounded-xl bg-slate-900/90 p-1.5 border border-slate-700/80 shadow-md shadow-emerald-950/40"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-1.5">
                  <span>GridSense</span>
                  <span className="text-emerald-400 font-black">AI</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-xs">
                  Utility Grid OS
                </span>
                <span className="flex items-center space-x-1.5 text-[11px] font-mono text-emerald-400 bg-slate-900/90 border border-emerald-500/30 px-2.5 py-0.5 rounded-full shadow-xs">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-bold">50.02 Hz</span>
                  <span className="text-slate-500">|</span>
                  <span className="text-emerald-400/90 text-[10px] uppercase tracking-wider font-semibold">Nominal</span>
                </span>
              </div>
              <p className="text-xs text-slate-400/90 mt-0.5 font-medium">
                Renewable AI Forecast &bull; Multi-Model Dispatch &amp; Curtailment Engine
              </p>
            </div>
          </div>

          {/* Controls: Model, Horizon, Site, Actions */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            
            {/* Live Playback Tick */}
            <button
              id="btn-play-sim"
              onClick={onTogglePlay}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-bold border transition-all duration-200 shadow-sm cursor-pointer ${
                isPlaying 
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30 shadow-amber-500/10'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/80 hover:shadow-emerald-500/20 hover:shadow-md'
              }`}
              title={isPlaying ? 'Pause auto-progressing time simulation' : 'Start live clock simulation'}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isPlaying ? `Live (H+${currentSimHour})` : 'Play Live Clock'}</span>
            </button>

            {/* Time Horizon Selector */}
            <div className="flex items-center bg-slate-900/90 rounded-lg p-1 border border-slate-800 shadow-inner">
              <span className="px-2 text-slate-400 font-medium flex items-center space-x-1">
                <Clock className="w-3 h-3 text-slate-400" />
                <span>Horizon:</span>
              </span>
              {([24, 48, 72] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => onParamsChange({ ...params, horizonHours: h })}
                  className={`px-2.5 py-1 rounded-md font-bold transition-all duration-150 cursor-pointer ${
                    params.horizonHours === h
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {h}h
                </button>
              ))}
            </div>

            {/* Forecasting Model Selector */}
            <div className="flex items-center bg-slate-900/90 rounded-lg p-1 border border-slate-800 shadow-inner">
              <span className="px-2 text-slate-400 font-medium flex items-center space-x-1">
                <Cpu className="w-3 h-3 text-cyan-400" />
                <span>Model:</span>
              </span>
              <select
                id="select-model"
                value={params.selectedModel}
                onChange={(e) => onParamsChange({ ...params, selectedModel: e.target.value as any })}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-2 py-1 text-xs"
              >
                <option value="ensemble" className="bg-slate-900 text-slate-100">Ensemble (Prophet + LSTM + XGBoost)</option>
                <option value="lstm" className="bg-slate-900 text-slate-100">LSTM Deep Neural Net</option>
                <option value="xgboost" className="bg-slate-900 text-slate-100">XGBoost Gradient Boosted Trees</option>
                <option value="prophet" className="bg-slate-900 text-slate-100">Prophet Diurnal Decomposition</option>
              </select>
            </div>

            {/* Site / Asset Portfolio Selector */}
            <div className="flex items-center bg-slate-900/90 rounded-lg p-1 border border-slate-800 shadow-inner">
              <span className="px-2 text-slate-400 font-medium flex items-center space-x-1">
                <Layers className="w-3 h-3 text-amber-400" />
                <span>Asset:</span>
              </span>
              <select
                id="select-plant"
                value={params.selectedPlantId}
                onChange={(e) => onParamsChange({ ...params, selectedPlantId: e.target.value })}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer pr-2 py-1 max-w-[170px] truncate text-xs"
              >
                <option value="ALL" className="bg-slate-900 text-slate-100">All Fleet ({TOTAL_FLEET_CAPACITY_MW} MW)</option>
                {FLEET_PLANTS.map(plant => (
                  <option key={plant.id} value={plant.id} className="bg-slate-900 text-slate-100">
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
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition shadow-xs cursor-pointer"
                title="Download ISO Dispatch Order Schedule (CSV / JSON)"
              >
                <Download className="w-3.5 h-3.5 text-slate-300" />
                <span>Export Dispatch</span>
              </button>

              <button
                id="btn-open-audit"
                onClick={onOpenAuditLog}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 transition shadow-xs cursor-pointer"
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
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition cursor-pointer ${
                params.weatherModifier.activePreset === 'NORMAL'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-xs'
                  : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
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
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition flex items-center space-x-1 cursor-pointer ${
                params.weatherModifier.activePreset === 'CLOUD_FRONT'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                  : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
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
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition flex items-center space-x-1 cursor-pointer ${
                params.weatherModifier.activePreset === 'WIND_LULL'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-xs'
                  : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
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
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition flex items-center space-x-1 cursor-pointer ${
                params.weatherModifier.activePreset === 'GALE_CUTOUT'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-xs'
                  : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
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
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border transition flex items-center space-x-1 cursor-pointer ${
                params.weatherModifier.activePreset === 'HEATWAVE'
                  ? 'bg-orange-500/20 text-orange-300 border-orange-500/50 shadow-xs'
                  : 'bg-slate-900/70 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>Heatwave PV Derate (+8.5°C)</span>
            </button>

            <button
              onClick={onResetScenarios}
              className="px-2 py-1 rounded text-slate-400 hover:text-white transition cursor-pointer hover:bg-slate-800"
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
