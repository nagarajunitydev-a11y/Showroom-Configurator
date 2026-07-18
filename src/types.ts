export const MATERIAL_TYPES = {
  PAINT: 'paint',
  METAL: 'metal',
  GLASS: 'glass',
  CARBON: 'carbon',
} as const;

export type MaterialType = (typeof MATERIAL_TYPES)[keyof typeof MATERIAL_TYPES];

export interface VehicleOption {
  id: string;
  name: string;
  price: number;
  hex?: string;
  type?: MaterialType;
  roughness?: number;
  metalness?: number;
  clearcoat?: number;
  placementId?: string;
  variantIds?: string[];
}

export interface VehicleCategory {
  id: string;
  name: string;
  icon: string;
  options: VehicleOption[];
  defaultOptionId: string;
}

export interface AccessoryPlacement {
  id: string;
  name: string;
  position: [number, number, number];
  rotation: [number, number, number];
}

export interface CameraSettings {
  position: [number, number, number];
  target: [number, number, number];
  zoom: number;
  rotation: [number, number, number];
}

export interface VehicleVariant {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  categories: VehicleCategory[];
  cameras: Record<string, [number, number, number]>;
  cameraSettings: CameraSettings;
  accessoryPlacements: AccessoryPlacement[];
}

export interface Vehicle {
  id: string;
  type: string;
  brand: string;
  model: string;
  year: number;
  basePrice: number;
  url: string | null;
  cameras: Record<string, [number, number, number]>;
  categories: VehicleCategory[];
  variants: VehicleVariant[];
  activeVariantId: string;
  cameraSettings: CameraSettings;
}

export type View = 'landing' | 'client_grid' | 'configurator' | 'admin_dashboard';
