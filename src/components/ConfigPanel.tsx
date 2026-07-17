import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Palette, CircleDot, Package, Settings2, Check, Camera as CameraIcon, Undo2, Redo2, ArrowLeft, ChevronRight, Info, Maximize2, Minimize2 } from 'lucide-react';
import { FormattedPrice } from './FormattedPrice';
import { formatPrice } from '../utils/price';
import { MATERIAL_TYPES, type Vehicle } from '../types';
import { useAppStore } from '../store';

interface ConfigPanelProps {
  vehicle: Vehicle;
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export const ConfigPanel = ({ vehicle, activeCategory, onCategoryChange }: ConfigPanelProps) => {
  const {
    selections,
    selectOption,
    getTotalPrice,
    history,
    historyIndex,
    undo,
    redo,
    setCameraPreset,
    activeCameraPreset,
    setView,
  } = useAppStore();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const currentCategoryData = vehicle.categories.find((category) => category.id === activeCategory);
  const icons: Record<string, JSX.Element> = { Palette: <Palette size={20} />, CircleDot: <CircleDot size={20} />, Package: <Package size={20} /> };
  const selectedOptions = vehicle.categories.map((category) => ({
    category,
    option: category.options.find((option) => option.id === selections[category.id]),
  }));
  const totalPrice = getTotalPrice();

  if (!isExpanded) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-center p-3 md:justify-end md:pr-6 md:pb-6">
        <div className="pointer-events-auto flex w-full max-w-xl items-center justify-between rounded-full border border-white/10 bg-black/75 px-4 py-3 backdrop-blur-xl">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">{vehicle.brand}</div>
            <div className="text-sm font-medium">{vehicle.model}</div>
          </div>
          <button onClick={() => setIsExpanded(true)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white shadow-[0_0_12px_rgba(56,189,248,0.1)] transition-all hover:bg-white/10" title="Expand panels">
            <Maximize2 size={18} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between font-sans text-white">
      <header className="pointer-events-auto mx-3 mt-3 flex w-auto flex-col gap-3 rounded-[24px] border border-white/15 bg-black/50 px-3 py-2 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_24px_rgba(56,189,248,0.12)] backdrop-blur-xl sm:mx-4 sm:px-4 sm:py-2.5 md:mx-6 md:flex-row md:items-start md:justify-between md:px-5 md:py-4">
        <div className="flex flex-col drop-shadow-md">
          <button onClick={() => setView('client_grid')} className="mb-3 flex w-fit items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white">
            <ArrowLeft size={16} /> Back to Showroom
          </button>
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">{vehicle.brand}</h2>
          <h1 className="mt-1 text-2xl font-light tracking-tight sm:text-3xl md:text-4xl">{vehicle.model}</h1>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => setIsExpanded((value) => !value)} className="rounded-full border border-white/15 bg-white/5 p-3 shadow-[0_0_12px_rgba(56,189,248,0.1)] backdrop-blur-xl transition-all hover:bg-white/10" title={isExpanded ? 'Collapse side panels' : 'Expand side panels'}>
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
          <button onClick={undo} disabled={historyIndex <= 0} className="rounded-full border border-white/15 bg-white/5 p-3 shadow-[0_0_12px_rgba(56,189,248,0.1)] backdrop-blur-xl transition-all hover:bg-white/10 disabled:opacity-30">
            <Undo2 size={18} />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="rounded-full border border-white/15 bg-white/5 p-3 shadow-[0_0_12px_rgba(56,189,248,0.1)] backdrop-blur-xl transition-all hover:bg-white/10 disabled:opacity-30">
            <Redo2 size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-end justify-end p-2 pb-24 pointer-events-none sm:p-3 md:flex-row md:items-stretch md:p-4 md:pb-6">
        {!isExpanded ? null : (
          <div className="pointer-events-auto absolute bottom-24 left-3 flex flex-col gap-2 sm:bottom-28 sm:left-6 sm:gap-3 md:bottom-1/2 md:translate-y-1/2">
            {Object.keys(vehicle.cameras).map((preset) => (
              <button
                key={preset}
                onClick={() => setCameraPreset(preset)}
                className={`rounded-full border p-2.5 shadow-[0_0_12px_rgba(56,189,248,0.1)] backdrop-blur-md transition-all sm:p-3 ${activeCameraPreset === preset ? 'border-cyan-300/70 bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.16)]' : 'border-white/15 bg-black/40 text-white hover:bg-black/60 hover:shadow-[0_0_16px_rgba(56,189,248,0.2)]'}`}
                title={`View: ${preset}`}
              >
                {preset.toLowerCase() === 'perception' ? (
                  <span className="text-[10px] font-semibold uppercase tracking-[0.25em] sm:text-[11px]">PER</span>
                ) : (
                  <CameraIcon size={16} className="sm:h-[18px] sm:w-[18px]" />
                )}
              </button>
            ))}
          </div>
        )}

        <div className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-[24px] border border-white/15 bg-black/70 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_28px_rgba(56,189,248,0.12)] backdrop-blur-2xl sm:rounded-[28px] md:w-[22rem] xl:w-96">
          <div className="flex overflow-x-auto border-b border-white/10 scrollbar-hide">
            {vehicle.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`relative flex min-w-[100px] flex-1 flex-col items-center justify-center gap-2 px-2 py-3 transition-all sm:py-4 ${activeCategory === category.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}
              >
                {icons[category.icon] || <Settings2 size={20} />}
                <span className="text-[10px] font-semibold uppercase tracking-wider">{category.name}</span>
                {activeCategory === category.id && <motion.div layoutId="activeTab" className="absolute bottom-0 h-0.5 w-full bg-white" />}
              </button>
            ))}
          </div>

          <div className="max-h-[34vh] flex-1 overflow-y-auto p-4 sm:max-h-[42vh] sm:p-6 md:max-h-[56vh]">
            <AnimatePresence mode="wait">
              <motion.div key={activeCategory} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-3">
                {currentCategoryData?.options.map((option) => {
                  const isSelected = selections[activeCategory] === option.id;
                  const isColor = option.hex && option.type !== MATERIAL_TYPES.CARBON;

                  return (
                    <button key={option.id} onClick={() => selectOption(activeCategory, option.id)} className={`flex items-center justify-between rounded-xl border p-3 transition-all sm:p-4 ${isSelected ? 'border-white bg-white/10' : 'border-white/5 bg-black/40 hover:bg-white/5'}`}>
                      <div className="flex items-center gap-3 sm:gap-4">
                        {isColor ? (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: option.hex }}>
                            {isSelected && <Check size={14} className="text-white mix-blend-difference" />}
                          </div>
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-zinc-800">
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                        )}
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{option.name}</span>
                          <span className="text-xs text-zinc-400">{option.price > 0 ? `+${formatPrice(option.price)}` : 'Included'}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="pointer-events-auto z-20 mx-3 mb-3 flex w-auto flex-col items-stretch justify-between gap-3 rounded-[24px] border border-white/15 bg-black/80 p-3 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_24px_rgba(56,189,248,0.12)] backdrop-blur-xl sm:mx-4 sm:gap-4 sm:p-4 md:mx-6 md:flex-row md:items-center md:px-8 md:py-5">
        <div className="flex w-full flex-col md:w-auto">
          <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-400">Total Build Price</span>
          <div className="text-2xl font-light tabular-nums sm:text-3xl"><FormattedPrice price={getTotalPrice()} /></div>
        </div>
        <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
          <button onClick={() => setIsSummaryOpen(true)} className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-white/20">
            <Info size={16} /> Summary
          </button>
          <button className="flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-gray-200">
            Order Now <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {isSummaryOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 flex items-center justify-center bg-black/70 p-4 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950 p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Vehicle Summary</div>
                  <h2 className="mt-2 text-3xl font-semibold text-white">{vehicle.brand} {vehicle.model}</h2>
                  <p className="mt-1 text-sm text-zinc-400">Data for the vehicle currently loaded in the scene.</p>
                </div>
                <button onClick={() => setIsSummaryOpen(false)} className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10">
                  Close
                </button>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Model</div>
                  <div className="mt-2 text-lg font-medium text-white">{vehicle.brand} {vehicle.model}</div>
                  <div className="mt-1 text-sm text-zinc-400">{vehicle.year} · {vehicle.type}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Total Price</div>
                  <div className="mt-2 text-3xl font-semibold text-white"><FormattedPrice price={totalPrice} /></div>
                </div>
                <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Current Build</div>
                  <div className="mt-4 space-y-3">
                    {selectedOptions.map(({ category, option }) => (
                      <div key={category.id} className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 p-3">
                        <div>
                          <div className="text-sm font-medium text-white">{category.name}</div>
                          <div className="text-xs text-zinc-500">{option?.name ?? 'Not selected'}</div>
                        </div>
                        <div className="text-sm font-medium text-white">{option?.price ? `+${formatPrice(option.price)}` : 'Included'}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
