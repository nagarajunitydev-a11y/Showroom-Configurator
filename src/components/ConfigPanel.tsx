import { useEffect, useRef, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Palette,
  CircleDot,
  Package,
  Settings2,
  Check,
  Smartphone,
  Download,
  Undo2,
  Redo2,
  ArrowLeft,
  ChevronRight,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import '@google/model-viewer';
import { FormattedPrice } from './FormattedPrice';
import { formatPrice } from '../utils/price';
import { MATERIAL_TYPES, type Vehicle } from '../types';
import { useAppStore } from '../store';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { useElementHeight } from '../hooks/useElementHeight';
import { BottomSheet, type SheetSnap } from './ui/BottomSheet';

interface ConfigPanelProps {
  vehicle: Vehicle;
  activeCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

const CATEGORY_ICONS: Record<string, JSX.Element> = {
  Palette: <Palette size={18} />,
  CircleDot: <CircleDot size={18} />,
  Package: <Package size={18} />,
};

const HEADER_HEIGHT_FALLBACK = 56;
const FOOTER_HEIGHT_FALLBACK = 68;

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
    <div className="flex w-full overflow-x-auto scrollbar-hide">
      {vehicle.categories.map((category) => (
        <button
          key={category.id}
          type="button"
          onClick={() => onCategoryChange(category.id)}
          className={`relative flex shrink-0 flex-col items-center justify-center gap-1 px-3 transition-colors duration-200 ${compact ? 'min-w-[84px] py-2.5' : 'min-w-[96px] py-3.5 sm:min-w-[104px] sm:py-4'} ${
            activeCategory === category.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {CATEGORY_ICONS[category.icon] || <Settings2 size={compact ? 16 : 20} />}
          <span className="max-w-[76px] truncate text-[11px] font-medium sm:text-xs">{category.name}</span>
          {activeCategory === category.id && (
            <motion.div layoutId="activeTab" className="absolute bottom-0 h-0.5 w-8 rounded-full bg-blue-600" />
          )}
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
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.18 }}
        className="flex flex-col gap-2 p-3 sm:gap-2.5 sm:p-4"
      >
        {currentCategoryData?.options.map((option) => {
          const isSelected = selections[activeCategory] === option.id;
          const isColor = option.hex && option.type !== MATERIAL_TYPES.CARBON;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(activeCategory, option.id)}
              className={`flex min-h-[56px] w-full items-center justify-between rounded-2xl border p-3 text-left transition-all duration-200 sm:p-3.5 ${
                isSelected
                  ? 'border-blue-500 bg-blue-50/70 shadow-[0_4px_16px_-6px_rgba(37,99,235,0.35)]'
                  : 'border-slate-200 bg-white hover:border-blue-200 hover:bg-blue-50/40'
              }`}
            >
              <div className="flex min-w-0 items-center gap-3 sm:gap-3.5">
                {isColor ? (
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border shadow-inner transition-all ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200'}`}
                    style={{ backgroundColor: option.hex }}
                  >
                    {isSelected && <Check size={14} className="text-white mix-blend-difference" />}
                  </div>
                ) : (
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-100 text-blue-600' : 'border-slate-200 bg-slate-50 text-slate-400'
                    }`}
                  >
                    {isSelected && <Check size={14} />}
                  </div>
                )}
                <div className="min-w-0 flex flex-col items-start">
                  <span className={`truncate text-sm font-medium ${isSelected ? 'text-slate-900' : 'text-slate-700'}`}>{option.name}</span>
                  <span className={`text-xs ${isSelected ? 'text-blue-600' : 'text-slate-400'}`}>{option.price > 0 ? `+${formatPrice(option.price)}` : 'Included'}</span>
                </div>
              </div>
            </button>
          );
        })}
      </motion.div>
    </AnimatePresence>
  );
}

function PricingFooter({
  totalPrice,
  onSummaryOpen,
  onSave,
  isSaving,
  compact,
  footerRef,
}: {
  totalPrice: number;
  onSummaryOpen: () => void;
  onSave: () => void;
  isSaving?: boolean;
  compact?: boolean;
  footerRef?: React.RefObject<HTMLDivElement>;
}) {
  if (compact) {
    return (
      <div
        ref={footerRef}
        className="glass-panel-strong pointer-events-auto fixed inset-x-0 bottom-0 z-30 w-full max-w-[100vw] border-t px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] sm:px-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium text-slate-400">Total</div>
            <div className="font-display truncate text-lg font-semibold tabular-nums text-slate-900 sm:text-xl">
              <FormattedPrice price={totalPrice} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onSummaryOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all active:scale-95"
              aria-label="Open summary"
            >
              <Info size={18} />
            </button>
            <button
              type="button"
              onClick={onSave}
              disabled={isSaving}
              className="inline-flex h-11 items-center justify-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-600 transition-all hover:bg-blue-100 active:scale-95 disabled:opacity-50 sm:px-4 sm:text-sm"
            >
              {isSaving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-1 rounded-full bg-blue-600 px-3 text-xs font-semibold text-white shadow-[0_8px_20px_-6px_rgba(37,99,235,0.6)] transition-all hover:bg-blue-500 active:scale-95 sm:px-4 sm:text-sm"
            >
              Order <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel-strong pointer-events-auto z-20 mx-4 mb-4 flex w-auto max-w-full flex-col items-stretch justify-between gap-3 rounded-[24px] p-4 shadow-[0_20px_45px_-20px_rgba(37,99,235,0.35)] sm:mx-6 sm:gap-4 md:flex-row md:items-center md:px-8 md:py-5">
      <div className="flex w-full flex-col md:w-auto">
        <span className="mb-1 text-xs font-medium text-slate-400">Total build price</span>
        <div className="font-display text-2xl font-semibold tabular-nums text-slate-900 sm:text-3xl">
          <FormattedPrice price={totalPrice} />
        </div>
      </div>
      <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
        <button
          type="button"
          onClick={onSummaryOpen}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 transition-all hover:border-blue-200 hover:text-blue-600 active:scale-[0.98]"
        >
          <Info size={16} /> Summary
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-5 py-3 text-sm font-semibold text-blue-600 transition-all hover:bg-blue-100 active:scale-[0.98] disabled:opacity-50"
        >
          {isSaving ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_28px_-10px_rgba(37,99,235,0.65)] transition-all hover:bg-blue-500 active:scale-[0.98]"
        >
          Order now <ChevronRight size={16} />
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
      className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-slate-900/30 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(event) => event.stopPropagation()}
        className="touch-scroll max-h-[min(90dvh,100%)] w-full max-w-[100vw] overflow-y-auto rounded-t-[28px] border border-slate-200 bg-white p-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-2xl sm:rounded-[28px] sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs font-medium text-slate-400">Vehicle summary</div>
            <h2 className="font-display mt-1 truncate text-2xl font-semibold text-slate-900 sm:text-3xl">
              {vehicle.brand} {vehicle.model}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Everything currently loaded in the scene.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-touch shrink-0 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs font-medium text-slate-400">Model</div>
            <div className="mt-2 text-lg font-medium text-slate-900">
              {vehicle.brand} {vehicle.model}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              {vehicle.year} · {vehicle.type}
            </div>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
            <div className="text-xs font-medium text-blue-500">Total price</div>
            <div className="font-display mt-2 text-3xl font-semibold text-slate-900">
              <FormattedPrice price={totalPrice} />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
            <div className="text-xs font-medium text-slate-400">Current build</div>
            <div className="mt-4 space-y-2.5">
              {selectedOptions.map(({ category, option }) => (
                <div key={category.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-900">{category.name}</div>
                    <div className="truncate text-xs text-slate-400">{option?.name ?? 'Not selected'}</div>
                  </div>
                  <div className="shrink-0 text-sm font-medium text-slate-700">{option?.price ? `+${formatPrice(option.price)}` : 'Included'}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ScreenshotPreviewModal({
  imageUrl,
  onClose,
  onDownload,
}: {
  imageUrl: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <div className="text-xs font-medium text-slate-400">Screenshot preview</div>
            <h2 className="font-display mt-1 text-xl font-semibold text-slate-900">Capture ready</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100"
          >
            Close
          </button>
        </div>
        <div className="bg-slate-50 p-4 sm:p-5">
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
            <img src={imageUrl} alt="Screenshot preview" className="block h-full w-full max-h-[60vh] object-contain" />
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDownload}
            className="flex min-h-[44px] items-center justify-center rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-[0_10px_24px_-8px_rgba(37,99,235,0.6)] transition-all hover:bg-blue-500 active:scale-[0.98]"
          >
            Download
          </button>
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
  headerRef,
  onAR,
  onDownload,
  onToggleExpand,
  isExpanded,
  compact,
  isARLaunching,
}: {
  vehicle: Vehicle;
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  headerRef?: React.RefObject<HTMLElement>;
  onAR?: () => void;
  onDownload?: () => void;
  onToggleExpand?: () => void;
  isExpanded?: boolean;
  compact?: boolean;
  isARLaunching?: boolean;
}) {
  if (compact) {
    return (
      <header
        ref={headerRef}
        className="glass-panel-strong pointer-events-auto fixed inset-x-0 top-0 z-30 w-full max-w-[100vw] border-b px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-3"
      >
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all active:scale-95"
            aria-label="Back to showroom"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1 px-1 text-center">
            <div className="truncate text-[10px] font-medium text-slate-400">{vehicle.brand}</div>
            <div className="font-display truncate text-sm font-semibold text-slate-900">{vehicle.model}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onAR && (
              <button
                type="button"
                onClick={onAR}
                disabled={isARLaunching}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:text-blue-600 disabled:opacity-50"
                aria-label="Launch AR"
              >
                <Smartphone size={18} />
              </button>
            )}
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:text-blue-600"
                aria-label="Download screenshot"
              >
                <Download size={18} />
              </button>
            )}
            <button type="button" onClick={onUndo} disabled={!canUndo} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 disabled:opacity-30" aria-label="Undo">
              <Undo2 size={18} />
            </button>
            <button type="button" onClick={onRedo} disabled={!canRedo} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 disabled:opacity-30" aria-label="Redo">
              <Redo2 size={18} />
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="glass-panel-strong pointer-events-auto mx-2 mt-2 flex w-[calc(100%-1rem)] max-w-[100vw] flex-col gap-3 rounded-[24px] px-3 py-2.5 shadow-[0_10px_35px_-18px_rgba(37,99,235,0.4)] sm:mx-6 sm:w-auto sm:max-w-[calc(100vw-3rem)] md:flex-row md:items-center md:justify-between md:px-6 md:py-4">
      <div className="flex min-w-0 flex-col">
        <button type="button" onClick={onBack} className="mb-2 flex w-fit items-center gap-1.5 text-sm font-medium text-slate-500 transition-colors hover:text-blue-600 sm:mb-2.5">
          <ArrowLeft size={16} /> Back to showroom
        </button>
        <h2 className="text-xs font-medium text-slate-400">{vehicle.brand}</h2>
        <h1 className="font-display mt-0.5 truncate text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">{vehicle.model}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {onAR && (
          <button
            type="button"
            onClick={onAR}
            disabled={isARLaunching}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-blue-200 hover:text-blue-600 disabled:opacity-50"
            title="Launch AR"
            aria-label="Launch AR"
          >
            <Smartphone size={18} />
          </button>
        )}
        {onDownload && (
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-blue-200 hover:text-blue-600"
            title="Download screenshot"
            aria-label="Download screenshot"
          >
            <Download size={18} />
          </button>
        )}
        {onToggleExpand && (
          <button
            type="button"
            onClick={onToggleExpand}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-blue-200 hover:text-blue-600"
            title={isExpanded ? 'Collapse side panels' : 'Expand side panels'}
          >
            {isExpanded ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
          </button>
        )}
        <button type="button" onClick={onUndo} disabled={!canUndo} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-blue-200 hover:text-blue-600 disabled:opacity-30">
          <Undo2 size={18} />
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo} className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-blue-200 hover:text-blue-600 disabled:opacity-30">
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
    <div className="glass-panel-strong pointer-events-auto flex w-full max-w-[min(100%,24rem)] flex-col overflow-hidden rounded-[28px] shadow-[0_25px_60px_-25px_rgba(37,99,235,0.4)] md:max-w-[22rem] lg:w-[22rem] xl:w-[24rem]">
      <div className="border-b border-slate-200 px-1">
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
    setView,
    saveConfiguration,
    captureScreenshot,
    captureARModel,
  } = useAppStore();

  const { isDesktop } = useBreakpoint();
  const headerRef = useRef<HTMLElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const modelViewerRef = useRef<any>(null);
  const headerHeight = useElementHeight(headerRef, HEADER_HEIGHT_FALLBACK);
  const footerHeight = useElementHeight(footerRef, FOOTER_HEIGHT_FALLBACK);

  const [sheetSnap, setSheetSnap] = useState<SheetSnap>('peek');
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(true);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [screenshotPreviewUrl, setScreenshotPreviewUrl] = useState<string | null>(null);
  const [isScreenshotPreviewOpen, setIsScreenshotPreviewOpen] = useState(false);
  const [arMessage, setArMessage] = useState<string | null>(null);
  const [isARLaunching, setIsARLaunching] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const totalPrice = getTotalPrice();
  const selectedOptions = vehicle.categories.map((category) => ({
    category,
    option: category.options.find((option) => option.id === selections[category.id]),
  }));

  const sheetMaxHeight = typeof window !== 'undefined'
    ? (window.visualViewport?.height ?? window.innerHeight) - headerHeight - footerHeight - 16
    : undefined;

  useEffect(() => {
    document.documentElement.style.setProperty('--header-height', `${headerHeight}px`);
    document.documentElement.style.setProperty('--footer-height', `${footerHeight}px`);
    return () => {
      document.documentElement.style.setProperty('--header-height', '0px');
      document.documentElement.style.setProperty('--footer-height', '0px');
    };
  }, [headerHeight, footerHeight]);

  useEffect(() => {
    if (isDesktop) {
      setSheetSnap('full');
    } else {
      setSheetSnap('peek');
    }
  }, [isDesktop]);

  const handleSave = () => {
    setIsSaving(true);
    const success = saveConfiguration();
    setIsSaving(false);
    if (success) {
      setSaveMessage('Configuration saved successfully.');
    } else {
      setSaveMessage('Failed to save configuration. Please try again.');
    }
  };

  const handleScreenshotCapture = async () => {
    if (!captureScreenshot) return;

    try {
      const previewUrl = await captureScreenshot();
      if (!previewUrl) return;
      setScreenshotPreviewUrl(previewUrl);
      setIsScreenshotPreviewOpen(true);
    } catch (error) {
      console.error('Failed to capture screenshot', error);
    }
  };

  const handleARLaunch = async () => {
    if (!captureARModel || !modelViewerRef.current) {
      setArMessage('AR is not supported on this device or browser.');
      return;
    }

    setIsARLaunching(true);
    setArMessage(null);

    try {
      const arModelUrl = await captureARModel();
      if (!arModelUrl) {
        setArMessage('Failed to prepare the AR model. Please try again.');
        return;
      }

      modelViewerRef.current.src = arModelUrl;
      await modelViewerRef.current.updateComplete;
      await modelViewerRef.current.activateAR();
    } catch (error) {
      console.error('AR launch failed', error);
      setArMessage('AR is unavailable on this device or the browser blocked the AR session.');
    } finally {
      setIsARLaunching(false);
    }
  };

  const handleCloseScreenshotPreview = () => {
    setScreenshotPreviewUrl(null);
    setIsScreenshotPreviewOpen(false);
  };

  const handleScreenshotDownload = () => {
    if (!screenshotPreviewUrl) return;

    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    const filename = `vehicle-configurator-${timestamp}.png`;

    const link = document.createElement('a');
    link.href = screenshotPreviewUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    handleCloseScreenshotPreview();
  };

  useEffect(() => {
    if (!saveMessage) return;
    const timeout = window.setTimeout(() => setSaveMessage(null), 3000);
    return () => window.clearTimeout(timeout);
  }, [saveMessage]);

  const modelViewer = (
    <model-viewer
      ref={modelViewerRef}
      style={{ display: 'none' }}
      ar
      ar-modes="webxr scene-viewer quick-look"
      environment-image="neutral"
      exposure="1"
    />
  );

  if (!isDesktop) {
    return (
      <motion.div key="mobile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-10 max-w-[100vw] overflow-hidden font-sans text-slate-900">
        {modelViewer}
        <ConfiguratorHeader
          vehicle={vehicle}
          headerRef={headerRef}
          onBack={() => setView('client_grid')}
          onAR={handleARLaunch}
          onDownload={handleScreenshotCapture}
          onUndo={undo}
          onRedo={redo}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          isARLaunching={isARLaunching}
          compact
        />

        <PricingFooter footerRef={footerRef} totalPrice={totalPrice} onSummaryOpen={() => setIsSummaryOpen(true)} onSave={handleSave} isSaving={isSaving} compact />

        <BottomSheet
          snap={sheetSnap}
          onSnapChange={setSheetSnap}
          bottomOffset={footerHeight}
          maxHeight={sheetMaxHeight}
          peekHeight={108}
          peekContent={
            <div className="w-full max-w-[100vw]">
              <CategoryTabs vehicle={vehicle} activeCategory={activeCategory} onCategoryChange={onCategoryChange} compact />
            </div>
          }
        >
          <OptionsList vehicle={vehicle} activeCategory={activeCategory} selections={selections} onSelect={selectOption} />
        </BottomSheet>

        <AnimatePresence>
          {isSummaryOpen && (
            <SummaryModal vehicle={vehicle} totalPrice={totalPrice} selectedOptions={selectedOptions} onClose={() => setIsSummaryOpen(false)} />
          )}
          {isScreenshotPreviewOpen && screenshotPreviewUrl && (
            <ScreenshotPreviewModal
              imageUrl={screenshotPreviewUrl}
              onClose={() => setIsScreenshotPreviewOpen(false)}
              onDownload={handleScreenshotDownload}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (!isDesktopExpanded) {
    return (
      <motion.div key="desktop-collapsed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex justify-end p-6">
        <div className="glass-panel-strong pointer-events-auto flex w-full max-w-xl items-center justify-between rounded-full px-4 py-3 shadow-[0_15px_35px_-15px_rgba(37,99,235,0.4)]">
          <div>
            <div className="text-[10px] font-medium text-slate-400">{vehicle.brand}</div>
            <div className="font-display text-sm font-semibold text-slate-900">{vehicle.model}</div>
          </div>
          <button
            type="button"
            onClick={() => setIsDesktopExpanded(true)}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all hover:border-blue-200 hover:text-blue-600"
            title="Expand panels"
          >
            <Maximize2 size={18} />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div key="desktop-expanded" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between font-sans text-slate-900">
      <ConfiguratorHeader
        vehicle={vehicle}
        onBack={() => setView('client_grid')}
        onAR={handleARLaunch}
        onDownload={handleScreenshotCapture}
        onUndo={undo}
        onRedo={redo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onToggleExpand={() => setIsDesktopExpanded(false)}
        isExpanded={isDesktopExpanded}
        isARLaunching={isARLaunching}
      />

      <model-viewer
        ref={modelViewerRef}
        style={{ display: 'none' }}
        ar
        ar-modes="webxr scene-viewer quick-look"
        environment-image="neutral"
        exposure="1"
      />

      <div className="pointer-events-none flex flex-1 flex-col items-end justify-end p-2 sm:p-4 md:flex-row md:items-stretch md:pb-6">
        <DesktopLayout vehicle={vehicle} activeCategory={activeCategory} onCategoryChange={onCategoryChange}>
          <OptionsList vehicle={vehicle} activeCategory={activeCategory} selections={selections} onSelect={selectOption} />
        </DesktopLayout>
      </div>

      <PricingFooter totalPrice={totalPrice} onSummaryOpen={() => setIsSummaryOpen(true)} onSave={handleSave} isSaving={isSaving} />

      <AnimatePresence>
        {isSummaryOpen && (
          <SummaryModal vehicle={vehicle} totalPrice={totalPrice} selectedOptions={selectedOptions} onClose={() => setIsSummaryOpen(false)} />
        )}
        {isScreenshotPreviewOpen && screenshotPreviewUrl && (
          <ScreenshotPreviewModal
            imageUrl={screenshotPreviewUrl}
            onClose={() => setIsScreenshotPreviewOpen(false)}
            onDownload={handleScreenshotDownload}
          />
        )}
      </AnimatePresence>

      {arMessage && (
        <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center px-4">
          <div className="glass-panel-strong pointer-events-auto rounded-2xl px-5 py-3 text-sm font-medium text-slate-700 shadow-[0_15px_35px_-15px_rgba(37,99,235,0.35)]">
            {arMessage}
          </div>
        </div>
      )}
      {saveMessage && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4">
          <div className="glass-panel-strong pointer-events-auto rounded-2xl px-5 py-3 text-sm font-medium text-slate-700 shadow-[0_15px_35px_-15px_rgba(37,99,235,0.35)]">
            {saveMessage}
          </div>
        </div>
      )}
    </motion.div>
  );
};
