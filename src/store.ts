import { create } from 'zustand';
import { createVehicleId } from './services/vehicleService';
import { MATERIAL_TYPES, type Vehicle, type VehicleCategory, type View } from './types';

const DEFAULT_CATEGORIES: VehicleCategory[] = [
  {
    id: 'exterior_paint',
    name: 'Exterior Paint',
    icon: 'Palette',
    options: [
      { id: 'p_white', name: 'Glacier White', price: 0, hex: '#ffffff', type: MATERIAL_TYPES.PAINT, roughness: 0.1, metalness: 0.1 },
      { id: 'p_black', name: 'Obsidian Black', price: 1200, hex: '#0a0a0a', type: MATERIAL_TYPES.PAINT, roughness: 0.05, metalness: 0.5, clearcoat: 1 },
      { id: 'p_red', name: 'Rosso Corsa', price: 2500, hex: '#cc0000', type: MATERIAL_TYPES.PAINT, roughness: 0.2, metalness: 0.4, clearcoat: 0.8 },
      { id: 'p_matte_grey', name: 'Stealth Grey (Matte)', price: 3500, hex: '#333333', type: MATERIAL_TYPES.PAINT, roughness: 0.8, metalness: 0.2, clearcoat: 0 },
    ],
    defaultOptionId: 'p_white',
  },
  {
    id: 'wheels',
    name: 'Wheels & Alloys',
    icon: 'CircleDot',
    options: [
      { id: 'w_20_silver', name: '20" Aero Silver', price: 0, hex: '#e0e0e0', type: MATERIAL_TYPES.METAL, roughness: 0.2, metalness: 1 },
      { id: 'w_21_black', name: '21" Turbine Black', price: 2000, hex: '#111111', type: MATERIAL_TYPES.METAL, roughness: 0.4, metalness: 0.8 },
    ],
    defaultOptionId: 'w_20_silver',
  },
];

const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v-001',
    type: 'Car',
    brand: 'Aero',
    model: 'Stratos Concept',
    year: 2026,
    basePrice: 85000,
    url: null,
    cameras: {
      default: [5, 2, 5],
      front: [0, 1, 6],
      side: [6, 1, 0],
      wheel: [3, 0.5, 2.5],
      rear: [0, 1.5, -6],
    },
    categories: DEFAULT_CATEGORIES,
  },
];

export interface AppStoreState {
  currentView: View;
  vehicles: Vehicle[];
  activeVehicleId: string | null;
  isAdminAuthed: boolean;
  selections: Record<string, string>;
  history: Record<string, string>[];
  historyIndex: number;
  activeCameraPreset: string;
}

interface AppStoreActions {
  setView: (view: View) => void;
  adminLogin: (password: string) => boolean;
  adminLogout: () => void;
  addVehicle: (vehicleData: Omit<Vehicle, 'id' | 'url' | 'cameras' | 'categories'>, file: File) => void;
  removeVehicle: (id: string) => void;
  initializeConfigurator: (vehicleId: string) => void;
  selectOption: (categoryId: string, optionId: string) => void;
  undo: () => void;
  redo: () => void;
  setCameraPreset: (preset: string) => void;
  getTotalPrice: () => number;
}

export type AppStore = AppStoreState & AppStoreActions;

export const useAppStore = create<AppStore>()((set, get) => ({
  currentView: 'landing',
  vehicles: INITIAL_VEHICLES,
  activeVehicleId: null,
  isAdminAuthed: false,
  selections: {},
  history: [],
  historyIndex: -1,
  activeCameraPreset: 'default',

  setView: (view) => set({ currentView: view }),

  adminLogin: (password) => {
    if (password === 'admin') {
      set({ isAdminAuthed: true, currentView: 'admin_dashboard' });
      return true;
    }
    return false;
  },

  adminLogout: () => set({ isAdminAuthed: false, currentView: 'landing' }),

  addVehicle: (vehicleData, file) => {
    const newVehicle: Vehicle = {
      ...vehicleData,
      id: createVehicleId(),
      url: URL.createObjectURL(file),
      cameras: INITIAL_VEHICLES[0].cameras,
      categories: DEFAULT_CATEGORIES,
    };
    set((state) => ({ vehicles: [...state.vehicles, newVehicle] }));
  },

  removeVehicle: (id) => set((state) => ({ vehicles: state.vehicles.filter((vehicle) => vehicle.id !== id) })),

  initializeConfigurator: (vehicleId) => {
    const vehicle = get().vehicles.find((entry) => entry.id === vehicleId);
    if (!vehicle) return;

    const initialSelections: Record<string, string> = {};
    vehicle.categories.forEach((category) => {
      initialSelections[category.id] = category.defaultOptionId;
    });

    set({
      activeVehicleId: vehicleId,
      selections: initialSelections,
      history: [initialSelections],
      historyIndex: 0,
      activeCameraPreset: 'default',
      currentView: 'configurator',
    });
  },

  selectOption: (categoryId, optionId) => {
    set((state) => {
      const newSelections = { ...state.selections, [categoryId]: optionId };
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newSelections);

      let newCamera = state.activeCameraPreset;
      if (categoryId === 'wheels' || categoryId === 'calipers') newCamera = 'wheel';
      else if (categoryId === 'exterior_paint') newCamera = 'default';

      return {
        selections: newSelections,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        activeCameraPreset: newCamera,
      };
    });
  },

  undo: () => set((state) => ({
    historyIndex: Math.max(0, state.historyIndex - 1),
    selections: state.history[Math.max(0, state.historyIndex - 1)] || state.selections,
  })),

  redo: () => set((state) => ({
    historyIndex: Math.min(state.history.length - 1, state.historyIndex + 1),
    selections: state.history[Math.min(state.history.length - 1, state.historyIndex + 1)] || state.selections,
  })),

  setCameraPreset: (preset) => set({ activeCameraPreset: preset }),

  getTotalPrice: () => {
    const state = get();
    const vehicle = state.vehicles.find((entry) => entry.id === state.activeVehicleId);
    if (!vehicle) return 0;

    let total = vehicle.basePrice;
    vehicle.categories.forEach((category) => {
      const selectedOptionId = state.selections[category.id];
      const option = category.options.find((entry) => entry.id === selectedOptionId);
      if (option) total += option.price;
    });
    return total;
  },
}));
