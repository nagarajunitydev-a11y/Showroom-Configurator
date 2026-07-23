import { AnimatePresence } from 'framer-motion';
import { Suspense, lazy, useEffect, useState } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ClientGridPage } from './pages/ClientGridPage';
import { useAppStore } from './store';
import type { View } from './types';

const ThreeViewer = lazy(() => import('./components/ThreeViewer').then((module) => ({ default: module.ThreeViewer })));

const getViewFromPath = (path: string): View => {
  switch (path) {
    case '/':
    case '/showroom':
      return 'client_grid';
    case '/admin':
      return 'client_grid';
    case '/configurator':
      return 'configurator';
    default:
      return 'client_grid';
  }
};

export default function App() {
  const { currentView, activeVehicleId, vehicles, setView } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('exterior_paint');

  useEffect(() => {
    const updateVh = () => {
      const height = window.visualViewport?.height ?? window.innerHeight;
      const vh = height * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    updateVh();
    window.addEventListener('resize', updateVh);
    window.addEventListener('orientationchange', updateVh);
    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', updateVh);
      visualViewport.addEventListener('scroll', updateVh);
    }

    return () => {
      window.removeEventListener('resize', updateVh);
      window.removeEventListener('orientationchange', updateVh);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', updateVh);
        visualViewport.removeEventListener('scroll', updateVh);
      }
    };
  }, []);

  useEffect(() => {
    const syncViewFromLocation = () => {
      const nextView = getViewFromPath(window.location.pathname);
      if (nextView !== currentView) {
        setView(nextView, { replace: true });
      }
    };

    syncViewFromLocation();
    window.addEventListener('popstate', syncViewFromLocation);
    return () => window.removeEventListener('popstate', syncViewFromLocation);
  }, [currentView, setView]);

  useEffect(() => {
    if (currentView === 'configurator' && !activeVehicleId) {
      setView('client_grid', { replace: true });
    }
  }, [activeVehicleId, currentView, setView]);

  const activeVehicle = vehicles.find((vehicle) => vehicle.id === activeVehicleId) ?? null;

  return (
    <div className="relative h-dvh min-h-dvh w-full max-w-[100vw] overflow-hidden">
      <AnimatePresence mode="wait">
        {currentView === 'client_grid' && <ClientGridPage key="grid" />}
        {currentView === 'admin_dashboard' && <AdminDashboardPage key="admin" />}

        {currentView === 'configurator' && activeVehicle && (
          <div key="config" className="configurator-shell relative h-full w-full">
            <Suspense fallback={null}>
              <ThreeViewer />
            </Suspense>
            <ConfigPanel vehicle={activeVehicle} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
