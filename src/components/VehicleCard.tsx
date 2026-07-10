import { ChevronRight, CarFront } from 'lucide-react';
import { FormattedPrice } from './FormattedPrice';
import type { Vehicle } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect: (vehicleId: string) => void;
}

export const VehicleCard = ({ vehicle, onSelect }: VehicleCardProps) => (
  <div
    onClick={() => onSelect(vehicle.id)}
    className="group cursor-pointer overflow-hidden rounded-2xl border border-white/5 bg-zinc-900 shadow-lg transition-all hover:-translate-y-1 hover:border-white/20 hover:shadow-2xl"
  >
    <div className="relative flex h-48 items-center justify-center bg-gradient-to-br from-zinc-800 to-black">
      <CarFront size={64} className="text-zinc-700 transition-colors group-hover:text-zinc-500" />
      {vehicle.url && (
        <div className="absolute right-4 top-4 rounded border border-blue-500/30 bg-blue-500/20 px-2 py-1 text-[10px] font-bold text-blue-400">
          Custom 3D Model
        </div>
      )}
    </div>
    <div className="p-6">
      <div className="mb-1 text-xs uppercase tracking-widest text-zinc-500">{vehicle.brand}</div>
      <h3 className="mb-4 text-2xl font-light text-zinc-200 transition-colors group-hover:text-white">{vehicle.model}</h3>
      <div className="flex items-center justify-between text-sm font-medium">
        <span className="text-zinc-400">
          From <span className="text-white"><FormattedPrice price={vehicle.basePrice} /></span>
        </span>
        <span className="flex items-center gap-1 text-white transition-transform group-hover:translate-x-1">
          Configure <ChevronRight size={16} />
        </span>
      </div>
    </div>
  </div>
);
