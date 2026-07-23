import { motion } from 'framer-motion';
import { CarFront, ChevronRight, Eye, Sparkles } from 'lucide-react';
import { FormattedPrice } from './FormattedPrice';
import type { Vehicle } from '../types';

interface VehicleCardProps {
  vehicle: Vehicle;
  onSelect: (vehicleId: string) => void;
  onQuickView?: (vehicleId: string) => void;
  onConfigure?: (vehicleId: string) => void;
  index?: number;
  variant?: 'ring' | 'list' | 'showroom';
  previewActive?: boolean;
}

const buildVehicleImage = (vehicle: Vehicle) => {
  const accent = vehicle.brand.toLowerCase().includes('aero') ? '#38bdf8' : vehicle.brand.toLowerCase().includes('porsche') ? '#f59e0b' : '#818cf8';
  const svg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 420">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#09090b" />
        <stop offset="55%" stop-color="#111827" />
        <stop offset="100%" stop-color="#030712" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" rx="32" fill="url(#g)" />
    <circle cx="160" cy="140" r="120" fill="rgba(255,255,255,0.08)" />
    <circle cx="480" cy="112" r="96" fill="rgba(255,255,255,0.06)" />
    <path d="M158 188h292c24 0 45 11 58 29l34 50c8 12 13 26 13 40v18c0 18-14 32-32 32h-36c-22 0-41-15-47-36l-5-19h-48l-11 29c-6 16-22 27-39 27h-86c-17 0-33-11-39-27l-11-29h-48l-5 19c-6 21-25 36-47 36h-36c-18 0-32-14-32-32v-17c0-15 5-29 13-40l34-50c13-18 34-29 58-29z" fill="${accent}" opacity="0.92" />
    <rect x="196" y="208" width="112" height="42" rx="18" fill="#f8fafc" opacity="0.92" />
    <rect x="332" y="208" width="96" height="42" rx="18" fill="#f8fafc" opacity="0.92" />
    <circle cx="234" cy="280" r="34" fill="#020617" />
    <circle cx="406" cy="280" r="34" fill="#020617" />
    <circle cx="234" cy="280" r="18" fill="#f8fafc" opacity="0.75" />
    <circle cx="406" cy="280" r="18" fill="#f8fafc" opacity="0.75" />
    <path d="M142 182h136" stroke="#f8fafc" stroke-width="8" stroke-linecap="round" opacity="0.6" />
    <text x="48%" y="86%" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="28" fill="#f8fafc" opacity="0.88">${vehicle.brand} ${vehicle.model}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const VehicleCard = ({ vehicle, onSelect, onQuickView, onConfigure, index = 0, variant = 'ring', previewActive = false }: VehicleCardProps) => {
  const imageSrc = buildVehicleImage(vehicle);
  const status = index === 0 ? 'Featured' : index === 1 ? 'New' : 'Available';

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

  if (variant === 'showroom') {
    return (
      <motion.article
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.32, delay: index * 0.06 }}
        className={`group overflow-hidden rounded-[24px] border bg-black/70 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_24px_rgba(56,189,248,0.12)] backdrop-blur-xl transition-all duration-300 ${previewActive ? 'border-sky-400/40' : 'border-white/10'}`}
      >
        <button
          type="button"
          onClick={() => onSelect(vehicle.id)}
          aria-label={`Open ${vehicle.brand} ${vehicle.model} configurator`}
          className="flex w-full flex-col text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
        >
          <div className="relative overflow-hidden p-3">
            <img src={imageSrc} alt={`${vehicle.brand} ${vehicle.model}`} loading="lazy" className="h-48 w-full rounded-[18px] object-cover transition-transform duration-500 group-hover:scale-[1.03]" />
            <div className="absolute inset-x-3 top-3 flex items-start justify-between">
              <span className="rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-200 backdrop-blur">
                {status}
              </span>
              {vehicle.url && (
                <span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-sky-300">
                  3D Ready
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-1 flex-col p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.35em] text-zinc-500">{vehicle.type}</p>
                <h3 className="mt-1 text-xl font-semibold text-white">{vehicle.brand} {vehicle.model}</h3>
              </div>
              <div className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-zinc-300">
                {vehicle.year}
              </div>
            </div>

            <p className="min-h-[48px] text-sm leading-6 text-zinc-400">
              {vehicle.brand} craftsmanship paired with immersive configuration controls and tailored finishes.
            </p>

            <div className="mt-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-500">Starting from</p>
                <div className="mt-1 text-lg font-semibold text-white"><FormattedPrice price={vehicle.basePrice} /></div>
              </div>
              <div className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm font-medium text-zinc-300">
                <Sparkles size={14} /> Premium
              </div>
            </div>
          </div>
        </button>

        <div className="flex flex-wrap gap-2 border-t border-white/10 bg-white/5 p-4">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onQuickView?.(vehicle.id);
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-sky-400/40 hover:text-white"
          >
            <Eye size={16} /> Quick View
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onConfigure?.(vehicle.id);
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
          >
            <CarFront size={16} /> Configure Now
          </button>
        </div>
      </motion.article>
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
