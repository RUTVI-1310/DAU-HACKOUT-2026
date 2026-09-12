import React from 'react';
import { 
  Layers, 
  Sun, 
  Wind, 
  BatteryCharging, 
  Compass, 
  CheckCircle, 
  MapPin, 
  Cpu, 
  Activity 
} from 'lucide-react';
import { FLEET_PLANTS, TOTAL_FLEET_CAPACITY_MW } from '../data/plants';
import { Plant } from '../types';

interface PlantPortfolioViewProps {
  selectedPlantId: string;
  onSelectPlant: (plantId: string) => void;
}

export const PlantPortfolioView: React.FC<PlantPortfolioViewProps> = ({
  selectedPlantId,
  onSelectPlant,
}) => {
  return (
    <div className="glass-panel p-6 sm:p-8 rounded-2xl border border-slate-800/90 shadow-2xl space-y-6 sm:space-y-7 relative overflow-hidden">
      {/* Top subtle ambient glow */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500/60 via-emerald-500/40 to-transparent"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="text-base font-extrabold text-white tracking-tight flex items-center space-x-2">
              <Layers className="w-5 h-5 text-purple-400" />
              <span>Renewable Fleet Portfolio &amp; Site-Level Parameter Catalog</span>
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
              {TOTAL_FLEET_CAPACITY_MW} MW Total Connected
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Individual aerodynamic power curves, solar inverter clipping constraints, and integrated BESS storage.
          </p>
        </div>

        <button
          onClick={() => onSelectPlant('ALL')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition cursor-pointer ${
            selectedPlantId === 'ALL'
              ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-950/40'
              : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800 hover:text-white'
          }`}
        >
          View Aggregate Fleet
        </button>
      </div>

      {/* Plant Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
        {FLEET_PLANTS.map((plant) => {
          const isSelected = selectedPlantId === plant.id;
          const isSolar = plant.type === 'solar' || plant.type === 'hybrid';
          const isWind = plant.type === 'wind';

          return (
            <div
              key={plant.id}
              onClick={() => onSelectPlant(plant.id)}
              className={`p-4.5 rounded-xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-3.5 ${
                isSelected
                  ? 'bg-slate-900 border-emerald-500/80 ring-2 ring-emerald-500/30 shadow-xl shadow-emerald-950/30'
                  : 'glass-panel glass-panel-hover border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                {/* Top Type Badge & Active Status */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded flex items-center space-x-1 font-mono ${
                    plant.type === 'solar'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : plant.type === 'wind'
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {isSolar && <Sun className="w-3 h-3 text-amber-400" />}
                    {isWind && <Wind className="w-3 h-3 text-cyan-400" />}
                    <span>{plant.type}</span>
                  </span>

                  <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>{plant.availabilityPct}% Online</span>
                  </span>
                </div>

                {/* Name & Location */}
                <h4 className="font-extrabold text-sm text-white leading-snug">
                  {plant.name}
                </h4>
                <p className="text-[11px] text-slate-400 flex items-center space-x-1 mt-0.5 font-medium">
                  <MapPin className="w-3 h-3 text-slate-500" />
                  <span>{plant.location}</span>
                </p>

                {/* Hardware Technology */}
                <div className="mt-3 p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div className="text-white font-semibold truncate">{plant.technology}</div>
                  {plant.trackerType && (
                    <div className="text-slate-400">Tracker: <strong className="text-slate-200">{plant.trackerType}</strong></div>
                  )}
                  {plant.turbineCount && (
                    <div className="text-slate-400">Turbines: <strong className="text-slate-200">{plant.turbineCount}x {plant.turbineModel?.split(' ')[0]}</strong></div>
                  )}
                  {plant.cutInSpeed && (
                    <div className="text-slate-400">Cut-In / Rated: <strong className="text-slate-200 font-mono">{plant.cutInSpeed} / {plant.ratedSpeed} m/s</strong></div>
                  )}
                </div>
              </div>

              <div>
                {/* Generation Capacity */}
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-800 text-xs">
                  <span className="text-slate-400 font-medium">Rated Capacity:</span>
                  <span className="text-sm font-black text-white font-mono">
                    {plant.capacityMW} MW
                  </span>
                </div>

                {/* Integrated BESS Battery SoC if available */}
                {plant.bessPowerMW && plant.bessCapacityMWh ? (
                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 flex items-center space-x-1">
                        <BatteryCharging className="w-3 h-3 text-emerald-400" />
                        <span>BESS ({plant.bessPowerMW}MW / {plant.bessCapacityMWh}MWh)</span>
                      </span>
                      <span className="font-bold text-emerald-400 font-mono">
                        {plant.bessCurrentSoC}% SoC
                      </span>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${plant.bessCurrentSoC}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-slate-500 italic">
                    No co-located battery storage
                  </div>
                )}

                <button
                  className={`mt-3 w-full py-1.5 rounded-lg text-xs font-bold transition text-center cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm'
                      : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700/80'
                  }`}
                >
                  {isSelected ? 'Active Target Site' : 'Focus Site Forecast'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
