import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useAppStore } from '../store';
import { VehicleCard } from '../components/VehicleCard';
import { useBreakpoint } from '../hooks/useBreakpoint';

const ringPositions = [
  { top: '8%', left: '50%', transform: 'translateX(-50%)' },
  { top: '30%', left: '10%' },
  { top: '30%', left: '90%', transform: 'translateX(-100%)' },
  { top: '72%', left: '18%' },
  { top: '72%', left: '82%', transform: 'translateX(-100%)' },
];

export const ClientGridPage = () => {
  const { vehicles, initializeConfigurator, setView } = useAppStore();
  const { isMobile } = useBreakpoint();
  const visibleVehicles = vehicles.slice(0, 5);

  if (isMobile) {
    return (
      <div className="min-h-dvh w-full overflow-y-auto touch-scroll bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),transparent_38%),linear-gradient(135deg,_#05070b_0%,_#090b11_55%,_#020304_100%)] p-4 pb-safe pt-safe font-sans text-white">
        <header className="mb-6 rounded-[1.5rem] border border-white/10 bg-black/30 px-4 py-4 backdrop-blur-xl">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Immersive showroom</p>
          <h1 className="text-2xl font-light tracking-tight">Choose your signature ride</h1>
          <p className="mt-2 text-sm text-zinc-400">Select a vehicle to open the configuration studio.</p>
          <button
            type="button"
            onClick={() => setView('landing')}
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            Back home
          </button>
        </header>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {vehicles.map((vehicle, index) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} onSelect={initializeConfigurator} index={index} variant="list" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh w-full overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),transparent_38%),linear-gradient(135deg,_#05070b_0%,_#090b11_55%,_#020304_100%)] p-4 font-sans text-white sm:p-6 lg:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(255,255,255,0.09),transparent_30%)]" />

      <div className="relative z-10 mx-auto flex min-h-dvh max-w-7xl flex-col">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-black/30 px-5 py-5 backdrop-blur-xl sm:flex-row sm:items-end sm:justify-between sm:px-7">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.35em] text-sky-300">Immersive showroom</p>
            <h1 className="text-3xl font-light tracking-tight sm:text-4xl">Choose your signature ride</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400 sm:text-base">
              Select a vehicle to open the configuration studio and sculpt the final spec in a more intuitive circular experience.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setView('landing')}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
          >
            Back home
          </button>
        </header>

        <main className="flex flex-1 items-center justify-center">
          <div className="relative flex w-full max-w-5xl items-center justify-center py-8 lg:min-h-[620px] lg:py-10">
            <div className="absolute inset-0 rounded-[3rem] border border-white/10" />
            <div className="absolute inset-[8%] rounded-[3rem] border border-white/10" />
            <div className="absolute inset-[20%] rounded-[3rem] border border-white/10" />

            {visibleVehicles.map((vehicle, index) => {
              const position = ringPositions[index] ?? ringPositions[index % ringPositions.length];
              return (
                <div key={vehicle.id} className="absolute z-20" style={position}>
                  <VehicleCard vehicle={vehicle} onSelect={initializeConfigurator} index={index} variant="ring" />
                </div>
              );
            })}

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="relative z-10 flex max-w-sm flex-col items-center rounded-[2rem] border border-white/10 bg-black/45 px-6 py-8 text-center shadow-2xl backdrop-blur-xl sm:px-8"
            >
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-sky-400/20 bg-sky-400/10 text-sky-300">
                <Sparkles size={22} />
              </div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.35em] text-sky-300">Adaptive portal</p>
              <h2 className="mb-3 text-2xl font-light sm:text-3xl">Tap a halo to begin</h2>
              <p className="text-sm leading-6 text-zinc-400">
                Each orbit represents a vehicle. Choose one to launch the builder and refine paint, wheels, and finishes with a calmer, more guided experience.
              </p>
              <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-200">
                Responsive across all screens <ArrowRight size={16} />
              </div>
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
};
