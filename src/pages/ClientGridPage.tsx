import { useAppStore } from '../store';
import { VehicleCard } from '../components/VehicleCard';

export const ClientGridPage = () => {
  const { vehicles, initializeConfigurator, setView } = useAppStore();

  return (
    <div className="h-full w-full overflow-y-auto bg-zinc-950 p-8 font-sans text-white md:p-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex items-end justify-between border-b border-white/10 pb-6">
          <div>
            <h1 className="mb-2 text-4xl font-light tracking-tight">Showroom</h1>
            <p className="text-zinc-400">Select a vehicle to begin configuration.</p>
          </div>
          <button onClick={() => setView('landing')} className="text-sm font-medium text-zinc-400 transition-colors hover:text-white">
            Exit
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} onSelect={initializeConfigurator} />
          ))}
        </div>
      </div>
    </div>
  );
};
