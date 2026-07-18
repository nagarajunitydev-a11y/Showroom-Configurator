import { motion } from 'framer-motion';
import { CarFront, ChevronRight } from 'lucide-react';
import { FormattedPrice } from './FormattedPrice';
import type { Vehicle } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect: (vehicleId: string) => void;
  index?: number;
  variant?: 'ring' | 'list';
}

export const VehicleCard = ({ vehicle, onSelect, index = 0, variant = 'ring' }: VehicleCardProps) => {
  if (variant === 'list') {
    return (
      <motion.button
        type="button"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.06 }}
        onClick={() => onSelect(vehicle.id)}
        aria-label={`Open ${vehicle.brand} ${vehicle.model} configurator`}
        className="group flex min-h-[88px] w-full items-center gap-4 rounded-2xl border border-white/10 bg-zinc-900/90 p-4 text-left shadow-lg transition-all hover:border-sky-400/30 hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/40 text-zinc-200">
          <CarFront size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.35em] text-zinc-500">{vehicle.brand}</div>
          <h3 className="truncate text-lg font-semibold text-zinc-100">{vehicle.model}</h3>
          <div className="mt-1 text-sm text-zinc-400">
            From <span className="text-white"><FormattedPrice price={vehicle.basePrice} /></span>
          </div>
        </div>
        {vehicle.url && (
          <span className="hidden shrink-0 rounded-full border border-sky-400/30 bg-sky-400/15 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-sky-300 sm:inline">
            3D
          </span>
        )}
        <ChevronRight size={18} className="shrink-0 text-zinc-500 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
      </motion.button>
    );
  }

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.08 }}
      onClick={() => onSelect(vehicle.id)}
      aria-label={`Open ${vehicle.brand} ${vehicle.model} configurator`}
      className="group relative flex aspect-square w-[130px] flex-col items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.14),transparent_45%),linear-gradient(135deg,rgba(24,24,27,0.95),rgba(9,9,11,1))] p-3 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_18px_60px_rgba(0,0,0,0.35)] transition-all duration-300 hover:-translate-y-2 hover:scale-105 hover:border-sky-400/40 hover:shadow-[0_0_0_1px_rgba(56,189,248,0.25),0_22px_80px_rgba(14,116,144,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black sm:w-[160px] sm:p-4"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),transparent_55%)]" />
      {vehicle.url && (
        <span className="absolute right-3 top-3 rounded-full border border-sky-400/30 bg-sky-400/15 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-sky-300">
          3D
        </span>
      )}
      <div className="relative mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-black/40 text-zinc-200 sm:h-14 sm:w-14">
        <CarFront size={24} className="transition-transform duration-300 group-hover:rotate-[-8deg] sm:size-[28px]" />
      </div>
      <span className="relative text-[10px] uppercase tracking-[0.35em] text-zinc-500">{vehicle.brand}</span>
      <h3 className="relative mt-1 max-w-[90px] text-sm font-semibold leading-tight text-zinc-100 sm:max-w-[110px] sm:text-base">{vehicle.model}</h3>
      <span className="relative mt-2 rounded-full border border-white/10 bg-white/10 px-2 py-1 text-[10px] font-medium text-zinc-300">
        From <FormattedPrice price={vehicle.basePrice} />
      </span>
      <div className="pointer-events-none absolute inset-3 rounded-full border border-white/10 opacity-70 transition group-hover:border-sky-400/40" />
    </motion.button>
  );
};
