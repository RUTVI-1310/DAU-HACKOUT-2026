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
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { size: 10 },
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
              color: '#059669',
            },
            grid: { color: '#f1f5f9' },
            ticks: {
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
              color: '#64748b',
            },
            grid: { drawOnChartArea: false },
            ticks: {
              callback: (v) => `${v} MW`,
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { boxWidth: 12, font: { size: 11 } },
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
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-7 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <IndianRupee className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Energy Trading, Settlement Risk &amp; BESS Arbitrage Studio
            </h3>
            <p className="text-xs text-slate-500">
              Correlating renewable generation volatility with wholesale power market Locational Marginal Pricing (LMP / IEX).
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Contract Tariff</span>
          <span className="text-sm font-mono font-black text-emerald-700">₹{tariffBaseINR.toLocaleString()} / MWh</span>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Gross Projected Revenue */}
        <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Gross Projected Yield
          </span>
          <div className="my-2.5">
            <span className="text-2xl font-black text-slate-900 tracking-tight">
              ₹{grossProjectRevenueINR(grossProjectedRevenueINR)}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Based on {Math.round(totalForecastEnergyMWh).toLocaleString()} MWh generated
          </span>
        </div>

        {/* Imbalance Settlement Risk */}
        <div className="p-5 rounded-xl bg-rose-50/70 border border-rose-200 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center justify-between">
            <span>Imbalance Deviation Risk</span>
            <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
          </span>
          <div className="my-2.5">
            <span className="text-2xl font-black text-rose-700 tracking-tight">
              ₹{totalImbalancePenaltyINR.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-rose-600">
            DSM penalty if schedule deviations are unhedged
          </span>
        </div>

        {/* BESS Arbitrage Profit */}
        <div className="p-5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center justify-between">
            <span>BESS Arbitrage Upside</span>
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
          </span>
          <div className="my-2.5">
            <span className="text-2xl font-black text-emerald-800 tracking-tight">
              +₹{totalBessArbitrageProfitINR.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-emerald-700">
            Shift midday solar excess to peak evening tariff
          </span>
        </div>

        {/* Avoided Curtailment Revenue */}
        <div className="p-5 rounded-xl bg-cyan-50/70 border border-cyan-200 flex flex-col justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-cyan-800 flex items-center justify-between">
            <span>Avoided Curtailment Value</span>
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
          </span>
          <div className="my-2.5">
            <span className="text-2xl font-black text-cyan-800 tracking-tight">
              +₹{avoidedCurtailmentSavingsINR.toLocaleString()}
            </span>
          </div>
          <span className="text-[11px] text-cyan-700">
            Preserved through storage &amp; intertie dispatch
          </span>
        </div>
      </div>

      {/* Chart: Market LMP vs Forecast Imbalance Delta */}
      <div className="pt-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Hourly Locational Marginal Price (LMP) &amp; Supply Deviation (MW)
          </span>
          <span className="text-[11px] text-slate-400">
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
