import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  BatteryCharging, 
  ArrowRightLeft, 
  Briefcase, 
  ShieldCheck 
} from 'lucide-react';
import { GenerationForecastPoint } from '../types';

Chart.register(...registerables);

interface FinancialTradingStudioProps {
  forecastData: GenerationForecastPoint[];
  tariffBaseUSDperMWh: number;
}

export const FinancialTradingStudio: React.FC<FinancialTradingStudioProps> = ({
  forecastData,
  tariffBaseUSDperMWh,
}) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Financial aggregates (INR conversion, 1 USD ~ ₹80)
  const tariffBaseINR = Math.round(tariffBaseUSDperMWh * 80);
  const totalForecastEnergyMWh = forecastData.reduce((s, pt) => s + pt.totalForecast.ensemble, 0);
  const grossProjectedRevenueINR = Math.round(totalForecastEnergyMWh * tariffBaseINR);

  // Imbalance penalty exposure (when actual generation drops significantly below day-ahead commitment)
  const totalImbalancePenaltyINR = Math.round(
    forecastData.reduce((sum, pt) => {
      if (pt.generationDeltaMW < -50) {
        const deficitMWh = Math.abs(pt.generationDeltaMW);
        const penaltyRateINR = Math.max(2800, (pt.realTimeLMPProjected - pt.dayAheadLMP) * 80);
        return sum + deficitMWh * penaltyRateINR;
      }
      return sum;
    }, 0)
  );

  // BESS Arbitrage profit potential (₹ earned by shifting MWh from midday low to evening high)
  const totalBessArbitrageProfitINR = Math.round(
    forecastData.reduce((sum, pt) => sum + (pt.bessArbitragePotentialUSD * 80 * 45), 0)
  );

  // Avoided Curtailment value saved
  const avoidedCurtailmentSavingsINR = Math.round(
    forecastData
      .filter(pt => pt.imbalanceSeverity === 'OVER_GENERATION')
      .reduce((sum, pt) => sum + (pt.generationDeltaMW * 0.5 * tariffBaseINR), 0)
  );

  // Chart setup: LMP vs Generation Delta
  useEffect(() => {
    if (!chartRef.current || !forecastData || forecastData.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = forecastData.map(pt => pt.timeLabel);

    const newChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            type: 'line',
            label: 'Day-Ahead LMP (₹/MWh)',
            data: forecastData.map(pt => Math.round(pt.dayAheadLMP * 80)),
            borderColor: '#10b981',
            borderWidth: 2.5,
            yAxisID: 'yLMP',
            tension: 0.35,
            pointRadius: 2,
          },
          {
            type: 'line',
            label: 'Real-Time Projected LMP (₹/MWh)',
            data: forecastData.map(pt => Math.round(pt.realTimeLMPProjected * 80)),
            borderColor: '#f43f5e',
            borderDash: [3, 3],
            borderWidth: 2,
            yAxisID: 'yLMP',
            tension: 0.35,
            pointRadius: 1,
          },
          {
            type: 'bar',
            label: 'Generation Imbalance Delta (MW)',
            data: forecastData.map(pt => pt.generationDeltaMW),
            backgroundColor: forecastData.map(pt => 
              pt.generationDeltaMW >= 0 ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'
            ),
            borderColor: forecastData.map(pt => 
              pt.generationDeltaMW >= 0 ? '#10b981' : '#f43f5e'
            ),
            borderWidth: 1,
            yAxisID: 'yDelta',
            borderRadius: 3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 10, family: "'JetBrains Mono', monospace" },
              maxRotation: 45,
              callback: function (val, index) {
                return index % 4 === 0 ? labels[index] : '';
              },
            },
          },
          yLMP: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Market LMP (₹/MWh)',
              font: { size: 10, weight: 'bold' },
              color: '#10b981',
            },
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#10b981',
              font: { size: 10, family: "'JetBrains Mono', monospace" },
              callback: (v) => `₹${v}`,
            },
          },
          yDelta: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Generation Delta (MW)',
              font: { size: 10, weight: 'bold' },
              color: '#94a3b8',
            },
            grid: { drawOnChartArea: false },
            ticks: {
              color: '#94a3b8',
              font: { size: 10, family: "'JetBrains Mono', monospace" },
              callback: (v) => `${v} MW`,
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { 
              boxWidth: 12, 
              color: '#e2e8f0',
              font: { size: 11, weight: 'bold', family: "'JetBrains Mono', monospace" } 
            },
          },
        },
      },
    });

    chartInstance.current = newChart;

    return () => {
      newChart.destroy();
    };
  }, [forecastData, tariffBaseUSDperMWh]);

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/90 shadow-2xl space-y-7 sm:space-y-8 relative overflow-hidden">
      {/* Top subtle ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-emerald-500/60 via-amber-500/40 to-transparent"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Energy Trading, Settlement Risk &amp; BESS Arbitrage Studio
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlating renewable generation volatility with wholesale power market Locational Marginal Pricing (LMP / IEX).
            </p>
          </div>
        </div>

        <div className="text-right bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl shadow-inner">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contract Baseline Tariff</span>
          <span className="text-sm font-mono font-black text-emerald-400">₹{tariffBaseINR.toLocaleString()} / MWh</span>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Gross Projected Revenue */}
        <div className="glass-panel glass-panel-hover p-5 rounded-xl border border-slate-800 bg-slate-900/80 shadow-md flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Gross Projected Yield
          </span>
          <div className="my-2.5">
            <span className="text-3xl font-black text-white font-mono tracking-tight">
              ₹{grossProjectRevenueINR(grossProjectedRevenueINR)}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-mono">
            Based on {Math.round(totalForecastEnergyMWh).toLocaleString()} MWh generated
          </span>
        </div>

        {/* Imbalance Settlement Risk */}
        <div className="glass-panel glass-panel-hover p-5 rounded-xl border border-rose-500/30 bg-slate-900/80 shadow-md flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center justify-between">
            <span>Imbalance Deviation Risk</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          </span>
          <div className="my-2.5">
            <span className="text-3xl font-black text-rose-400 font-mono tracking-tight">
              ₹{totalImbalancePenaltyINR.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-rose-400/80 font-mono">
            DSM penalty if schedule deviations are unhedged
          </span>
        </div>

        {/* BESS Arbitrage Profit */}
        <div className="glass-panel glass-panel-hover p-5 rounded-xl border border-emerald-500/30 bg-slate-900/80 shadow-md flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center justify-between">
            <span>BESS Arbitrage Upside</span>
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
          </span>
          <div className="my-2.5">
            <span className="text-3xl font-black text-emerald-400 font-mono tracking-tight">
              +₹{totalBessArbitrageProfitINR.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-emerald-400/80 font-mono">
            Shift midday solar excess to peak evening tariff
          </span>
        </div>

        {/* Avoided Curtailment Revenue */}
        <div className="glass-panel glass-panel-hover p-5 rounded-xl border border-cyan-500/30 bg-slate-900/80 shadow-md flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-between">
            <span>Avoided Curtailment Value</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          </span>
          <div className="my-2.5">
            <span className="text-3xl font-black text-cyan-400 font-mono tracking-tight">
              +₹{avoidedCurtailmentSavingsINR.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-cyan-400/80 font-mono">
            Preserved through storage &amp; intertie dispatch
          </span>
        </div>
      </div>

      {/* Chart: Market LMP vs Forecast Imbalance Delta */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Hourly Locational Marginal Price (LMP) &amp; Supply Deviation (MW)</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            IEX Green Day-Ahead / Real-Time Market simulation
          </span>
        </div>

        <div className="relative w-full h-[300px]">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
};

function grossProjectRevenueINR(amt: number): string {
  return amt.toLocaleString();
}
