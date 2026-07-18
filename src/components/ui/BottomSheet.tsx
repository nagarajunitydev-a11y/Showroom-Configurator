import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, type PanInfo } from 'framer-motion';

export type SheetSnap = 'hidden' | 'peek' | 'half' | 'full';

interface BottomSheetProps {
  snap: SheetSnap;
  onSnapChange: (snap: SheetSnap) => void;
  peekContent: ReactNode;
  children: ReactNode;
  bottomOffset?: number;
  maxHeight?: number;
  className?: string;
}

const SNAP_ORDER: SheetSnap[] = ['peek', 'half', 'full'];

const PEEK_HEIGHT = 168;
const HANDLE_HEIGHT = 28;

function getSnapHeights(viewportHeight: number, bottomOffset: number, maxHeight?: number) {
  const available = maxHeight ?? viewportHeight - bottomOffset;
  const capped = (value: number) => Math.min(value, available);

  return {
    hidden: 0,
    peek: PEEK_HEIGHT,
    half: capped(Math.round(viewportHeight * 0.42)),
    full: capped(Math.round(viewportHeight * 0.72)),
  };
}

function nearestSnap(currentHeight: number, heights: Record<SheetSnap, number>): SheetSnap {
  let closest: SheetSnap = 'peek';
  let minDistance = Infinity;

  SNAP_ORDER.forEach((snap) => {
    const distance = Math.abs(currentHeight - heights[snap]);
    if (distance < minDistance) {
      minDistance = distance;
      closest = snap;
    }
  });

  return closest;
}

export const BottomSheet = ({
  snap,
  onSnapChange,
  peekContent,
  children,
  bottomOffset = 0,
  maxHeight,
  className = '',
}: BottomSheetProps) => {
  const [viewportHeight, setViewportHeight] = useState(() => (typeof window !== 'undefined' ? window.innerHeight : 800));
  const [dragHeight, setDragHeight] = useState<number | null>(null);

  const heights = useMemo(
    () => getSnapHeights(viewportHeight, bottomOffset, maxHeight),
    [viewportHeight, bottomOffset, maxHeight],
  );

  const targetHeight = snap === 'hidden' ? heights.hidden : heights[snap];
  const sheetHeight = dragHeight ?? targetHeight;

  useEffect(() => {
    const update = () => setViewportHeight(window.innerHeight);
    update();
    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  useEffect(() => {
    const totalOccupied = sheetHeight + bottomOffset;
    document.documentElement.style.setProperty('--sheet-height', `${sheetHeight}px`);
    document.documentElement.style.setProperty('--sheet-total-height', `${totalOccupied}px`);
    return () => {
      document.documentElement.style.removeProperty('--sheet-height');
      document.documentElement.style.removeProperty('--sheet-total-height');
    };
  }, [sheetHeight, bottomOffset]);

  useEffect(() => {
    setDragHeight(null);
  }, [snap]);

  const cycleSnap = useCallback(() => {
    const currentIndex = SNAP_ORDER.indexOf(snap === 'hidden' ? 'peek' : snap);
    const nextSnap = SNAP_ORDER[(currentIndex + 1) % SNAP_ORDER.length];
    onSnapChange(nextSnap);
  }, [onSnapChange, snap]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    const delta = -info.offset.y;
    const projected = targetHeight + delta + info.velocity.y * -0.15;
    const nextSnap = nearestSnap(projected, heights);
    setDragHeight(null);
    onSnapChange(nextSnap);
  };

  if (snap === 'hidden') {
    return null;
  }

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 0 }}
      dragElastic={0.04}
      onDrag={(_, info) => {
        const next = Math.max(heights.peek, Math.min(heights.full, targetHeight - info.offset.y));
        setDragHeight(next);
      }}
      onDragEnd={handleDragEnd}
      animate={{ height: sheetHeight }}
      initial={false}
      transition={{ type: 'spring', damping: 30, stiffness: 340 }}
      style={{ bottom: bottomOffset, touchAction: 'pan-y' }}
      className={`pointer-events-auto fixed inset-x-0 z-20 mx-auto flex w-full max-w-[100vw] flex-col overflow-hidden rounded-t-[20px] border border-white/15 border-b-0 bg-black/85 shadow-[0_-8px_40px_rgba(0,0,0,0.45)] backdrop-blur-2xl ${className}`}
    >
      <button
        type="button"
        onClick={cycleSnap}
        aria-label="Adjust panel height"
        className="flex w-full shrink-0 flex-col items-center justify-center"
        style={{ height: HANDLE_HEIGHT }}
      >
        <span className="h-1 w-10 rounded-full bg-white/30" />
      </button>

      <div className="min-h-0 shrink-0 overflow-hidden border-b border-white/10">{peekContent}</div>

      <div
        className={`touch-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain ${snap === 'peek' ? 'pointer-events-none opacity-0' : 'opacity-100'}`}
        aria-hidden={snap === 'peek'}
      >
        {children}
      </div>
    </motion.div>
  );
};
