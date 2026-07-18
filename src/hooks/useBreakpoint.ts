import { useEffect, useState } from 'react';

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const QUERIES = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
} as const;

function getBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop';
  if (window.matchMedia(QUERIES.mobile).matches) return 'mobile';
  if (window.matchMedia(QUERIES.tablet).matches) return 'tablet';
  return 'desktop';
}

export function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>(getBreakpoint);

  useEffect(() => {
    const mediaQueries = Object.values(QUERIES).map((query) => window.matchMedia(query));
    const handleChange = () => setBreakpoint(getBreakpoint());

    mediaQueries.forEach((mq) => mq.addEventListener('change', handleChange));
    handleChange();

    return () => {
      mediaQueries.forEach((mq) => mq.removeEventListener('change', handleChange));
    };
  }, []);

  return {
    breakpoint,
    isMobile: breakpoint === 'mobile',
    isTablet: breakpoint === 'tablet',
    isDesktop: breakpoint === 'desktop',
    isMobileOrTablet: breakpoint !== 'desktop',
  };
}
