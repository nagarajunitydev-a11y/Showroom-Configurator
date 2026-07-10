import { AnimatePresence, motion } from 'framer-motion';
import { Palette, CircleDot, Settings2, Check, Camera as CameraIcon, Undo2, Redo2, ArrowLeft, ChevronRight, Info } from 'lucide-react';
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

  const currentCategoryData = vehicle.categories.find((category) => category.id === activeCategory);
  const icons: Record<string, JSX.Element> = { Palette: <Palette size={20} />, CircleDot: <CircleDot size={20} /> };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between font-sans text-white">
      <header className="pointer-events-auto flex w-full items-start justify-between p-6">
        <div className="flex flex-col drop-shadow-md">
          <button onClick={() => setView('client_grid')} className="mb-4 flex w-fit items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white">
            <ArrowLeft size={16} /> Back to Showroom
          </button>
          <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">{vehicle.brand}</h2>
          <h1 className="mt-1 text-4xl font-light tracking-tight md:text-5xl">{vehicle.model}</h1>
        </div>

        <div className="flex gap-2">
          <button onClick={undo} disabled={historyIndex <= 0} className="rounded-full border border-white/10 bg-white/5 p-3 backdrop-blur-xl transition-all hover:bg-white/10 disabled:opacity-30">
            <Undo2 size={18} />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="rounded-full border border-white/10 bg-white/5 p-3 backdrop-blur-xl transition-all hover:bg-white/10 disabled:opacity-30">
            <Redo2 size={18} />
          </button>
        </div>
      </header>

      <div className="flex flex-1 flex-col items-end justify-end p-4 pb-24 pointer-events-none md:flex-row md:items-stretch md:p-6 md:pb-6">
        <div className="pointer-events-auto absolute bottom-28 left-6 flex flex-col gap-3 md:bottom-1/2 md:translate-y-1/2">
          {Object.keys(vehicle.cameras).map((preset) => (
            <button
              key={preset}
              onClick={() => setCameraPreset(preset)}
              className={`rounded-full border p-3 backdrop-blur-md transition-all ${activeCameraPreset === preset ? 'border-white bg-white text-black' : 'border-white/10 bg-black/40 text-white hover:bg-black/60'}`}
              title={`View: ${preset}`}
            >
              <CameraIcon size={18} />
            </button>
          ))}
        </div>

        <div className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-2xl backdrop-blur-2xl md:w-96">
          <div className="flex overflow-x-auto border-b border-white/10 scrollbar-hide">
            {vehicle.categories.map((category) => (
              <button
                key={category.id}
                onClick={() => onCategoryChange(category.id)}
                className={`relative flex min-w-[100px] flex-1 flex-col items-center justify-center gap-2 px-2 py-4 transition-all ${activeCategory === category.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'}`}
              >
                {icons[category.icon] || <Settings2 size={20} />}
                <span className="text-[10px] font-semibold uppercase tracking-wider">{category.name}</span>
                {activeCategory === category.id && <motion.div layoutId="activeTab" className="absolute bottom-0 h-0.5 w-full bg-white" />}
              </button>
            ))}
          </div>

          <div className="max-h-[40vh] flex-1 overflow-y-auto p-6 md:max-h-[60vh]">
            <AnimatePresence mode="wait">
              <motion.div key={activeCategory} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-3">
                {currentCategoryData?.options.map((option) => {
                  const isSelected = selections[activeCategory] === option.id;
                  const isColor = option.hex && option.type !== MATERIAL_TYPES.CARBON;

                  return (
                    <button key={option.id} onClick={() => selectOption(activeCategory, option.id)} className={`flex items-center justify-between rounded-xl border p-4 transition-all ${isSelected ? 'border-white bg-white/10' : 'border-white/5 bg-black/40 hover:bg-white/5'}`}>
                      <div className="flex items-center gap-4">
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

      <div className="pointer-events-auto z-20 flex w-full flex-col items-center justify-between gap-4 border-t border-white/10 bg-black/80 p-4 backdrop-blur-xl md:flex-row md:px-8 md:py-5">
        <div className="flex w-full flex-col md:w-auto">
          <span className="mb-1 text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Total Build Price</span>
          <div className="text-3xl font-light tabular-nums"><FormattedPrice price={getTotalPrice()} /></div>
        </div>
        <div className="flex w-full gap-3 md:w-auto">
          <button className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-6 py-3 text-sm font-medium text-white transition-all hover:bg-white/20 md:flex-none">
            <Info size={16} /> Summary
          </button>
          <button className="flex flex-1 items-center justify-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-semibold text-black transition-all hover:bg-gray-200 md:flex-none">
            Order Now <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
