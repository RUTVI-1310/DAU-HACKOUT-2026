import React, { useEffect, useRef, useState } from 'react';
import { Chart, registerables } from 'chart.js';
import { 
  BarChart3, 
  Layers, 
  Eye, 
  EyeOff, 
  Info, 
  Sun, 
  Wind, 
  Maximize2, 
  Zap,
  TrendingDown,
  AlertTriangle
} from 'lucide-react';
import { GenerationForecastPoint, SimulationParameters } from '../types';

Chart.register(...registerables);

interface ForecastChartProps {
  forecastData: GenerationForecastPoint[];
  params: SimulationParameters;
  selectedHourOffset: number;
  onSelectHour: (offset: number) => void;
}

export const ForecastChart: React.FC<ForecastChartProps> = ({
  forecastData,
  params,
  selectedHourOffset,
  onSelectHour,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  // Layer visibility toggles
  const [showSolar, setShowSolar] = useState(true);
  const [showWind, setShowWind] = useState(true);
  const [showTotal, setShowTotal] = useState(true);
  const [showScheduledDemand, setShowScheduledDemand] = useState(true);
  const [showConfidenceBand, setShowConfidenceBand] = useState(true);
  const [compareAllModels, setCompareAllModels] = useState(false);

  useEffect(() => {
    if (!canvasRef.current || !forecastData || forecastData.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Clean up previous instance
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const labels = forecastData.map(pt => pt.timeLabel);
    const modelKey = params.selectedModel;

    const datasets: any[] = [];

    if (!compareAllModels) {
      // 1. P90 Confidence Upper Bound (Confidence envelope fill)
      if (showConfidenceBand) {
        datasets.push({
          type: 'line',
          label: 'P90 Optimistic Forecast (MW)',
          data: forecastData.map(pt => pt.totalForecast.p90),
          borderColor: 'rgba(16, 185, 129, 0.25)',
          borderWidth: 1,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: '+1', // fill down to P10 dataset below
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          tension: 0.35,
          order: 6,
        });

        // 2. P10 Confidence Lower Bound
        datasets.push({
          type: 'line',
          label: 'P10 Conservative Forecast (MW)',
          data: forecastData.map(pt => pt.totalForecast.p10),
          borderColor: 'rgba(16, 185, 129, 0.25)',
          borderWidth: 1,
          borderDash: [3, 3],
          pointRadius: 0,
          fill: false,
          tension: 0.35,
          order: 7,
        });
      }

      // 3. Solar Generation Curve
      if (showSolar) {
        datasets.push({
          type: 'line',
          label: `Solar Generation (${modelKey.toUpperCase()})`,
          data: forecastData.map(pt => pt.solarForecast[modelKey]),
          borderColor: '#f59e0b', // amber-500
          backgroundColor: 'rgba(245, 158, 11, 0.15)',
          borderWidth: 2,
          pointRadius: (ctx: any) => (ctx.dataIndex === selectedHourOffset ? 6 : 2),
          pointBackgroundColor: '#f59e0b',
          tension: 0.35,
          order: 3,
        });
      }

      // 4. Wind Generation Curve
      if (showWind) {
        datasets.push({
          type: 'line',
          label: `Wind Generation (${modelKey.toUpperCase()})`,
          data: forecastData.map(pt => pt.windForecast[modelKey]),
          borderColor: '#06b6d4', // cyan-500
          backgroundColor: 'rgba(6, 182, 212, 0.15)',
          borderWidth: 2,
          pointRadius: (ctx: any) => (ctx.dataIndex === selectedHourOffset ? 6 : 2),
          pointBackgroundColor: '#06b6d4',
          tension: 0.35,
          order: 2,
        });
      }

      // 5. Total Renewable Supply
      if (showTotal) {
        datasets.push({
          type: 'line',
          label: `Total Renewable Generation (${modelKey.toUpperCase()})`,
          data: forecastData.map(pt => pt.totalForecast[modelKey]),
          borderColor: '#059669', // emerald-600
          backgroundColor: 'rgba(5, 150, 105, 0.1)',
          borderWidth: 3,
          pointRadius: (ctx: any) => (ctx.dataIndex === selectedHourOffset ? 8 : 3),
          pointHoverRadius: 8,
          pointBackgroundColor: (ctx: any) => (ctx.dataIndex === selectedHourOffset ? '#fbbf24' : '#059669'),
          pointBorderColor: '#ffffff',
          pointBorderWidth: 2,
          tension: 0.35,
          order: 1,
        });
      }

      // 6. Scheduled Grid Demand Commitment
      if (showScheduledDemand) {
        datasets.push({
          type: 'line',
          label: 'Scheduled Grid Demand (MW)',
          data: forecastData.map(pt => pt.gridDemandScheduledMW),
          borderColor: '#64748b', // slate-500
          borderWidth: 2,
          borderDash: [6, 4],
          pointRadius: 0,
          fill: false,
          tension: 0.3,
          order: 4,
        });
      }
    } else {
      // Compare All 3 Models Side-by-Side (Prophet, LSTM, XGBoost, Ensemble)
      datasets.push(
        {
          type: 'line',
          label: 'AI Ensemble Blend (Prophet+LSTM+XGBoost)',
          data: forecastData.map(pt => pt.totalForecast.ensemble),
          borderColor: '#059669',
          borderWidth: 3.5,
          pointRadius: 2,
          tension: 0.35,
        },
        {
          type: 'line',
          label: 'LSTM Deep Recurrent Net',
          data: forecastData.map(pt => pt.totalForecast.lstm),
          borderColor: '#8b5cf6', // purple-500
          borderWidth: 2,
          borderDash: [4, 2],
          pointRadius: 1,
          tension: 0.35,
        },
        {
          type: 'line',
          label: 'XGBoost Gradient Boosted Trees',
          data: forecastData.map(pt => pt.totalForecast.xgboost),
          borderColor: '#3b82f6', // blue-500
          borderWidth: 2,
          pointRadius: 1,
          tension: 0.35,
        },
        {
          type: 'line',
          label: 'Prophet Additive Harmonic Model',
          data: forecastData.map(pt => pt.totalForecast.prophet),
          borderColor: '#ec4899', // pink-500
          borderWidth: 2,
          pointRadius: 1,
          tension: 0.35,
        },
        {
          type: 'line',
          label: 'Scheduled Grid Demand',
          data: forecastData.map(pt => pt.gridDemandScheduledMW),
          borderColor: '#94a3b8',
          borderWidth: 1.5,
          borderDash: [5, 5],
          pointRadius: 0,
        }
      );
    }

    const newChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        onClick: (event, elements) => {
          if (elements.length > 0) {
            const index = elements[0].index;
            onSelectHour(index);
          }
        },
        plugins: {
          legend: {
            display: false, // Custom styled legend below
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleColor: '#f8fafc',
            bodyColor: '#e2e8f0',
            borderColor: '#334155',
            borderWidth: 1,
            padding: 12,
            titleFont: { size: 13, weight: 'bold' },
            bodyFont: { size: 12 },
            cornerRadius: 8,
            callbacks: {
              title: (tooltipItems) => {
                const idx = tooltipItems[0].dataIndex;
                const pt = forecastData[idx];
                return `${pt.timeLabel} (${pt.dayLabel})`;
              },
              afterTitle: (tooltipItems) => {
                const idx = tooltipItems[0].dataIndex;
                const pt = forecastData[idx];
                const weatherStr = `Weather: ${pt.weather.windSpeed100m} m/s wind, ${pt.weather.ghi} W/m² GHI, ${pt.weather.cloudCoverPct}% clouds, ${pt.weather.ambientTempC}°C`;
                const lmpStr = `Day-Ahead LMP: ₹${(pt.dayAheadLMP * 80).toLocaleString()}/MWh | Real-Time: ₹${(pt.realTimeLMPProjected * 80).toLocaleString()}/MWh`;
                return `${weatherStr}\n${lmpStr}`;
              },
              afterBody: (tooltipItems) => {
                const idx = tooltipItems[0].dataIndex;
                const pt = forecastData[idx];
                const deltaStr = pt.generationDeltaMW > 0 
                  ? `[+] Over-Generation: +${pt.generationDeltaMW} MW` 
                  : `[-] Under-Generation: ${pt.generationDeltaMW} MW`;
                const rampStr = `Ramp Rate: ${pt.rampRateMWperHr > 0 ? '+' : ''}${pt.rampRateMWperHr} MW/h`;
                const recStr = pt.recommendedAction 
                  ? `\nRecommended Action: [${pt.recommendedAction.priority}] ${pt.recommendedAction.title}`
                  : '';
                return `\n${deltaStr}\n${rampStr}${recStr}`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: {
              color: '#f1f5f9',
            },
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              font: { size: 10 },
              callback: function (val, index) {
                // Show every 3rd or 4th label to prevent clutter on 72h
                const step = forecastData.length > 48 ? 4 : 2;
                return index % step === 0 ? labels[index] : '';
              },
            },
          },
          y: {
            title: {
              display: true,
              text: 'Power Generation & Scheduled Demand (MW)',
              font: { size: 11, weight: 'bold' },
              color: '#475569',
            },
            grid: {
              color: '#f1f5f9',
            },
            ticks: {
              font: { size: 10 },
              callback: (val) => `${val} MW`,
            },
            beginAtZero: true,
          },
        },
      },
    });

    chartInstanceRef.current = newChart;

    return () => {
      newChart.destroy();
    };
  }, [
    forecastData,
    params.selectedModel,
    selectedHourOffset,
    showSolar,
    showWind,
    showTotal,
    showScheduledDemand,
    showConfidenceBand,
    compareAllModels,
  ]);

  const activePoint = forecastData[selectedHourOffset] || forecastData[0];

  return (
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col space-y-6 sm:space-y-7">
      {/* Chart Header Controls & Layer Toggles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2.5">
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Renewable Generation Forecast Horizon ({params.horizonHours} Hours)
            </h2>
            <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {params.selectedPlantId === 'ALL' ? 'Fleet-Wide (1,230 MW)' : 'Site Level'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Interactive multi-sensor time-series model blending. Click any point to inspect hour-level dispatch specifics.
          </p>
        </div>

        {/* Action / View Toggles */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs">
          <button
            onClick={() => setCompareAllModels(!compareAllModels)}
            className={`px-3.5 py-2 rounded-lg font-bold border transition flex items-center space-x-1.5 ${
              compareAllModels
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
            }`}
            title="Overlay Prophet, LSTM, and XGBoost curves simultaneously"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{compareAllModels ? 'Models Overlaid' : 'Compare 3 Models'}</span>
          </button>

          {!compareAllModels && (
            <button
              onClick={() => setShowConfidenceBand(!showConfidenceBand)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition flex items-center space-x-1 ${
                showConfidenceBand
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}
              title="Toggle P10 - P90 Uncertainty Envelope"
            >
              <span>P10–P90 Band</span>
            </button>
          )}
        </div>
      </div>

      {/* Layer Visibility Pills */}
      {!compareAllModels && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setShowTotal(!showTotal)}
            className={`px-2.5 py-1 rounded-md font-semibold border flex items-center space-x-1.5 transition ${
              showTotal 
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span>Total Forecast ({params.selectedModel.toUpperCase()})</span>
          </button>

          <button
            onClick={() => setShowSolar(!showSolar)}
            className={`px-2.5 py-1 rounded-md font-semibold border flex items-center space-x-1.5 transition ${
              showSolar 
                ? 'bg-amber-50 text-amber-800 border-amber-300' 
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span>Solar PV</span>
          </button>

          <button
            onClick={() => setShowWind(!showWind)}
            className={`px-2.5 py-1 rounded-md font-semibold border flex items-center space-x-1.5 transition ${
              showWind 
                ? 'bg-cyan-50 text-cyan-800 border-cyan-300' 
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500"></span>
            <span>Wind Turbines</span>
          </button>

          <button
            onClick={() => setShowScheduledDemand(!showScheduledDemand)}
            className={`px-2.5 py-1 rounded-md font-semibold border flex items-center space-x-1.5 transition ${
              showScheduledDemand 
                ? 'bg-slate-100 text-slate-700 border-slate-300' 
                : 'bg-slate-50 text-slate-400 border-slate-200 line-through'
            }`}
          >
            <span className="w-2.5 h-1 border-t-2 border-dashed border-slate-600"></span>
            <span>Scheduled Grid Demand</span>
          </button>

          <span className="text-[11px] text-slate-400 ml-auto italic">
            Tip: Click anywhere along the line to inspect hour details below
          </span>
        </div>
      )}

      {/* Main Chart Canvas Container */}
      <div className="relative w-full h-[360px] md:h-[400px]">
        <canvas ref={canvasRef}></canvas>
      </div>

      {/* Selected Time-Step Detail Inspector Bar */}
      {activePoint && (
        <div className="bg-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-md border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 text-xs">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black font-mono text-sm">
              H+{activePoint.hourOffset}
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <span className="font-bold text-sm text-white">{activePoint.timeLabel}</span>
                <span className="text-slate-400 font-medium">({activePoint.dayLabel})</span>
                {activePoint.imbalanceSeverity === 'OVER_GENERATION' && (
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    OVER-GENERATION (+{activePoint.generationDeltaMW} MW)
                  </span>
                )}
                {activePoint.imbalanceSeverity === 'UNDER_GENERATION' && (
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    UNDER-GENERATION ({activePoint.generationDeltaMW} MW)
                  </span>
                )}
                {activePoint.imbalanceSeverity === 'STEEP_RAMP_DOWN' && (
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-rose-600 text-white">
                    STEEP RAMP DOWN ({activePoint.rampRateMWperHr} MW/h)
                  </span>
                )}
                {activePoint.imbalanceSeverity === 'BALANCED' && (
                  <span className="px-2.5 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-300">
                    BALANCED GRID
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Solar: <strong className="text-amber-300">{activePoint.solarForecast[params.selectedModel]} MW</strong> &bull; 
                Wind: <strong className="text-cyan-300">{activePoint.windForecast[params.selectedModel]} MW</strong> &bull; 
                Demand: <strong>{activePoint.gridDemandScheduledMW} MW</strong> &bull; 
                LMP: <strong className="text-emerald-300">₹{(activePoint.dayAheadLMP * 80).toLocaleString()}/MWh</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 text-right">
            {activePoint.recommendedAction ? (
              <div className="flex items-center space-x-2.5">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block">
                    Action Recommended
                  </span>
                  <span className="font-bold text-white max-w-[260px] truncate block">
                    {activePoint.recommendedAction.title}
                  </span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold">
                  !
                </div>
              </div>
            ) : (
              <div className="text-slate-400 italic text-[11px]">
                Nominal operations within reserve margins. No intervention required.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
