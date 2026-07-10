import { AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ConfigPanel } from './components/ConfigPanel';
import { ThreeViewer } from './components/ThreeViewer';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ClientGridPage } from './pages/ClientGridPage';
import { LandingPage } from './pages/LandingPage';
import { useAppStore } from './store';

export default function App() {
  const { currentView } = useAppStore();
  const [activeCategory, setActiveCategory] = useState('exterior_paint');

  return (
    <div className="relative h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {currentView === 'landing' && <LandingPage key="landing" />}
        {currentView === 'client_grid' && <ClientGridPage key="grid" />}
        {currentView === 'admin_dashboard' && <AdminDashboardPage key="admin" />}

        {currentView === 'configurator' && (
          <div key="config" className="relative h-full w-full">
            <ThreeViewer />
            <ConfigPanel vehicle={useAppStore.getState().vehicles.find((vehicle) => vehicle.id === useAppStore.getState().activeVehicleId)!} activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
