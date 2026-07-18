import { useEffect, useState, type RefObject } from 'react';

export function useElementHeight(ref: RefObject<HTMLElement | null>, fallback = 0) {
  const [height, setHeight] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const update = () => setHeight(element.getBoundingClientRect().height);
    update();

    const observer = new ResizeObserver(update);
    observer.observe(element);

    return () => observer.disconnect();
  }, [ref]);

  return height;
}
