import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Filter, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { VehicleCard } from '../components/VehicleCard';
import { useAppStore } from '../store';

type CategoryFilter = 'all' | 'car' | 'bike' | 'other';
type SortOrder = 'featured' | 'price-asc' | 'price-desc' | 'newest';

const skeletonCards = Array.from({ length: 6 }, (_, index) => index);

export const ClientGridPage = () => {
  const { vehicles, initializeConfigurator } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('featured');
  const [visibleCount, setVisibleCount] = useState(6);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(vehicles[0]?.id ?? null);

  useEffect(() => {
    const timer = window.setTimeout(() => setIsLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setVisibleCount(6);
  }, [searchTerm, categoryFilter, sortOrder]);

  const categories = useMemo(() => {
    const values = vehicles.reduce<string[]>((accumulator, vehicle) => {
      const type = vehicle.type?.toLowerCase() ?? 'other';
      if (!accumulator.includes(type)) accumulator.push(type);
      return accumulator;
    }, []);

    return ['all', ...values];
  }, [vehicles]);

  const filteredVehicles = useMemo(() => {
    let list = [...vehicles];

    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      list = list.filter((vehicle) => `${vehicle.brand} ${vehicle.model} ${vehicle.type}`.toLowerCase().includes(query));
    }

    if (categoryFilter !== 'all') {
      list = list.filter((vehicle) => {
        const normalized = vehicle.type?.toLowerCase() ?? 'other';
        return normalized === categoryFilter;
      });
    }

    switch (sortOrder) {
      case 'price-asc':
        list.sort((left, right) => left.basePrice - right.basePrice);
        break;
      case 'price-desc':
        list.sort((left, right) => right.basePrice - left.basePrice);
        break;
      case 'newest':
        list.sort((left, right) => right.year - left.year);
        break;
      default:
        list.sort((left, right) => (left.id === selectedVehicleId ? -1 : right.id === selectedVehicleId ? 1 : 0));
        break;
    }

    return list;
  }, [categoryFilter, searchTerm, selectedVehicleId, sortOrder, vehicles]);

  const visibleVehicles = filteredVehicles.slice(0, visibleCount);
  const previewVehicle = filteredVehicles.find((vehicle) => vehicle.id === selectedVehicleId) ?? filteredVehicles[0] ?? vehicles[0] ?? null;
  const hasMore = visibleCount < filteredVehicles.length;
  const hasDataIssue = vehicles.some((vehicle) => !vehicle.brand || !vehicle.model || !vehicle.basePrice || !vehicle.type);

  useEffect(() => {
    if (selectedVehicleId && !filteredVehicles.some((vehicle) => vehicle.id === selectedVehicleId)) {
      setSelectedVehicleId(filteredVehicles[0]?.id ?? null);
    }
  }, [filteredVehicles, selectedVehicleId]);

  const handleConfigure = (vehicleId: string) => {
    setSelectedVehicleId(vehicleId);
    initializeConfigurator(vehicleId);
  };

  return (
    <div className="min-h-dvh w-full overflow-x-hidden overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),transparent_34%),linear-gradient(135deg,_#05070b_0%,_#090b11_55%,_#020304_100%)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-white sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="overflow-hidden rounded-[28px] border border-white/15 bg-black/45 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_24px_rgba(56,189,248,0.12)] backdrop-blur-2xl sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.35em] text-sky-300">
                <Sparkles size={14} /> Configurator showroom
              </div>
              <h1 className="max-w-3xl text-4xl font-light tracking-tight text-white sm:text-5xl">
                Discover the next build, then launch the configurator in one fluid motion.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
                Explore the current fleet, compare each specification, and transition into the premium build studio without losing the same cinematic identity.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleConfigure(previewVehicle?.id ?? vehicles[0]?.id ?? '')}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-all hover:bg-zinc-200"
                >
                  Configure now <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => previewVehicle && handleConfigure(previewVehicle.id)}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-white/10"
                >
                  Preview build <Sparkles size={16} />
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/15 bg-black/60 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_24px_rgba(56,189,248,0.12)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-zinc-500">Featured focus</p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{previewVehicle ? `${previewVehicle.brand} ${previewVehicle.model}` : 'Select a vehicle'}</h2>
                </div>
                <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-zinc-300">
                  {previewVehicle?.year ?? '—'}
                </div>
              </div>
              <div className="rounded-[20px] border border-white/10 bg-white/5 p-3">
                <div className="mb-3 h-36 rounded-[16px] bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.28),transparent_55%),linear-gradient(135deg,_rgba(30,41,59,0.95),rgba(2,6,23,1))]" />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-zinc-400">Starting from</p>
                    <p className="text-lg font-semibold text-white">{previewVehicle ? <span>{previewVehicle.basePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span> : '—'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => previewVehicle && handleConfigure(previewVehicle.id)}
                    className="rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-2 text-sm font-medium text-sky-300 transition-colors hover:bg-sky-400/20"
                  >
                    Open builder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        <section className="rounded-[24px] border border-white/15 bg-black/45 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_24px_rgba(56,189,248,0.08)] backdrop-blur-xl sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <label htmlFor="vehicle-search" className="mb-2 block text-sm font-semibold text-zinc-400">
                Search vehicles
              </label>
              <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-3 shadow-sm">
                <Search size={18} className="text-zinc-500" />
                <input
                  id="vehicle-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by brand, model, or category"
                  className="w-full bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
                />
                {searchTerm ? (
                  <button type="button" onClick={() => setSearchTerm('')} className="rounded-full p-1 text-zinc-500 transition-colors hover:bg-white/10 hover:text-white" aria-label="Clear search">
                    <X size={16} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
                <Filter size={16} />
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)} className="bg-transparent font-medium outline-none">
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300">
                <SlidersHorizontal size={16} />
                <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} className="bg-transparent font-medium outline-none">
                  <option value="featured">Featured</option>
                  <option value="price-asc">Price: Low to high</option>
                  <option value="price-desc">Price: High to low</option>
                  <option value="newest">Newest</option>
                </select>
              </label>
            </div>
          </div>
        </section>

        <div className="flex items-center justify-between px-1">
          <p className="text-sm text-zinc-400">
            {isLoading ? 'Preparing the showroom…' : `${filteredVehicles.length} vehicle${filteredVehicles.length === 1 ? '' : 's'} available`}
          </p>
          <p className="text-sm text-zinc-500">Responsive across mobile, tablet, and desktop</p>
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {skeletonCards.map((index) => (
              <div key={index} className="animate-pulse overflow-hidden rounded-[24px] border border-white/10 bg-black/50 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
                <div className="h-48 bg-zinc-800/90" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-24 rounded-full bg-zinc-800" />
                  <div className="h-5 w-2/3 rounded-full bg-zinc-800" />
                  <div className="h-3 w-full rounded-full bg-zinc-800" />
                  <div className="h-3 w-4/5 rounded-full bg-zinc-800" />
                </div>
              </div>
            ))}
          </div>
        ) : hasDataIssue ? (
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-amber-400/20 bg-amber-400/10 px-6 py-16 text-center text-amber-200 shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <AlertCircle size={24} className="mb-3" />
            <h3 className="text-xl font-semibold">The showroom is temporarily unavailable</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-amber-300">
              A vehicle entry is missing expected data. Please refresh or return once the inventory is available.
            </p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-white/10 bg-black/45 px-6 py-16 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.03)]">
            <div className="mb-4 rounded-full border border-sky-400/20 bg-sky-400/10 p-3 text-sky-300">
              <Search size={20} />
            </div>
            <h3 className="text-xl font-semibold">No vehicles match your filters</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-zinc-400">
              Try widening the search or switching filters to see more vehicles in the showroom.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setSortOrder('featured');
              }}
              className="mt-6 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {visibleVehicles.map((vehicle, index) => (
                <VehicleCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onSelect={handleConfigure}
                  onQuickView={(vehicleId) => setSelectedVehicleId(vehicleId)}
                  onConfigure={handleConfigure}
                  index={index}
                  variant="showroom"
                  previewActive={previewVehicle?.id === vehicle.id}
                />
              ))}
            </div>

            {hasMore ? (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((current) => current + 4)}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-white/10"
                >
                  Load more <ArrowRight size={16} />
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
