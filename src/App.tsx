import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Zap, 
  Sun, 
  Wind, 
  Activity, 
  BarChart3, 
  CloudSun, 
  Sliders, 
  IndianRupee, 
  Layers, 
  BookOpen, 
  Download, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  TrendingUp,
  Cpu
} from 'lucide-react';
import { 
  ExecutionLog, 
  GenerationForecastPoint, 
  GridActionRecommendation, 
  SimulationParameters 
} from './types';
import { runForecastingEngine } from './services/forecastingEngine';
import { FLEET_PLANTS, TOTAL_FLEET_CAPACITY_MW } from './data/plants';

import { Navbar } from './components/Navbar';
import { MetricCards } from './components/MetricCards';
import { ForecastChart } from './components/ForecastChart';
import { WeatherSatTelemetry } from './components/WeatherSatTelemetry';
import { GridActionCenter } from './components/GridActionCenter';
import { WhatIfScenarioLab } from './components/WhatIfScenarioLab';
import { FinancialTradingStudio } from './components/FinancialTradingStudio';
import { PlantPortfolioView } from './components/PlantPortfolioView';
import { ExportScheduleModal } from './components/ExportScheduleModal';
import { DispatchLogModal } from './components/DispatchLogModal';

export default function App() {
  // Global Simulation State
  const [params, setParams] = useState<SimulationParameters>({
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
  });

  // Active View Tab
  const [activeTab, setActiveTab] = useState<
    'forecast' | 'weather' | 'whatif' | 'trading' | 'portfolio' | 'methodology'
  >('forecast');

  // Selected hour point for inspection (defaults to hour 12 - midday peak)
  const [selectedHourOffset, setSelectedHourOffset] = useState<number>(12);

  // Live playback timer simulation
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSimHour, setCurrentSimHour] = useState<number>(12);

  // Dispatched action IDs & audit logs
  const [dispatchedActionIds, setDispatchedActionIds] = useState<string[]>([]);
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([
    {
      id: 'DISP-8921',
      actionId: 'INIT-BESS-CHG',
      title: 'Dispatch BESS Fleet: Fast Bulk Charging (160 MW)',
      type: 'BESS_CHARGE',
      magnitudeMW: 160,
      targetAsset: 'Desert Sun & Valley BESS Hubs',
      dispatchedAt: 'Today 11:30 AM',
      operator: 'OP-421 (Grid Shift Lead)',
      status: 'COMPLETED',
      notes: 'Executed automated setpoint to absorb midday solar surge.',
    },
  ]);

  // Modals state
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);

  // Re-run physics and ML forecasting engine on parameters change
  const forecastData: GenerationForecastPoint[] = useMemo(() => {
    return runForecastingEngine(params);
  }, [params]);

  // Handle live simulation tick
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentSimHour((prev) => {
        const next = (prev + 1) % params.horizonHours;
        setSelectedHourOffset(next);
        return next;
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isPlaying, params.horizonHours]);

  // Action authorization handler
  const handleExecuteAction = useCallback((action: GridActionRecommendation) => {
    if (dispatchedActionIds.includes(action.id)) return;

    setDispatchedActionIds((prev) => [...prev, action.id]);

    const newLog: ExecutionLog = {
      id: `DISP-${Math.floor(1000 + Math.random() * 9000)}`,
      actionId: action.id,
      title: action.title,
      type: action.type,
      magnitudeMW: action.magnitudeMW,
      targetAsset: action.targetAssetName,
      dispatchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      operator: 'OP-CHIEF (Console)',
      status: 'ACTIVE',
      notes: action.rationale,
    };

    setExecutionLogs((prev) => [newLog, ...prev]);
  }, [dispatchedActionIds]);

  // Reset scenarios
  const handleResetScenarios = useCallback(() => {
    setParams((prev) => ({
      ...prev,
      weatherModifier: {
        cloudCoverSpikePct: 0,
        windSpeedMultiplier: 1.0,
        tempOffsetC: 0,
        activePreset: 'NORMAL',
      },
    }));
  }, []);

  return (
    <div className="min-h-screen bg-grid-ambient text-slate-100 font-sans flex flex-col antialiased selection:bg-emerald-500/30 selection:text-emerald-300 relative">
      {/* 1. Global Navigation & Simulation Control Bar */}
      <Navbar
        params={params}
        onParamsChange={setParams}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        currentSimHour={currentSimHour}
        onExportSchedule={() => setIsExportOpen(true)}
        onOpenAuditLog={() => setIsAuditOpen(true)}
        onResetScenarios={handleResetScenarios}
      />

      {/* 2. Workspace Tabs Navigation (Glass Command Ribbon) */}
      <div className="bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 sticky top-[103px] xl:top-[69px] z-30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-2 sm:gap-3 lg:gap-3.5 overflow-x-auto text-xs sm:text-sm font-semibold py-2.5 sm:py-3 scrollbar-none">
            <button
              id="tab-btn-forecast"
              onClick={() => setActiveTab('forecast')}
              className={`py-2 px-3.5 sm:px-4 rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === 'forecast'
                  ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <BarChart3 className={`w-4 h-4 ${activeTab === 'forecast' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Forecast Studio &amp; AI Grid Actions</span>
            </button>

            <button
              id="tab-btn-weather"
              onClick={() => setActiveTab('weather')}
              className={`py-2 px-3.5 sm:px-4 rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === 'weather'
                  ? 'bg-amber-500/15 text-amber-300 font-bold border border-amber-500/40 shadow-sm shadow-amber-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <CloudSun className={`w-4 h-4 ${activeTab === 'weather' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>Satellite &amp; Weather Telemetry</span>
            </button>

            <button
              id="tab-btn-whatif"
              onClick={() => setActiveTab('whatif')}
              className={`py-2 px-3.5 sm:px-4 rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === 'whatif'
                  ? 'bg-cyan-500/15 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Sliders className={`w-4 h-4 ${activeTab === 'whatif' ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>"What-If" Contingency Studio</span>
            </button>

            <button
              id="tab-btn-trading"
              onClick={() => setActiveTab('trading')}
              className={`py-2 px-3.5 sm:px-4 rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === 'trading'
                  ? 'bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <IndianRupee className={`w-4 h-4 ${activeTab === 'trading' ? 'text-emerald-400' : 'text-slate-400'}`} />
              <span>Energy Trading &amp; BESS Arbitrage</span>
            </button>

            <button
              id="tab-btn-portfolio"
              onClick={() => setActiveTab('portfolio')}
              className={`py-2 px-3.5 sm:px-4 rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === 'portfolio'
                  ? 'bg-purple-500/15 text-purple-300 font-bold border border-purple-500/40 shadow-sm shadow-purple-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <Layers className={`w-4 h-4 ${activeTab === 'portfolio' ? 'text-purple-400' : 'text-slate-400'}`} />
              <span>Plant Portfolio ({FLEET_PLANTS.length} Sites)</span>
            </button>

            <button
              id="tab-btn-methodology"
              onClick={() => setActiveTab('methodology')}
              className={`py-2 px-3.5 sm:px-4 rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all duration-200 cursor-pointer ${
                activeTab === 'methodology'
                  ? 'bg-blue-500/15 text-blue-300 font-bold border border-blue-500/40 shadow-sm shadow-blue-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              <BookOpen className={`w-4 h-4 ${activeTab === 'methodology' ? 'text-blue-400' : 'text-slate-400'}`} />
              <span>Methodology &amp; Architecture</span>
            </button>
          </nav>
        </div>
      </div>

      {/* 3. Main Body Content with generous inter-feature gaps */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 sm:space-y-10">
        
        {/* Metric Cards Banner (Always visible across all operational views) */}
        <MetricCards
          forecastData={forecastData}
          selectedModel={params.selectedModel}
        />

        {/* TAB 1: Main Forecast Studio & Grid Actions */}
        {activeTab === 'forecast' && (
          <div className="space-y-8 sm:space-y-10">
            <ForecastChart
              forecastData={forecastData}
              params={params}
              selectedHourOffset={selectedHourOffset}
              onSelectHour={setSelectedHourOffset}
            />

            <GridActionCenter
              forecastData={forecastData}
              onExecuteAction={handleExecuteAction}
              dispatchedActionIds={dispatchedActionIds}
            />
          </div>
        )}

        {/* TAB 2: Satellite & Weather Telemetry Studio */}
        {activeTab === 'weather' && (
          <div className="space-y-8 sm:space-y-10">
            <WeatherSatTelemetry
              weatherTimeline={forecastData.map((pt) => pt.weather)}
              selectedHourOffset={selectedHourOffset}
            />

            {/* Meteorological Physics Explainer Card */}
            <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition">
                <strong className="block text-slate-100 font-bold mb-1 flex items-center space-x-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Global Horizontal Irradiance (GHI)</span>
                </strong>
                <p className="text-slate-400 leading-relaxed">
                  Sum of direct beam (DNI × cos θ_z) and diffuse sky radiation (DHI). Governs photovoltaic module electron-hole pair generation.
                </p>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition">
                <strong className="block text-slate-100 font-bold mb-1 flex items-center space-x-1.5">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Hub-Height Wind Shear (100m)</span>
                </strong>
                <p className="text-slate-400 leading-relaxed">
                  Standard power law wind shear profiles v(z) = v_0 · (z/z_0)^α extrapolate ground anemometers up to modern 100m–150m wind turbine rotor centers.
                </p>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-1.5 hover:border-slate-700 transition">
                <strong className="block text-slate-100 font-bold mb-1 flex items-center space-x-1.5">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Air Density Correction (ρ)</span>
                </strong>
                <p className="text-slate-400 leading-relaxed">
                  Kinetic wind power scales directly with air mass density ρ = P / (R · T). Cold winter air delivers up to 12% higher turbine power than hot summer air.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: "What-If" Contingency Studio */}
        {activeTab === 'whatif' && (
          <div className="space-y-8 sm:space-y-10">
            <WhatIfScenarioLab
              params={params}
              onParamsChange={setParams}
              onReset={handleResetScenarios}
            />

            {/* Forecast Chart below for instant feedback */}
            <ForecastChart
              forecastData={forecastData}
              params={params}
              selectedHourOffset={selectedHourOffset}
              onSelectHour={setSelectedHourOffset}
            />
          </div>
        )}

        {/* TAB 4: Energy Trading & BESS Arbitrage Studio */}
        {activeTab === 'trading' && (
          <FinancialTradingStudio
            forecastData={forecastData}
            tariffBaseUSDperMWh={params.tariffBaseUSDperMWh}
          />
        )}

        {/* TAB 5: Plant Portfolio & Hardware Specs */}
        {activeTab === 'portfolio' && (
          <PlantPortfolioView
            selectedPlantId={params.selectedPlantId}
            onSelectPlant={(id) => setParams({ ...params, selectedPlantId: id })}
          />
        )}

        {/* TAB 6: Methodology & Architecture Reference */}
        {activeTab === 'methodology' && (
          <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/80 shadow-xl space-y-6 text-xs text-slate-300 leading-relaxed">
            <div>
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Forecasting Science, Machine Learning Pipeline &amp; Industry Standards
              </h3>
              <p className="text-slate-400 mt-0.5 font-medium">
                Technical foundation of the multi-model time-series ensemble and automated grid action decision matrix.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30 flex items-center justify-center font-bold text-xs">
                    FB
                  </div>
                  <strong className="text-white text-sm">Prophet Harmonic Decomposition</strong>
                </div>
                <p className="text-slate-400">
                  Decomposes time-series into trend $g(t)$, periodic diurnal/seasonal harmonics $s(t)$, and holiday effects $h(t)$:
                </p>
                <div className="bg-slate-950 border border-slate-800 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] text-center shadow-inner">
                  y(t) = g(t) + s(t) + h(t) + ε_t
                </div>
                <p className="text-slate-400">
                  Particularly resilient against missing SCADA timestamps and captures smooth daily diurnal solar peaks and weekly industrial demand shifts.
                </p>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center font-bold text-xs">
                    NN
                  </div>
                  <strong className="text-white text-sm">LSTM Recurrent Deep Neural Network</strong>
                </div>
                <p className="text-slate-400">
                  Utilizes cell memory states and gating mechanisms (Input, Forget, Output gates) to capture sequential atmospheric front momentum:
                </p>
                <div className="bg-slate-950 border border-slate-800 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] text-center shadow-inner">
                  f_t = σ(W_f · [h_(t-1), x_t] + b_f)
                </div>
                <p className="text-slate-400">
                  Excels at predicting rapid Duck-Curve ramping events, sudden thunderstorm cloud arrivals, and gust front turbulence persistence.
                </p>
              </div>

              <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800/80 space-y-2.5">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-xs">
                    GB
                  </div>
                  <strong className="text-white text-sm">XGBoost Gradient Boosted Trees</strong>
                </div>
                <p className="text-slate-400">
                  Greedy tree-building algorithm minimizing regularized loss over non-linear meteorological feature interactions:
                </p>
                <div className="bg-slate-950 border border-slate-800 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px] text-center shadow-inner">
                  Obj = Σ l(y_i, ŷ_i) + Σ Ω(f_k)
                </div>
                <p className="text-slate-400">
                  Handles non-linear aerodynamic power curve cutoffs (v_cut-in, v_rated, v_cut-out) and solar inverter clipping limits cleanly.
                </p>
              </div>
            </div>

            {/* Industrial Protocols Table */}
            <div className="border-t border-slate-800/80 pt-4">
              <h4 className="font-bold text-white text-sm mb-2.5 flex items-center space-x-2">
                <span>Standard Telemetry Protocol &amp; Regulatory Compliance</span>
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-800/80">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-900/90 text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Standard</th>
                      <th className="py-2.5 px-3">Scope &amp; Logical Node</th>
                      <th className="py-2.5 px-3">Measurement Channel</th>
                      <th className="py-2.5 px-3">Operational Grid Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium bg-slate-950/40">
                    <tr className="hover:bg-slate-900/50 transition">
                      <td className="py-2.5 px-3 font-bold text-emerald-400">IEC 61400-25</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">WT_ActivePower (P_Act)</td>
                      <td className="py-2.5 px-3 text-slate-200">Wind Turbine Output (MW)</td>
                      <td className="py-2.5 px-3 text-slate-400">Scheduled generation matching and ramp-rate surveillance</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50 transition">
                      <td className="py-2.5 px-3 font-bold text-amber-400">IEC 61724-1</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">POA_Irradiance / T_Mod</td>
                      <td className="py-2.5 px-3 text-slate-200">Plane-of-Array &amp; Cell Temp</td>
                      <td className="py-2.5 px-3 text-slate-400">Photovoltaic performance ratio ($PR$) and thermal derating validation</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50 transition">
                      <td className="py-2.5 px-3 font-bold text-cyan-400">IEEE 1547-2018</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">Volt-VAr / Freq-Watt</td>
                      <td className="py-2.5 px-3 text-slate-200">Inverter Autonomous Response</td>
                      <td className="py-2.5 px-3 text-slate-400">Active curtailment and fast frequency response ($FFR$) regulation</td>
                    </tr>
                    <tr className="hover:bg-slate-900/50 transition">
                      <td className="py-2.5 px-3 font-bold text-purple-400">FERC Order 888</td>
                      <td className="py-2.5 px-3 font-mono text-slate-300">Day-Ahead Scheduling</td>
                      <td className="py-2.5 px-3 text-slate-200">Imbalance Energy Settlement</td>
                      <td className="py-2.5 px-3 text-slate-400">Penalizes deviation exceeding ±10% bandwidth from day-ahead schedule</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="bg-slate-950/90 text-slate-400 text-xs py-7 border-t border-slate-800/80 mt-auto backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center space-x-3.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-1 flex items-center justify-center shadow-xs">
              <img 
                src="/gridsense-logo.png" 
                alt="GridSense AI" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <p className="font-bold text-slate-200 text-sm">
                GridSense AI &bull; Renewable Generation Forecasting Intelligence Platform
              </p>
              <p className="text-slate-500 text-xs">
                IEC 61400-25 &amp; IEEE 1547 Compliant Utility Forecasting &amp; Dispatch Operating System
              </p>
            </div>
          </div>

          <div className="text-right text-slate-500 text-xs">
            <p>100% Client-Side React SPA &bull; Multi-Model Time-Series Engine</p>
            <p>Designed for Grid Operators, Utilities, Plant Owners &amp; Energy Traders</p>
          </div>
        </div>
      </footer>

      {/* 5. Modals */}
      <ExportScheduleModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        forecastData={forecastData}
        selectedModel={params.selectedModel}
      />

      <DispatchLogModal
        isOpen={isAuditOpen}
        onClose={() => setIsAuditOpen(false)}
        logs={executionLogs}
        onClearLogs={() => setExecutionLogs([])}
      />
    </div>
  );
}
