import React, { useEffect, useRef } from 'react';
import { Chart, registerables } from 'chart.js';
import { 
  Sun, 
  Wind, 
  CloudRain, 
  Compass, 
  Thermometer, 
  Gauge, 
  Radio, 
  Eye, 
  Satellite, 
  CloudSun 
} from 'lucide-react';
import { WeatherForecastPoint } from '../types';

Chart.register(...registerables);

interface WeatherSatTelemetryProps {
  weatherTimeline: WeatherForecastPoint[];
  selectedHourOffset: number;
}

export const WeatherSatTelemetry: React.FC<WeatherSatTelemetryProps> = ({
  weatherTimeline,
  selectedHourOffset,
}) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  const currentWeather = weatherTimeline[selectedHourOffset] || weatherTimeline[0];

  useEffect(() => {
    if (!chartRef.current || !weatherTimeline || weatherTimeline.length === 0) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const labels = weatherTimeline.map(w => w.timeLabel);

    const newChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Solar GHI (W/m²)',
            data: weatherTimeline.map(w => w.ghi),
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            yAxisID: 'ySolar',
            borderWidth: 2,
            tension: 0.35,
            fill: true,
          },
          {
            label: 'Wind Speed 100m Hub (m/s)',
            data: weatherTimeline.map(w => w.windSpeed100m),
            borderColor: '#06b6d4',
            backgroundColor: 'rgba(6, 182, 212, 0.1)',
            yAxisID: 'yWind',
            borderWidth: 2.5,
            tension: 0.35,
          },
          {
            label: 'Cloud Cover (%)',
            data: weatherTimeline.map(w => w.cloudCoverPct),
            borderColor: '#94a3b8',
            borderDash: [3, 3],
            yAxisID: 'yCloud',
            borderWidth: 1.5,
            pointRadius: 0,
            tension: 0.25,
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
        plugins: {
          legend: {
            position: 'top',
            labels: {
              boxWidth: 12,
              color: '#e2e8f0',
              font: { size: 11, weight: 'bold', family: "'JetBrains Mono', monospace" },
            },
          },
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
          ySolar: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Irradiance (W/m²)',
              color: '#f59e0b',
              font: { size: 10, weight: 'bold' },
            },
            min: 0,
            max: 1100,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#94a3b8',
              font: { size: 10, family: "'JetBrains Mono', monospace" },
            },
          },
          yWind: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Wind Speed (m/s)',
              color: '#06b6d4',
              font: { size: 10, weight: 'bold' },
            },
            min: 0,
            max: 30,
            grid: { drawOnChartArea: false },
            ticks: {
              color: '#94a3b8',
              font: { size: 10, family: "'JetBrains Mono', monospace" },
            },
          },
          yCloud: {
            type: 'linear',
            position: 'right',
            display: false,
            min: 0,
            max: 100,
          },
        },
      },
    });

    chartInstance.current = newChart;

    return () => {
      newChart.destroy();
    };
  }, [weatherTimeline]);

  if (!currentWeather) return null;

  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/90 shadow-2xl space-y-7 sm:space-y-8 relative overflow-hidden">
      {/* Top subtle ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-500/60 via-cyan-500/40 to-transparent"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center justify-center shadow-xs">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white tracking-tight">
              Satellite &amp; High-Resolution Weather Telemetry HUD
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Ingesting NOAA HRRR, ECMWF, and GOES-16 geostationary satellite atmospheric vectors.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 text-xs">
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold border border-emerald-500/30 shadow-xs">
            <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span className="font-mono">Telemetry Feed: 1.0 Hz Active</span>
          </span>
          <span className="font-mono text-slate-300 font-bold bg-slate-900 border border-slate-700 px-2.5 py-1.5 rounded-lg shadow-inner">
            Target: H+{selectedHourOffset}
          </span>
        </div>
      </div>

      {/* Real-time Weather Grid Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
        {/* 1. Solar GHI */}
        <div className="glass-panel p-3.5 rounded-xl border border-amber-500/30 bg-slate-900/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Solar GHI</span>
            <Sun className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono">
              {currentWeather.ghi}
            </span>
            <span className="text-xs text-amber-400 ml-1 font-mono font-semibold">W/m²</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            DNI: <strong className="text-amber-300">{currentWeather.dni}</strong> W/m²
          </div>
        </div>

        {/* 2. Wind Speed */}
        <div className="glass-panel p-3.5 rounded-xl border border-cyan-500/30 bg-slate-900/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Wind (100m)</span>
            <Wind className="w-4 h-4 text-cyan-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono">
              {currentWeather.windSpeed100m}
            </span>
            <span className="text-xs text-cyan-400 ml-1 font-mono font-semibold">m/s</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Dir: <strong className="text-cyan-300">{currentWeather.windDirectionDeg}°</strong> (WSW)
          </div>
        </div>

        {/* 3. Cloud Cover */}
        <div className="glass-panel p-3.5 rounded-xl border border-slate-700 bg-slate-900/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-300 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cloud Cover</span>
            <CloudSun className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono">
              {currentWeather.cloudCoverPct}
            </span>
            <span className="text-xs text-slate-400 ml-1 font-mono font-semibold">%</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Albedo: <strong className="text-slate-300">{(1 - currentWeather.cloudCoverPct / 100).toFixed(2)}</strong>
          </div>
        </div>

        {/* 4. Ambient Temperature */}
        <div className="glass-panel p-3.5 rounded-xl border border-orange-500/30 bg-slate-900/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-orange-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Temperature</span>
            <Thermometer className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono">
              {currentWeather.ambientTempC}
            </span>
            <span className="text-xs text-orange-400 ml-1 font-mono font-semibold">°C</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            PV Cell: <strong className="text-orange-300">{Math.round(currentWeather.ambientTempC + (currentWeather.ghi / 800) * 28)}°C</strong>
          </div>
        </div>

        {/* 5. Air Density */}
        <div className="glass-panel p-3.5 rounded-xl border border-indigo-500/30 bg-slate-900/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Air Density (ρ)</span>
            <Gauge className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono">
              {currentWeather.airDensity}
            </span>
            <span className="text-xs text-indigo-400 ml-1 font-mono font-semibold">kg/m³</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Baro: <strong className="text-indigo-300">{currentWeather.barometricPressureHpa}</strong> hPa
          </div>
        </div>

        {/* 6. Relative Humidity */}
        <div className="glass-panel p-3.5 rounded-xl border border-teal-500/30 bg-slate-900/80 shadow-md flex flex-col justify-between">
          <div className="flex items-center justify-between text-teal-400 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rel Humidity</span>
            <CloudRain className="w-4 h-4 text-teal-400" />
          </div>
          <div>
            <span className="text-2xl font-black text-white font-mono">
              {currentWeather.relativeHumidityPct}
            </span>
            <span className="text-xs text-teal-400 ml-1 font-mono font-semibold">%</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 font-mono">
            Dew Point: <strong className="text-teal-300">~14°C</strong>
          </div>
        </div>
      </div>

      {/* Weather Trend Multi-Axis Chart */}
      <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>Atmospheric Radiation &amp; Wind Velocity Trajectory</span>
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Hourly Met Trends with Interpolated Solar Noon
          </span>
        </div>

        <div className="relative w-full h-[240px]">
          <canvas ref={chartRef}></canvas>
        </div>
      </div>
    </div>
  );
};
