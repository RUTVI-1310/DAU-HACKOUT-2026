import React, { useState } from 'react';
import { X, Download, Copy, Check, FileSpreadsheet, FileCode } from 'lucide-react';
import { GenerationForecastPoint } from '../types';

interface ExportScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  forecastData: GenerationForecastPoint[];
  selectedModel: string;
}

export const ExportScheduleModal: React.FC<ExportScheduleModalProps> = ({
  isOpen,
  onClose,
  forecastData,
  selectedModel,
}) => {
  const [copied, setCopied] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');

  if (!isOpen) return null;

  // Generate CSV format
  const generateCSV = () => {
    const headers = [
      'HourOffset',
      'TimeLabel',
      'Timestamp',
      'TotalForecast_MW',
      'SolarForecast_MW',
      'WindForecast_MW',
      'ScheduledDemand_MW',
      'GenerationDelta_MW',
      'RampRate_MW_hr',
      'ImbalanceSeverity',
      'DayAheadLMP_INR',
      'RealTimeLMP_INR',
      'DayAheadLMP_USD',
      'RealTimeLMP_USD',
      'RecommendedAction',
    ];

    const rows = forecastData.map((pt) => [
      pt.hourOffset,
      `"${pt.timeLabel}"`,
      pt.timestamp,
      (pt.totalForecast as any)[selectedModel],
      (pt.solarForecast as any)[selectedModel],
      (pt.windForecast as any)[selectedModel],
      pt.gridDemandScheduledMW,
      pt.generationDeltaMW,
      pt.rampRateMWperHr,
      pt.imbalanceSeverity,
      Math.round(pt.dayAheadLMP * 80),
      Math.round(pt.realTimeLMPProjected * 80),
      pt.dayAheadLMP,
      pt.realTimeLMPProjected,
      pt.recommendedAction ? `"${pt.recommendedAction.title}"` : '""',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  };

  // Generate JSON format
  const generateJSON = () => {
    const data = forecastData.map((pt) => ({
      hour: pt.timeLabel,
      timestamp: pt.timestamp,
      totalGenerationMW: (pt.totalForecast as any)[selectedModel],
      solarMW: (pt.solarForecast as any)[selectedModel],
      windMW: (pt.windForecast as any)[selectedModel],
      scheduledDemandMW: pt.gridDemandScheduledMW,
      imbalanceDeltaMW: pt.generationDeltaMW,
      rampRateMWperHr: pt.rampRateMWperHr,
      severity: pt.imbalanceSeverity,
      dayAheadLMP_INR: Math.round(pt.dayAheadLMP * 80),
      realTimeLMP_INR: Math.round(pt.realTimeLMPProjected * 80),
      action: pt.recommendedAction?.title || null,
    }));
    return JSON.stringify(data, null, 2);
  };

  const payload = exportFormat === 'csv' ? generateCSV() : generateJSON();

  const handleCopy = () => {
    navigator.clipboard.writeText(payload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([payload], {
      type: exportFormat === 'csv' ? 'text/csv;charset=utf-8;' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `GridSense_Forecast_${forecastData.length}h_${Date.now()}.${exportFormat}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <div className="glass-panel rounded-2xl shadow-2xl border border-slate-800 max-w-2xl w-full flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-sm sm:text-base">
                Export Grid Schedule &amp; Dispatch Orders
              </h3>
              <p className="text-xs text-slate-400">
                Format compliant with Grid-India / SLDC, IEX/PXIL, CAISO, and ENTSO-E scheduling formats.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 flex-grow overflow-y-auto">
          {/* Format selection */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Select File Format:</span>
            <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-xs">
              <button
                onClick={() => setExportFormat('csv')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md font-bold transition cursor-pointer ${
                  exportFormat === 'csv'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>CSV Spreadsheet</span>
              </button>
              <button
                onClick={() => setExportFormat('json')}
                className={`flex items-center space-x-1 px-3 py-1.5 rounded-md font-bold transition cursor-pointer ${
                  exportFormat === 'json'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>JSON API Payload</span>
              </button>
            </div>
          </div>

          {/* Code Preview */}
          <div className="bg-slate-950 text-emerald-400 p-3.5 rounded-xl font-mono text-xs max-h-[300px] overflow-auto border border-slate-800/90 shadow-inner">
            <pre className="whitespace-pre">{payload.slice(0, 2000)}{payload.length > 2000 ? '\n... (truncated for preview)' : ''}</pre>
          </div>

          <div className="text-xs text-slate-400 italic">
            Schedule contains {forecastData.length} hourly forecast timesteps computed using the{' '}
            <strong className="text-slate-200 font-mono">{selectedModel.toUpperCase()}</strong> pipeline.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800/80 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-200 transition cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to Clipboard' : 'Copy Data'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download .{exportFormat.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
