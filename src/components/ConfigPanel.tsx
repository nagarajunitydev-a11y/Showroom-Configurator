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
          className={`relative flex shrink-0 flex-col items-center justify-center gap-1 px-3 transition-all ${compact ? 'min-w-[84px] py-2' : 'min-w-[96px] py-3 sm:min-w-[100px] sm:py-4'} ${
            activeCategory === category.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
          }`}
        >
          {CATEGORY_ICONS[category.icon] || <Settings2 size={compact ? 16 : 20} />}
          <span className="max-w-[72px] truncate text-[9px] font-semibold uppercase tracking-wider sm:text-[10px]">{category.name}</span>
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
              className={`flex min-h-[52px] w-full items-center justify-between rounded-xl border p-3 transition-all sm:p-4 ${
                isSelected ? 'border-white bg-white/10' : 'border-white/5 bg-black/40 hover:bg-white/5'
              }`}
            >
              <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                {isColor ? (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 shadow-inner" style={{ backgroundColor: option.hex }}>
                    {isSelected && <Check size={14} className="text-white mix-blend-difference" />}
                  </div>
                ) : (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-zinc-800">
                    {isSelected && <Check size={14} className="text-white" />}
                  </div>
                )}
                <div className="min-w-0 flex flex-col items-start">
                  <span className="truncate text-sm font-medium">{option.name}</span>
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

function PricingFooter({
  totalPrice,
  onSummaryOpen,
  onSave,
  compact,
  footerRef,
}: {
  totalPrice: number;
  onSummaryOpen: () => void;
  onSave: () => void;
  compact?: boolean;
  footerRef?: React.RefObject<HTMLDivElement>;
}) {
  if (compact) {
    return (
      <div
        ref={footerRef}
        className="pointer-events-auto fixed inset-x-0 bottom-0 z-30 w-full max-w-[100vw] border-t border-white/15 bg-black/95 px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] backdrop-blur-xl sm:px-4"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-400">Total</div>
            <div className="truncate text-lg font-light tabular-nums sm:text-xl">
              <FormattedPrice price={totalPrice} />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={onSummaryOpen}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white transition-all hover:bg-white/20"
              aria-label="Open summary"
            >
              <Info size={18} />
            </button>
            <button
              type="button"
              onClick={onSave}
              className="inline-flex h-11 items-center justify-center gap-1 rounded-full bg-sky-500 px-3 text-xs font-semibold text-white transition-all hover:bg-sky-400 sm:px-4 sm:text-sm"
            >
              Save
            </button>
            <button
              type="button"
              className="inline-flex h-11 items-center justify-center gap-1 rounded-full bg-white px-3 text-xs font-semibold text-black transition-all hover:bg-zinc-200 sm:px-4 sm:text-sm"
            >
              Order <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-auto z-20 mx-4 mb-4 flex w-auto max-w-full flex-col items-stretch justify-between gap-3 rounded-[24px] border border-white/15 bg-black/80 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_24px_rgba(56,189,248,0.12)] backdrop-blur-xl sm:mx-6 sm:gap-4 md:flex-row md:items-center md:px-8 md:py-5">
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
      className="pointer-events-auto fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        onClick={(event) => event.stopPropagation()}
        className="touch-scroll max-h-[min(90dvh,100%)] w-full max-w-[100vw] overflow-y-auto rounded-t-[28px] border border-white/10 bg-zinc-950 p-5 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl sm:max-w-2xl sm:rounded-[28px] sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Vehicle Summary</div>
            <h2 className="mt-2 truncate text-2xl font-semibold text-white sm:text-3xl">
              {vehicle.brand} {vehicle.model}
            </h2>
            <p className="mt-1 text-sm text-zinc-400">Data for the vehicle currently loaded in the scene.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-touch shrink-0 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
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
                <div key={category.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white">{category.name}</div>
                    <div className="truncate text-xs text-zinc-500">{option?.name ?? 'Not selected'}</div>
                  </div>
                  <div className="shrink-0 text-sm font-medium text-white">{option?.price ? `+${formatPrice(option.price)}` : 'Included'}</div>
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
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 300 }}
        onClick={(event) => event.stopPropagation()}
        className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/10 bg-zinc-950 shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-zinc-500">Screenshot Preview</div>
            <h2 className="mt-2 text-xl font-semibold text-white">Capture Ready</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-colors hover:bg-white/10"
          >
            Close
          </button>
        </div>
        <div className="bg-black p-4 sm:p-5">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-zinc-900">
            <img src={imageUrl} alt="Screenshot preview" className="block h-full w-full max-h-[60vh] object-contain" />
          </div>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/10 bg-zinc-950 px-5 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onDownload}
            className="flex min-h-[44px] items-center justify-center rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-sky-400"
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
        className="pointer-events-auto fixed inset-x-0 top-0 z-30 w-full max-w-[100vw] border-b border-white/10 bg-black/70 px-2 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))] backdrop-blur-xl sm:px-3"
      >
        <div className="flex items-center justify-between gap-1">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white"
            aria-label="Back to showroom"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="min-w-0 flex-1 px-1 text-center">
            <div className="truncate text-[10px] uppercase tracking-[0.2em] text-zinc-400">{vehicle.brand}</div>
            <div className="truncate text-sm font-medium">{vehicle.model}</div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onAR && (
              <button
                type="button"
                onClick={onAR}
                disabled={isARLaunching}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-all hover:bg-white/10 disabled:opacity-50"
                aria-label="Launch AR"
              >
                <Smartphone size={18} />
              </button>
            )}
            {onDownload && (
              <button
                type="button"
                onClick={onDownload}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 transition-all hover:bg-white/10"
                aria-label="Download screenshot"
              >
                <Download size={18} />
              </button>
            )}
            <button type="button" onClick={onUndo} disabled={!canUndo} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 disabled:opacity-30" aria-label="Undo">
              <Undo2 size={18} />
            </button>
            <button type="button" onClick={onRedo} disabled={!canRedo} className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/5 disabled:opacity-30" aria-label="Redo">
              <Redo2 size={18} />
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="pointer-events-auto mx-4 mt-4 flex max-w-[calc(100vw-2rem)] flex-col gap-3 rounded-[24px] border border-white/15 bg-black/50 px-4 py-2.5 shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_0_24px_rgba(56,189,248,0.12)] backdrop-blur-xl sm:mx-6 md:flex-row md:items-start md:justify-between md:px-5 md:py-4">
      <div className="flex min-w-0 flex-col drop-shadow-md">
        <button type="button" onClick={onBack} className="mb-3 flex w-fit items-center gap-2 text-sm font-medium text-zinc-400 transition-colors hover:text-white">
          <ArrowLeft size={16} /> Back to Showroom
        </button>
        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-zinc-400">{vehicle.brand}</h2>
        <h1 className="mt-1 truncate text-2xl font-light tracking-tight sm:text-3xl md:text-4xl">{vehicle.model}</h1>
      </div>
      <div className="flex items-center gap-2">
        {onAR && (
          <button
            type="button"
            onClick={onAR}
            disabled={isARLaunching}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-xl transition-all hover:bg-white/10 disabled:opacity-50"
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
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-xl transition-all hover:bg-white/10"
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
    <div className="pointer-events-auto flex w-full max-w-[min(100%,24rem)] flex-col overflow-hidden rounded-[24px] border border-white/15 bg-black/70 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_28px_rgba(56,189,248,0.12)] backdrop-blur-2xl sm:rounded-[28px] md:w-[22rem] xl:w-96">
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
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 z-10 max-w-[100vw] overflow-hidden font-sans text-white">
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

        <PricingFooter footerRef={footerRef} totalPrice={totalPrice} onSummaryOpen={() => setIsSummaryOpen(true)} onSave={handleSave} compact />

        <BottomSheet
          snap={sheetSnap}
          onSnapChange={setSheetSnap}
          bottomOffset={footerHeight}
          maxHeight={sheetMaxHeight}
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

      <div className="pointer-events-none flex flex-1 flex-col items-end justify-end p-4 md:flex-row md:items-stretch md:pb-6">
        <DesktopLayout vehicle={vehicle} activeCategory={activeCategory} onCategoryChange={onCategoryChange}>
          <OptionsList vehicle={vehicle} activeCategory={activeCategory} selections={selections} onSelect={selectOption} />
        </DesktopLayout>
      </div>

      <div className="pointer-events-auto z-20 mx-4 mb-4 flex w-auto max-w-full flex-col items-stretch justify-between gap-3 rounded-[24px] border border-white/15 bg-black/80 p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.04),0_0_24px_rgba(56,189,248,0.12)] backdrop-blur-xl sm:mx-6 sm:gap-4 md:flex-row md:items-center md:px-8 md:py-5">
        <div className="flex w-full flex-col md:w-auto">
          <span className="mb-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-400">Total Build Price</span>
          <div className="text-2xl font-light tabular-nums sm:text-3xl">
            <FormattedPrice price={totalPrice} />
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row md:w-auto">
          <button
            type="button"
            onClick={() => setIsSummaryOpen(true)}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-5 py-3 text-sm font-medium text-white transition-all hover:bg-white/20"
          >
            <Info size={16} /> Summary
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-sky-500 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-sky-400 disabled:opacity-40"
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button
            type="button"
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-all hover:bg-zinc-200"
          >
            Order Now <ChevronRight size={16} />
          </button>
        </div>
      </div>

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
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/90 px-5 py-3 text-sm text-white shadow-xl backdrop-blur-xl">
            {arMessage}
          </div>
        </div>
      )}
      {saveMessage && (
        <div className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-black/90 px-5 py-3 text-sm text-white shadow-xl backdrop-blur-xl">
            {saveMessage}
          </div>
        </div>
      )}
    </motion.div>
  );
};
