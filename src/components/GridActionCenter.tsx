import React, { useState } from 'react';
import { 
  AlertOctagon, 
  BatteryCharging, 
  ShieldAlert, 
  CheckCircle2, 
  Flame, 
  ArrowUpRight, 
  Sliders, 
  IndianRupee, 
  Leaf, 
  Clock, 
  ChevronRight,
  Send,
  Sparkles
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExecutionLog, GenerationForecastPoint, GridActionRecommendation } from '../types';

interface GridActionCenterProps {
  forecastData: GenerationForecastPoint[];
  onExecuteAction: (action: GridActionRecommendation) => void;
  dispatchedActionIds: string[];
}

export const GridActionCenter: React.FC<GridActionCenterProps> = ({
  forecastData,
  onExecuteAction,
  dispatchedActionIds,
}) => {
  const [filterPriority, setFilterPriority] = useState<'ALL' | 'CRITICAL' | 'HIGH'>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Extract all recommended actions across the timeline
  const allActions: GridActionRecommendation[] = [];
  forecastData.forEach(pt => {
    if (pt.recommendedAction) {
      // Check if already dispatched
      const isDispatched = dispatchedActionIds.includes(pt.recommendedAction.id);
      allActions.push({
        ...pt.recommendedAction,
        status: isDispatched ? 'DISPATCHED' : pt.recommendedAction.status,
      });
    }
  });

  const filteredActions = allActions.filter(act => {
    if (filterPriority === 'CRITICAL' && act.priority !== 'CRITICAL') return false;
    if (filterPriority === 'HIGH' && act.priority !== 'CRITICAL' && act.priority !== 'HIGH') return false;
    if (filterType !== 'ALL' && act.type !== filterType) return false;
    return true;
  });

  const handleDispatch = (action: GridActionRecommendation) => {
    onExecuteAction(action);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10b981', '#06b6d4', '#f59e0b'],
    });
  };

  const getBadgeForType = (type: string) => {
    switch (type) {
      case 'BESS_CHARGE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            <span>BESS Bulk Charge</span>
          </span>
        );
      case 'BESS_DISCHARGE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 flex items-center space-x-1">
            <BatteryCharging className="w-3.5 h-3.5 text-cyan-400" />
            <span>BESS Peak Discharge</span>
          </span>
        );
      case 'CURTAILMENT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center space-x-1">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-400" />
            <span>Active Curtailment</span>
          </span>
        );
      case 'PEAKER_STARTUP':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center space-x-1">
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Peaker Fast-Start</span>
          </span>
        );
      case 'DEMAND_RESPONSE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center space-x-1">
            <Sliders className="w-3.5 h-3.5 text-purple-400" />
            <span>Demand Response</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
            Grid Action
          </span>
        );
    }
  };

  return (
    <div className="glass-panel p-6 sm:p-7 rounded-2xl border border-slate-800/90 shadow-2xl space-y-6 relative overflow-hidden">
      {/* Subtle top ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500/60 via-emerald-500/40 to-transparent"></div>

      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="text-base font-extrabold text-white tracking-tight flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Automated AI Grid Action Recommendation Engine</span>
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
              {allActions.length} Actions Flagged
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prescriptive mitigation directives generated from forecast delta, duck-curve ramp analysis, and transmission headroom.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 text-xs">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="border border-slate-700/80 rounded-lg px-3 py-1.5 bg-slate-900/90 font-medium text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
          >
            <option value="ALL" className="bg-slate-900">All Priorities</option>
            <option value="CRITICAL" className="bg-slate-900">Critical Only</option>
            <option value="HIGH" className="bg-slate-900">High + Critical</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-slate-700/80 rounded-lg px-3 py-1.5 bg-slate-900/90 font-medium text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer shadow-inner"
          >
            <option value="ALL" className="bg-slate-900">All Action Types</option>
            <option value="BESS_CHARGE" className="bg-slate-900">BESS Charge</option>
            <option value="BESS_DISCHARGE" className="bg-slate-900">BESS Discharge</option>
            <option value="CURTAILMENT" className="bg-slate-900">Curtailment</option>
            <option value="PEAKER_STARTUP" className="bg-slate-900">Peaker Startup</option>
            <option value="DEMAND_RESPONSE" className="bg-slate-900">Demand Response</option>
          </select>
        </div>
      </div>

      {/* Action Cards Grid */}
      {filteredActions.length === 0 ? (
        <div className="p-8 text-center text-slate-400 bg-slate-900/40 rounded-xl border border-dashed border-slate-800">
          <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
          <p className="font-semibold text-sm text-slate-200">No Imbalance Violations in this View</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Forecasted renewable generation matches scheduled grid baseline within standard operating margins.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {filteredActions.map((act) => {
            const isDispatched = act.status === 'DISPATCHED';

            return (
              <div
                key={act.id}
                className={`p-5 rounded-xl border transition-all duration-200 flex flex-col justify-between space-y-3.5 ${
                  isDispatched
                    ? 'bg-slate-900/40 border-emerald-500/40 shadow-xs'
                    : act.priority === 'CRITICAL'
                    ? 'bg-slate-900/70 border-rose-500/40 shadow-lg shadow-rose-950/20 hover:border-rose-400'
                    : 'bg-slate-900/70 border-slate-800 shadow-md hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Top Bar: Badges & Window */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className="flex items-center space-x-2">
                      {getBadgeForType(act.type)}
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded font-mono ${
                        act.priority === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}>
                        {act.priority}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs text-slate-300 font-mono font-bold bg-slate-950/80 border border-slate-800 px-2 py-0.5 rounded shadow-inner">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{act.targetHour} ({act.durationHrs}h Window)</span>
                    </div>
                  </div>

                  {/* Title & Target */}
                  <h4 className="font-extrabold text-sm text-white leading-snug">
                    {act.title}
                  </h4>
                  <div className="text-xs text-slate-400 mt-1">
                    Target: <strong className="text-slate-200 font-medium">{act.targetAssetName}</strong>
                  </div>

                  {/* Rationale */}
                  <p className="text-xs text-slate-300 mt-2.5 bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
                    {act.rationale}
                  </p>
                </div>

                {/* Impact Metrics & Execution Button */}
                <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center space-x-1 text-emerald-400 font-bold font-mono">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-400" />
                      <span>₹{(act.actionImpact.avoidedLossAmountINR || act.actionImpact.avoidedLossAmountUSD * 80).toLocaleString()} Value</span>
                    </span>
                    {act.actionImpact.co2SavedTons > 0 && (
                      <span className="flex items-center space-x-1 text-teal-400 font-medium font-mono">
                        <Leaf className="w-3.5 h-3.5 text-teal-400" />
                        <span>{act.actionImpact.co2SavedTons} t CO₂</span>
                      </span>
                    )}
                  </div>

                  {isDispatched ? (
                    <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-3 py-1.5 rounded-lg shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Dispatch Order Active</span>
                    </span>
                  ) : (
                    <button
                      id={`btn-dispatch-${act.id}`}
                      onClick={() => handleDispatch(act)}
                      className="flex items-center justify-center space-x-1.5 px-3.5 py-1.5 rounded-lg font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-md shadow-emerald-950/40 cursor-pointer"
                    >
                      <Send className="w-3 h-3 text-white" />
                      <span>Authorize Dispatch</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
