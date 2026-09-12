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
              font: { size: 11, weight: 'bold' },
            },
          },
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
          ySolar: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Irradiance (W/m²)',
              color: '#d97706',
              font: { size: 10, weight: 'bold' },
            },
            min: 0,
            max: 1100,
            grid: { color: '#f1f5f9' },
          },
          yWind: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Wind Speed (m/s)',
              color: '#0891b2',
              font: { size: 10, weight: 'bold' },
            },
            min: 0,
            max: 30,
            grid: { drawOnChartArea: false },
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
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-7 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Satellite &amp; High-Resolution Weather Telemetry
            </h3>
            <p className="text-xs text-slate-500">
              Ingesting NOAA HRRR, ECMWF, and GOES-16 geostationary satellite atmospheric vectors.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 text-xs">
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
            <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
            <span>Telemetry Feed: 1.0 Hz Active</span>
          </span>
          <span className="font-mono text-slate-600 font-bold bg-slate-100 px-2.5 py-1.5 rounded-lg">
            Target: H+{selectedHourOffset}
          </span>
        </div>
      </div>

      {/* Real-time Weather Grid Gauges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-5">
        {/* 1. Solar GHI */}
        <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Solar GHI</span>
            <Sun className="w-4 h-4 text-amber-500" />
          </div>
          <div>
            <span className="text-xl font-black text-amber-950 font-mono">
              {currentWeather.ghi}
            </span>
            <span className="text-xs text-amber-700 ml-1">W/m²</span>
          </div>
          <div className="text-[10px] text-amber-600 mt-1">
            DNI: {currentWeather.dni} W/m²
          </div>
        </div>

        {/* 2. Wind Speed */}
        <div className="bg-cyan-50/60 p-3 rounded-xl border border-cyan-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-cyan-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Wind (100m)</span>
            <Wind className="w-4 h-4 text-cyan-500" />
          </div>
          <div>
            <span className="text-xl font-black text-cyan-950 font-mono">
              {currentWeather.windSpeed100m}
            </span>
            <span className="text-xs text-cyan-700 ml-1">m/s</span>
          </div>
          <div className="text-[10px] text-cyan-600 mt-1">
            Dir: {currentWeather.windDirectionDeg}° (WSW)
          </div>
        </div>

        {/* 3. Cloud Cover */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Cloud Cover</span>
            <CloudSun className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 font-mono">
              {currentWeather.cloudCoverPct}
            </span>
            <span className="text-xs text-slate-600 ml-1">%</span>
          </div>
          <div className="text-[10px] text-slate-500 mt-1">
            Albedo: {(1 - currentWeather.cloudCoverPct / 100).toFixed(2)}
          </div>
        </div>

        {/* 4. Ambient Temperature */}
        <div className="bg-orange-50/60 p-3 rounded-xl border border-orange-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-orange-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Temperature</span>
            <Thermometer className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <span className="text-xl font-black text-orange-950 font-mono">
              {currentWeather.ambientTempC}
            </span>
            <span className="text-xs text-orange-700 ml-1">°C</span>
          </div>
          <div className="text-[10px] text-orange-600 mt-1">
            PV Cell: {Math.round(currentWeather.ambientTempC + (currentWeather.ghi / 800) * 28)}°C
          </div>
        </div>

        {/* 5. Air Density */}
        <div className="bg-indigo-50/60 p-3 rounded-xl border border-indigo-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-indigo-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Air Density (ρ)</span>
            <Gauge className="w-4 h-4 text-indigo-500" />
          </div>
          <div>
            <span className="text-xl font-black text-indigo-950 font-mono">
              {currentWeather.airDensity}
            </span>
            <span className="text-xs text-indigo-700 ml-1">kg/m³</span>
          </div>
          <div className="text-[10px] text-indigo-600 mt-1">
            Baro: {currentWeather.barometricPressureHpa} hPa
          </div>
        </div>

        {/* 6. Relative Humidity */}
        <div className="bg-teal-50/60 p-3 rounded-xl border border-teal-200/60 flex flex-col justify-between">
          <div className="flex items-center justify-between text-teal-700 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Rel Humidity</span>
            <CloudRain className="w-4 h-4 text-teal-500" />
          </div>
          <div>
            <span className="text-xl font-black text-teal-950 font-mono">
              {currentWeather.relativeHumidityPct}
            </span>
            <span className="text-xs text-teal-700 ml-1">%</span>
          </div>
          <div className="text-[10px] text-teal-600 mt-1">
            Dew Point: ~14°C
          </div>
        </div>
      </div>

      {/* Weather Trend Multi-Axis Chart */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Atmospheric Radiation &amp; Wind Velocity Trajectory
          </span>
          <span className="text-[11px] text-slate-400">
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
