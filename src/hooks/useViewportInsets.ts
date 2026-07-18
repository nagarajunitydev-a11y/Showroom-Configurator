import { useEffect, useState } from 'react';

export interface ViewportInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

const DEFAULT_INSETS: ViewportInsets = { top: 0, right: 0, bottom: 0, left: 0 };

function readInsets(): ViewportInsets {
  if (typeof document === 'undefined') return DEFAULT_INSETS;

  const probe = document.createElement('div');
  probe.style.cssText = `
    position: fixed;
    visibility: hidden;
    pointer-events: none;
    padding-top: env(safe-area-inset-top, 0px);
    padding-right: env(safe-area-inset-right, 0px);
    padding-bottom: env(safe-area-inset-bottom, 0px);
    padding-left: env(safe-area-inset-left, 0px);
  `;
  document.body.appendChild(probe);

  const styles = getComputedStyle(probe);
  const insets: ViewportInsets = {
    top: parseFloat(styles.paddingTop) || 0,
    right: parseFloat(styles.paddingRight) || 0,
    bottom: parseFloat(styles.paddingBottom) || 0,
    left: parseFloat(styles.paddingLeft) || 0,
  };

  document.body.removeChild(probe);
  return insets;
}

export function useViewportInsets() {
  const [insets, setInsets] = useState<ViewportInsets>(DEFAULT_INSETS);

  useEffect(() => {
    const update = () => setInsets(readInsets());
    update();

    window.addEventListener('resize', update);
    window.addEventListener('orientationchange', update);

    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('orientationchange', update);
    };
  }, []);

  return insets;
}
