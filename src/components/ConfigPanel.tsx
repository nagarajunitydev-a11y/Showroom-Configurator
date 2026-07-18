import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Palette,
  CircleDot,
  Package,
  Settings2,
  Check,
  Camera as CameraIcon,
  Undo2,
  Redo2,
  ArrowLeft,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { FormattedPrice } from './FormattedPrice';
import { formatPrice } from '../utils/price';
import { MATERIAL_TYPES, type Vehicle } from '../types';
import { useAppStore } from '../store';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { BottomSheet, type SheetSnap } from './ui/BottomSheet';

interface ConfigPanelProps {
  vehicle: Vehicle;
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  Palette: <Palette size={20} />,
  CircleDot: <CircleDot size={20} />,
  Package: <Package size={20} />,
};

function CategoryTabs({
  vehicle,
  activeCategory,
  onCategoryChange,
  compact = false,
}: {
  vehicle: Vehicle;
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  compact?: boolean;
}) {
  return (
    <div className="flex overflow-x-auto scrollbar-hide">
      {vehicle.categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onCategoryChange(category.id)}
          className={`relative flex min-w-[88px] flex-1 flex-col items-center justify-center gap-1.5 px-2 transition-all sm:min-w-[100px] ${compact ? 'py-2.5' : 'py-3 sm:py-4'} ${
            activeCategory === category.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
          }`}
        >
          {CATEGORY_ICONS[category.icon] || <Settings2 size={compact ? 18 : 20} />}
          <span className="text-[10px] font-semibold uppercase tracking-wider">{category.name}</span>
          {activeCategory === category.id && <motion.div layoutId="activeTab" className="absolute bottom-0 h-0.5 w-full bg-white" />}
        </button>
      ))}
    </div>
  );
}

function OptionsList({
  vehicle,
  activeCategory,
  selections,
  onSelect,
}: {
  vehicle: Vehicle;
  activeCategory: string;
  selections: Record<string, string>;
  onSelect: (categoryId: string, optionId: string) => void;
}) {
  const currentCategoryData = vehicle.categories.find((category) => category.id === activeCategory);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeCategory}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="flex flex-col gap-2 p-3 sm:gap-3 sm:p-4"
      >
        {currentCategoryData?.options.map((option) => {
          const isSelected = selections[activeCategory] === option.id;
          const isColor = option.hex && option.type !== MATERIAL_TYPES.CARBON;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(activeCategory, option.id)}
              className={`flex min-h-[52px] items-center justify-between rounded-xl border p-3 transition-all sm:p-4 ${
                isSelected ? 'border-white bg-white/10' : 'border-white/5 bg-black/40 hover:bg-white/5'
              }`}
            >
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
  );
}

function CameraToolbar({
  vehicle,
  activeCameraPreset,
  onPresetChange,
  layout,
}: {
  vehicle: Vehicle;
  activeCameraPreset: string;
  onPresetChange: (preset: string) => void;
  layout: 'horizontal' | 'vertical';
}) {
  const presets = Object.keys(vehicle.cameras);

  if (layout === 'horizontal') {
    return (
      <div className="pointer-events-auto mx-3 mb-2 flex gap-2 overflow-x-auto rounded-full border border-white/15 bg-black/60 px-2 py-2 backdrop-blur-xl scrollbar-hide sm:mx-4">
        {presets.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => onPresetChange(preset)}
            className={`inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-full border px-3 transition-all ${
              activeCameraPreset === preset
                ? 'border-cyan-300/70 bg-white text-black'
                : 'border-white/15 bg-black/40 text-white hover:bg-black/60'
            }`}
            title={`View: ${preset}`}
          >
            {preset.toLowerCase() === 'perception' ? (
              <span className="text-[10px] font-semibold uppercase tracking-[0.25em]">PER</span>
            ) : (
              <CameraIcon size={16} />
            )}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="pointer-events-auto absolute bottom-1/2 left-4 flex translate-y-1/2 flex-col gap-2 sm:left-6 sm:gap-3">
      {presets.map((preset) => (
        <button
          key={preset}
          type="button"
          onClick={() => onPresetChange(preset)}
          className={`inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border p-2.5 backdrop-blur-md transition-all sm:p-3 ${
            activeCameraPreset === preset
              ? 'border-cyan-300/70 bg-white text-black shadow-[0_0_18px_rgba(255,255,255,0.16)]'
              : 'border-white/15 bg-black/40 text-white hover:bg-black/60'
          }`}
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
  );
}

function PricingFooter({
  totalPrice,
  onSummaryOpen,
  compact,
}: {
  totalPrice: number;
  onSummaryOpen: () => void;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 border-t border-white/15 bg-black/90 px-3 py-2 pb-safe backdrop-blur-xl sm:px-4">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-zinc-400">Total</div>
            <div className="truncate text-xl font-light tabular-nums sm:text-2xl">
              <FormattedPrice price={totalPrice} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onSummaryOpen}
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all hover:bg-white/20"
              aria-label="Open summary"
            >
              <Info size={18} />
            </button>
            <button
              type="button"
              className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded-full bg-white px-4 text-sm font-semibold text-black transition-all hover:bg-gray-200"
            >
              Order <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto z-20 mx-4 mb-4 flex flex-col items-stretch justify-between gap-3 rounded-[24px] border border-white/15 bg-black/80 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_24px_rgba(56,189,248,0.12)] backdrop-blur-xl sm:mx-6 sm:gap-4 md:flex-row md:items-center md:px-8 md:py-5">
      <div className="flex w-full flex-col md:w-auto">
        <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-400">Total Build Price</span>
        <div className="text-2xl font-light tabular-nums sm:text-3xl">
          <FormattedPrice price={totalPrice} />
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
        <button
          type="button"
          onClick={onSummaryOpen}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-white/20"
        >
          <Info size={16} /> Summary
        </button>
        <button
          type="button"
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-all hover:bg-gray-200"
        >
          Order Now <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function SummaryModal({
  vehicle,
  totalPrice,
  selectedOptions,
  onClose,
}: {
  vehicle: Vehicle;
  totalPrice: number;
  selectedOptions: Array<{ category: Vehicle['categories'][number]; option: Vehicle['categories'][number]['options'][number] | undefined }>;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(event) => event.stopPropagation()}
        className="touch-scroll max-h-[90dvh] w-full overflow-y-auto rounded-t-[28px] border border-white/10 bg-zinc-950 p-5 shadow-2xl sm:max-w-2xl sm:rounded-[28px] sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Vehicle Summary</div>
            <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">
              {vehicle.brand} {vehicle.model}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">Data for the vehicle currently loaded in the scene.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-touch rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Model</div>
            <div className="mt-2 text-lg font-medium text-white">
              {vehicle.brand} {vehicle.model}
            </div>
            <div className="mt-1 text-sm text-zinc-400">
              {vehicle.year} · {vehicle.type}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Total Price</div>
            <div className="mt-2 text-3xl font-semibold text-white">
              <FormattedPrice price={totalPrice} />
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
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
  );
}

function ConfiguratorHeader({
  vehicle,
  onBack,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onToggleExpand,
  isExpanded,
  compact,
}: {
  vehicle: Vehicle;
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <header className="pointer-events-auto fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-2 border-b border-white/10 bg-black/60 px-3 py-2 pt-safe backdrop-blur-xl sm:px-4">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 text-white"
          aria-label="Back to showroom"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-[10px] uppercase tracking-[0.25em] text-zinc-400">{vehicle.brand}</div>
          <div className="truncate text-sm font-medium">{vehicle.model}</div>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" onClick={onUndo} disabled={!canUndo} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 disabled:opacity-30" aria-label="Undo">
            <Undo2 size={18} />
          </button>
          <button type="button" onClick={onRedo} disabled={!canRedo} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 disabled:opacity-30" aria-label="Redo">
            <Redo2 size={18} />
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="pointer-events-auto mx-4 mt-4 flex flex-col gap-3 rounded-[24px] border border-white/15 bg-black/50 px-4 py-2.5 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_24px_rgba(56,189,248,0.12)] backdrop-blur-xl sm:mx-6 md:flex-row md:items-start md:justify-between md:px-5 md:py-4">
      <div className="flex flex-col drop-shadow-md">
        <button type="button" onClick={onBack} className="mb-3 flex w-fit items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white">
          <ArrowLeft size={16} /> Back to Showroom
        </button>
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">{vehicle.brand}</h2>
        <h1 className="mt-1 text-2xl font-light tracking-tight sm:text-3xl md:text-4xl">{vehicle.model}</h1>
      </div>
      <div className="flex items-center gap-2">
        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-xl transition-all hover:bg-white/10"
            title={isExpanded ? 'Collapse side panels' : 'Expand side panels'}
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        )}
        <button type="button" onClick={onUndo} disabled={!canUndo} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-xl transition-all hover:bg-white/10 disabled:opacity-30">
          <Undo2 size={18} />
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-xl transition-all hover:bg-white/10 disabled:opacity-30">
          <Redo2 size={18} />
        </button>
      </div>
    </header>
  );
}

function DesktopLayout({
  vehicle,
  activeCategory,
  onCategoryChange,
  children,
}: {
  vehicle: Vehicle;
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="pointer-events-auto flex w-full flex-col overflow-hidden rounded-[24px] border border-white/15 bg-black/70 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_28px_rgba(56,189,248,0.12)] backdrop-blur-2xl sm:rounded-[28px] md:w-[22rem] xl:w-96">
      <div className="border-b border-white/10">
        <CategoryTabs vehicle={vehicle} activeCategory={activeCategory} onCategoryChange={onCategoryChange} />
      </div>
      <div className="max-h-[56vh] flex-1 overflow-y-auto touch-scroll">{children}</div>
    </div>
  );
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

  const { isMobile } = useBreakpoint();
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('peek');
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);

  const totalPrice = getTotalPrice();
  const selectedOptions = vehicle.categories.map((category) => ({
    category,
    option: category.options.find((option) => option.id === selections[category.id]),
  }));

  const footerHeight = 72;

  useEffect(() => {
    if (!isMobile) {
      setSheetSnap('full');
    } else {
      setSheetSnap('peek');
    }
  }, [isMobile]);

  if (isMobile) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-10 font-sans text-white">
        <ConfiguratorHeader
          vehicle={vehicle}
          onBack={() => setView('client_grid')}
          onUndo={undo}
          onRedo={redo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          compact
        />

        <div className="pointer-events-none fixed inset-x-0 z-20" style={{ bottom: 'calc(var(--sheet-height, 140px) + 8px)' }}>
          <CameraToolbar vehicle={vehicle} activeCameraPreset={activeCameraPreset} onPresetChange={setCameraPreset} layout="horizontal" />
        </div>

        <BottomSheet
          snap={sheetSnap}
          onSnapChange={setSheetSnap}
          bottomOffset={footerHeight}
          peekContent={<CategoryTabs vehicle={vehicle} activeCategory={activeCategory} onCategoryChange={onCategoryChange} compact />}
        >
          <OptionsList vehicle={vehicle} activeCategory={activeCategory} selections={selections} onSelect={selectOption} />
        </BottomSheet>

        <PricingFooter totalPrice={totalPrice} onSummaryOpen={() => setIsSummaryOpen(true)} compact />

        <AnimatePresence>
          {isSummaryOpen && (
            <SummaryModal vehicle={vehicle} totalPrice={totalPrice} selectedOptions={selectedOptions} onClose={() => setIsSummaryOpen(false)} />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (!isDesktopExpanded) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-end p-6">
        <div className="pointer-events-auto flex w-full max-w-xl items-center justify-between rounded-full border border-white/10 bg-black/75 px-4 py-3 backdrop-blur-xl">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-zinc-400">{vehicle.brand}</div>
            <div className="text-sm font-medium">{vehicle.model}</div>
          </div>
          <button
            type="button"
            onClick={() => setIsDesktopExpanded(true)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 text-white transition-all hover:bg-white/10"
            title="Expand panels"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between font-sans text-white">
      <ConfiguratorHeader
        vehicle={vehicle}
        onBack={() => setView('client_grid')}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onToggleExpand={() => setIsDesktopExpanded(false)}
        isExpanded={isDesktopExpanded}
      />

      <div className="pointer-events-none flex flex-1 flex-col items-end justify-end p-4 md:flex-row md:items-stretch md:pb-6">
        <CameraToolbar vehicle={vehicle} activeCameraPreset={activeCameraPreset} onPresetChange={setCameraPreset} layout="vertical" />

        <DesktopLayout vehicle={vehicle} activeCategory={activeCategory} onCategoryChange={onCategoryChange}>
          <OptionsList vehicle={vehicle} activeCategory={activeCategory} selections={selections} onSelect={selectOption} />
        </DesktopLayout>
      </div>

      <PricingFooter totalPrice={totalPrice} onSummaryOpen={() => setIsSummaryOpen(true)} />

      <AnimatePresence>
        {isSummaryOpen && (
          <SummaryModal vehicle={vehicle} totalPrice={totalPrice} selectedOptions={selectedOptions} onClose={() => setIsSummaryOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
