import { motion } from 'framer-motion';
import { AlertCircle, ArrowRight, Filter, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
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

  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (!selectedVehicleId) return;
    const el = itemRefs.current[selectedVehicleId];
    if (el && typeof el.scrollIntoView === 'function') {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedVehicleId, visibleVehicles]);

  return (
    <div className="h-full w-full overflow-x-hidden overflow-y-auto bg-[linear-gradient(180deg,#f8fafe_0%,#eef3fc_45%,#e2e9f8_100%)] p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))] text-slate-900 sm:p-6 lg:p-8">
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-0 h-[520px]" style={{ background: 'radial-gradient(50% 45% at 50% 0%, rgba(59,130,246,0.14) 0%, rgba(59,130,246,0) 70%)' }} />
      <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 2xl:max-w-[110rem]">
        <motion.header
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="glass-panel-strong overflow-hidden rounded-[28px] p-5 shadow-[0_20px_50px_-25px_rgba(37,99,235,0.35)] sm:p-8"
        >
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600">
                <Sparkles size={14} /> Configurator showroom
              </div>
              <h1 className="font-display max-w-3xl text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl 2xl:text-6xl">
                Discover the next build, then launch the configurator in one fluid motion.
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-500 sm:text-lg">
                Explore the current fleet, compare each specification, and transition into the premium build studio without losing the same cinematic identity.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => handleConfigure(previewVehicle?.id ?? vehicles[0]?.id ?? '')}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-10px_rgba(37,99,235,0.65)] transition-all hover:bg-blue-500 active:scale-[0.98]"
                >
                  Configure now <ArrowRight size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => previewVehicle && handleConfigure(previewVehicle.id)}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:border-blue-200 hover:text-blue-600 active:scale-[0.98]"
                >
                  Preview build <Sparkles size={16} />
                </button>
              </div>
            </div>

            <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_20px_45px_-25px_rgba(37,99,235,0.3)]">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-400">Featured focus</p>
                  <h2 className="font-display mt-1 text-xl font-semibold text-slate-900">{previewVehicle ? `${previewVehicle.brand} ${previewVehicle.model}` : 'Select a vehicle'}</h2>
                </div>
                <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-500">
                  {previewVehicle?.year ?? '—'}
                </div>
              </div>
              <div className="rounded-[20px] border border-slate-200 bg-slate-50 p-3">
                <div className="mb-3 h-36 overflow-hidden rounded-[16px] bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),transparent_65%),linear-gradient(135deg,#eef3fc,#dbe6fb)]">
                  {previewVehicle?.thumbnailUrl ? (
                    <img src={previewVehicle.thumbnailUrl} alt={`${previewVehicle.brand} ${previewVehicle.model}`} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-slate-500">Starting from</p>
                    <p className="font-display text-lg font-semibold text-slate-900">{previewVehicle ? <span>{previewVehicle.basePrice.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}</span> : '—'}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => previewVehicle && handleConfigure(previewVehicle.id)}
                    className="rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-600 transition-all hover:bg-blue-100 active:scale-[0.98]"
                  >
                    Open builder
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.header>

        <section className="glass-panel rounded-[24px] p-4 shadow-[0_15px_40px_-25px_rgba(37,99,235,0.25)] sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex-1">
              <label htmlFor="vehicle-search" className="mb-2 block text-sm font-medium text-slate-500">
                Search vehicles
              </label>
              <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm">
                <Search size={18} className="text-slate-400" />
                <input
                  id="vehicle-search"
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Search by brand, model, or category"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                />
                {searchTerm ? (
                  <button type="button" onClick={() => setSearchTerm('')} className="rounded-full p-1 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600" aria-label="Clear search">
                    <X size={16} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                <Filter size={16} className="text-slate-400" />
                <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value as CategoryFilter)} className="bg-transparent font-medium outline-none">
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category === 'all' ? 'All categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600">
                <SlidersHorizontal size={16} className="text-slate-400" />
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
          <p className="text-sm text-slate-500">
            {isLoading ? 'Preparing the showroom…' : `${filteredVehicles.length} vehicle${filteredVehicles.length === 1 ? '' : 's'} available`}
          </p>
          <p className="hidden text-sm text-slate-400 sm:block">Responsive across mobile, tablet, and desktop</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-5">
            {skeletonCards.map((index) => (
              <div key={index} className="animate-pulse overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_12px_30px_-20px_rgba(37,99,235,0.2)]">
                <div className="h-48 bg-slate-100" />
                <div className="space-y-3 p-5">
                  <div className="h-3 w-24 rounded-full bg-slate-100" />
                  <div className="h-5 w-2/3 rounded-full bg-slate-100" />
                  <div className="h-3 w-full rounded-full bg-slate-100" />
                  <div className="h-3 w-4/5 rounded-full bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : hasDataIssue ? (
          <div className="flex flex-col items-center justify-center rounded-[24px] border border-amber-200 bg-amber-50 px-6 py-16 text-center text-amber-700 shadow-[0_12px_30px_-20px_rgba(217,119,6,0.25)]">
            <AlertCircle size={24} className="mb-3" />
            <h3 className="text-xl font-semibold">The showroom is temporarily unavailable</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-amber-600">
              A vehicle entry is missing expected data. Please refresh or return once the inventory is available.
            </p>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="glass-panel flex flex-col items-center justify-center rounded-[24px] px-6 py-16 text-center shadow-[0_12px_30px_-20px_rgba(37,99,235,0.25)]">
            <div className="mb-4 rounded-full border border-blue-100 bg-blue-50 p-3 text-blue-600">
              <Search size={20} />
            </div>
            <h3 className="text-xl font-semibold text-slate-900">No vehicles match your filters</h3>
            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
              Try widening the search or switching filters to see more vehicles in the showroom.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('all');
                setSortOrder('featured');
              }}
              className="mt-6 rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(37,99,235,0.6)] transition-all hover:bg-blue-500 active:scale-[0.98]"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-5">
              {visibleVehicles.map((vehicle, index) => (
                <div key={vehicle.id} ref={(el) => (itemRefs.current[vehicle.id] = el)} className="transition-transform will-change-transform">
                  <VehicleCard
                    vehicle={vehicle}
                    onSelect={handleConfigure}
                    onQuickView={(vehicleId) => setSelectedVehicleId(vehicleId)}
                    onConfigure={handleConfigure}
                    index={index}
                    variant="showroom"
                    previewActive={previewVehicle?.id === vehicle.id}
                  />
                </div>
              ))}
            </div>

            {hasMore ? (
              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((current) => current + 4)}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 shadow-sm transition-all hover:border-blue-200 hover:text-blue-600 active:scale-[0.98]"
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
