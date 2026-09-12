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
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 flex items-center space-x-1">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-600" />
            <span>BESS Bulk Charge</span>
          </span>
        );
      case 'BESS_DISCHARGE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-cyan-100 text-cyan-800 flex items-center space-x-1">
            <BatteryCharging className="w-3.5 h-3.5 text-cyan-600" />
            <span>BESS Peak Discharge</span>
          </span>
        );
      case 'CURTAILMENT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 flex items-center space-x-1">
            <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
            <span>Active Curtailment</span>
          </span>
        );
      case 'PEAKER_STARTUP':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 flex items-center space-x-1">
            <Flame className="w-3.5 h-3.5 text-rose-600" />
            <span>Peaker Fast-Start</span>
          </span>
        );
      case 'DEMAND_RESPONSE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 flex items-center space-x-1">
            <Sliders className="w-3.5 h-3.5 text-purple-600" />
            <span>Demand Response</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            Grid Action
          </span>
        );
    }
  };

  return (
    <div className="bg-white p-6 sm:p-7 rounded-2xl border border-slate-200/90 shadow-sm space-y-6">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Automated AI Grid Action Recommendation Engine
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {allActions.length} Actions Flagged
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Prescriptive mitigation directives generated from forecast delta, duck-curve ramp analysis, and transmission headroom.
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 text-xs">
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as any)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="CRITICAL">Critical Only</option>
            <option value="HIGH">High + Critical</option>
          </select>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Action Types</option>
            <option value="BESS_CHARGE">BESS Charge</option>
            <option value="BESS_DISCHARGE">BESS Discharge</option>
            <option value="CURTAILMENT">Curtailment</option>
            <option value="PEAKER_STARTUP">Peaker Startup</option>
            <option value="DEMAND_RESPONSE">Demand Response</option>
          </select>
        </div>
      </div>

      {/* Action Cards Grid */}
      {filteredActions.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="font-semibold text-sm text-slate-800">No Imbalance Violations in this View</p>
          <p className="text-xs text-slate-500 mt-0.5">
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
                className={`p-4 rounded-xl border transition flex flex-col justify-between space-y-3 ${
                  isDispatched
                    ? 'bg-slate-50 border-emerald-300 opacity-90'
                    : act.priority === 'CRITICAL'
                    ? 'bg-white border-rose-300 shadow-sm hover:border-rose-400'
                    : 'bg-white border-slate-200 shadow-sm hover:border-slate-300'
                }`}
              >
                <div>
                  {/* Top Bar: Badges & Window */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      {getBadgeForType(act.type)}
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                        act.priority === 'CRITICAL'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {act.priority}
                      </span>
                    </div>

                    <div className="flex items-center space-x-1 text-xs text-slate-600 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>{act.targetHour} ({act.durationHrs}h Window)</span>
                    </div>
                  </div>

                  {/* Title & Target */}
                  <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                    {act.title}
                  </h4>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Target: <strong className="text-slate-700">{act.targetAssetName}</strong>
                  </div>

                  {/* Rationale */}
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                    {act.rationale}
                  </p>
                </div>

                {/* Impact Metrics & Execution Button */}
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 text-xs text-slate-600">
                    <span className="flex items-center space-x-1 text-emerald-700 font-bold">
                      <IndianRupee className="w-3.5 h-3.5 text-emerald-600" />
                      <span>₹{(act.actionImpact.avoidedLossAmountINR || act.actionImpact.avoidedLossAmountUSD * 80).toLocaleString()} Value</span>
                    </span>
                    {act.actionImpact.co2SavedTons > 0 && (
                      <span className="flex items-center space-x-1 text-teal-700 font-medium">
                        <Leaf className="w-3.5 h-3.5 text-teal-600" />
                        <span>{act.actionImpact.co2SavedTons} t CO₂</span>
                      </span>
                    )}
                  </div>

                  {isDispatched ? (
                    <span className="flex items-center space-x-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Dispatch Order Active</span>
                    </span>
                  ) : (
                    <button
                      id={`btn-dispatch-${act.id}`}
                      onClick={() => handleDispatch(act)}
                      className="flex items-center justify-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 transition shadow-sm"
                    >
                      <Send className="w-3 h-3 text-emerald-400" />
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
