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
    <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200/90 shadow-sm space-y-6 sm:space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
              Renewable Fleet Portfolio &amp; Site-Level Parameter Catalog
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {TOTAL_FLEET_CAPACITY_MW} MW Total Connected
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Individual aerodynamic power curves, solar inverter clipping constraints, and integrated BESS storage.
          </p>
        </div>

        <button
          onClick={() => onSelectPlant('ALL')}
          className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition ${
            selectedPlantId === 'ALL'
              ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
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
              className={`p-4 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-3 ${
                isSelected
                  ? 'bg-emerald-50/50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-md'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div>
                {/* Top Type Badge & Active Status */}
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded flex items-center space-x-1 ${
                    plant.type === 'solar'
                      ? 'bg-amber-100 text-amber-800'
                      : plant.type === 'wind'
                      ? 'bg-cyan-100 text-cyan-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {isSolar && <Sun className="w-3 h-3 text-amber-600" />}
                    {isWind && <Wind className="w-3 h-3 text-cyan-600" />}
                    <span>{plant.type}</span>
                  </span>

                  <span className="flex items-center space-x-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>{plant.availabilityPct}% Online</span>
                  </span>
                </div>

                {/* Name & Location */}
                <h4 className="font-extrabold text-sm text-slate-900 leading-snug">
                  {plant.name}
                </h4>
                <p className="text-[11px] text-slate-500 flex items-center space-x-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{plant.location}</span>
                </p>

                {/* Hardware Technology */}
                <div className="mt-3 p-2 rounded-lg bg-slate-50 border border-slate-100 text-[11px] text-slate-600 space-y-1">
                  <div className="text-slate-800 font-semibold truncate">{plant.technology}</div>
                  {plant.trackerType && (
                    <div className="text-slate-500">Tracker: <strong>{plant.trackerType}</strong></div>
                  )}
                  {plant.turbineCount && (
                    <div className="text-slate-500">Turbines: <strong>{plant.turbineCount}x {plant.turbineModel?.split(' ')[0]}</strong></div>
                  )}
                  {plant.cutInSpeed && (
                    <div className="text-slate-500">Cut-In / Rated: <strong>{plant.cutInSpeed} / {plant.ratedSpeed} m/s</strong></div>
                  )}
                </div>
              </div>

              <div>
                {/* Generation Capacity */}
                <div className="flex items-baseline justify-between pt-2 border-t border-slate-100 text-xs">
                  <span className="text-slate-500 font-medium">Rated Capacity:</span>
                  <span className="text-sm font-black text-slate-900 font-mono">
                    {plant.capacityMW} MW
                  </span>
                </div>

                {/* Integrated BESS Battery SoC if available */}
                {plant.bessPowerMW && plant.bessCapacityMWh ? (
                  <div className="mt-2 text-xs space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-600 flex items-center space-x-1">
                        <BatteryCharging className="w-3 h-3 text-emerald-600" />
                        <span>BESS ({plant.bessPowerMW}MW / {plant.bessCapacityMWh}MWh)</span>
                      </span>
                      <span className="font-bold text-emerald-700 font-mono">
                        {plant.bessCurrentSoC}% SoC
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${plant.bessCurrentSoC}%` }}
                      ></div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-slate-400 italic">
                    No co-located battery storage
                  </div>
                )}

                <button
                  className={`mt-3 w-full py-1.5 rounded-lg text-xs font-bold transition text-center ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
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
