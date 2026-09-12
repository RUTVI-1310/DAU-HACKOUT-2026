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
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans flex flex-col antialiased">
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

      {/* 2. Workspace Tabs Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-[97px] lg:top-[65px] z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-2 sm:gap-3.5 lg:gap-4 overflow-x-auto text-xs sm:text-sm font-semibold py-2.5 sm:py-3 scrollbar-none">
            <button
              id="tab-btn-forecast"
              onClick={() => setActiveTab('forecast')}
              className={`py-2.5 px-3.5 sm:px-4 rounded-xl flex items-center space-x-2 whitespace-nowrap transition ${
                activeTab === 'forecast'
                  ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>Forecast Studio &amp; AI Grid Actions</span>
            </button>

            <button
              id="tab-btn-weather"
              onClick={() => setActiveTab('weather')}
              className={`py-2.5 px-3.5 sm:px-4 rounded-xl flex items-center space-x-2 whitespace-nowrap transition ${
                activeTab === 'weather'
                  ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <CloudSun className="w-4 h-4 text-amber-500" />
              <span>Satellite &amp; Weather Telemetry</span>
            </button>

            <button
              id="tab-btn-whatif"
              onClick={() => setActiveTab('whatif')}
              className={`py-2.5 px-3.5 sm:px-4 rounded-xl flex items-center space-x-2 whitespace-nowrap transition ${
                activeTab === 'whatif'
                  ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Sliders className="w-4 h-4 text-cyan-600" />
              <span>"What-If" Contingency Studio</span>
            </button>

            <button
              id="tab-btn-trading"
              onClick={() => setActiveTab('trading')}
              className={`py-2.5 px-3.5 sm:px-4 rounded-xl flex items-center space-x-2 whitespace-nowrap transition ${
                activeTab === 'trading'
                  ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <IndianRupee className="w-4 h-4 text-emerald-600" />
              <span>Energy Trading &amp; BESS Arbitrage</span>
            </button>

            <button
              id="tab-btn-portfolio"
              onClick={() => setActiveTab('portfolio')}
              className={`py-2.5 px-3.5 sm:px-4 rounded-xl flex items-center space-x-2 whitespace-nowrap transition ${
                activeTab === 'portfolio'
                  ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Layers className="w-4 h-4 text-purple-600" />
              <span>Plant Portfolio ({FLEET_PLANTS.length} Sites)</span>
            </button>

            <button
              id="tab-btn-methodology"
              onClick={() => setActiveTab('methodology')}
              className={`py-2.5 px-3.5 sm:px-4 rounded-xl flex items-center space-x-2 whitespace-nowrap transition ${
                activeTab === 'methodology'
                  ? 'bg-emerald-50 text-emerald-700 font-bold border border-emerald-300 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <BookOpen className="w-4 h-4 text-slate-500" />
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
            <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-5 text-xs">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <strong className="block text-slate-900 font-bold mb-1">Global Horizontal Irradiance (GHI)</strong>
                <p className="text-slate-600 leading-relaxed">
                  Sum of direct beam (DNI × cos θ_z) and diffuse sky radiation (DHI). Governs photovoltaic module electron-hole pair generation.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <strong className="block text-slate-900 font-bold mb-1">Hub-Height Wind Shear (100m)</strong>
                <p className="text-slate-600 leading-relaxed">
                  Standard power law wind shear profiles v(z) = v_0 · (z/z_0)^α extrapolate ground anemometers up to modern 100m–150m wind turbine rotor centers.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <strong className="block text-slate-900 font-bold mb-1">Air Density Correction (ρ)</strong>
                <p className="text-slate-600 leading-relaxed">
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
          <div className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-sm space-y-6 text-xs text-slate-700 leading-relaxed">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                Forecasting Science, Machine Learning Pipeline &amp; Industry Standards
              </h3>
              <p className="text-slate-500 mt-0.5">
                Technical foundation of the multi-model time-series ensemble and automated grid action decision matrix.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-xs">
                    FB
                  </div>
                  <strong className="text-slate-900 text-sm">Prophet Harmonic Decomposition</strong>
                </div>
                <p>
                  Decomposes time-series into trend $g(t)$, periodic diurnal/seasonal harmonics $s(t)$, and holiday effects $h(t)$:
                </p>
                <div className="bg-slate-900 text-emerald-400 p-2.5 rounded font-mono text-[11px] text-center">
                  y(t) = g(t) + s(t) + h(t) + ε_t
                </div>
                <p>
                  Particularly resilient against missing SCADA timestamps and captures smooth daily diurnal solar peaks and weekly industrial demand shifts.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                    NN
                  </div>
                  <strong className="text-slate-900 text-sm">LSTM Recurrent Deep Neural Network</strong>
                </div>
                <p>
                  Utilizes cell memory states and gating mechanisms (Input, Forget, Output gates) to capture sequential atmospheric front momentum:
                </p>
                <div className="bg-slate-900 text-emerald-400 p-2.5 rounded font-mono text-[11px] text-center">
                  f_t = σ(W_f · [h_(t-1), x_t] + b_f)
                </div>
                <p>
                  Excels at predicting rapid Duck-Curve ramping events, sudden thunderstorm cloud arrivals, and gust front turbulence persistence.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                    GB
                  </div>
                  <strong className="text-slate-900 text-sm">XGBoost Gradient Boosted Trees</strong>
                </div>
                <p>
                  Greedy tree-building algorithm minimizing regularized loss over non-linear meteorological feature interactions:
                </p>
                <div className="bg-slate-900 text-emerald-400 p-2.5 rounded font-mono text-[11px] text-center">
                  Obj = Σ l(y_i, ŷ_i) + Σ Ω(f_k)
                </div>
                <p>
                  Handles non-linear aerodynamic power curve cutoffs (v_cut-in, v_rated, v_cut-out) and solar inverter clipping limits cleanly.
                </p>
              </div>
            </div>

            {/* Industrial Protocols Table */}
            <div className="border-t border-slate-100 pt-4">
              <h4 className="font-bold text-slate-900 text-sm mb-2">
                Standard Telemetry Protocol &amp; Regulatory Compliance
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Standard</th>
                      <th className="py-2.5 px-3">Scope &amp; Logical Node</th>
                      <th className="py-2.5 px-3">Measurement Channel</th>
                      <th className="py-2.5 px-3">Operational Grid Impact</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr>
                      <td className="py-2 px-3 font-bold text-emerald-700">IEC 61400-25</td>
                      <td className="py-2 px-3 font-mono">WT_ActivePower (P_Act)</td>
                      <td className="py-2 px-3">Wind Turbine Output (MW)</td>
                      <td className="py-2 px-3 text-slate-500">Scheduled generation matching and ramp-rate surveillance</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-amber-700">IEC 61724-1</td>
                      <td className="py-2 px-3 font-mono">POA_Irradiance / T_Mod</td>
                      <td className="py-2 px-3">Plane-of-Array &amp; Cell Temp</td>
                      <td className="py-2 px-3 text-slate-500">Photovoltaic performance ratio ($PR$) and thermal derating validation</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-cyan-700">IEEE 1547-2018</td>
                      <td className="py-2 px-3 font-mono">Volt-VAr / Freq-Watt</td>
                      <td className="py-2 px-3">Inverter Autonomous Response</td>
                      <td className="py-2 px-3 text-slate-500">Active curtailment and fast frequency response ($FFR$) regulation</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-bold text-purple-700">FERC Order 888</td>
                      <td className="py-2 px-3 font-mono">Day-Ahead Scheduling</td>
                      <td className="py-2 px-3">Imbalance Energy Settlement</td>
                      <td className="py-2 px-3 text-slate-500">Penalizes deviation exceeding ±10% bandwidth from day-ahead schedule</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 4. Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-7 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center space-x-3.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-1 flex items-center justify-center">
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
