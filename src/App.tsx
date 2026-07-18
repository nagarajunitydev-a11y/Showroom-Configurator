import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { ThreeViewer } from './components/ThreeViewer';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ClientGridPage } from './pages/ClientGridPage';
import { LandingPage } from './pages/LandingPage';
import { useAppStore } from './store';

export default function App() {
  const { currentView, activeVehicleId, vehicles } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('exterior_paint');
  const activeVehicle = vehicles.find((vehicle) => vehicle.id === activeVehicleId) ?? null;

  return (
    <div className="relative h-dvh min-h-dvh w-full max-w-[100vw] overflow-hidden">
      <AnimatePresence mode="wait">
        {currentView === 'landing' && <LandingPage key="landing" />}
        {currentView === 'client_grid' && <ClientGridPage key="grid" />}
        {currentView === 'admin_dashboard' && <AdminDashboardPage key="admin" />}

        {currentView === 'configurator' && activeVehicle && (
          <div key="config" className="configurator-shell relative h-full w-full">
            <ThreeViewer />
            <ConfigPanel vehicle={activeVehicle} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
