/**
 * Type definitions for Premium Vehicle Camera System
 * Export all types and interfaces for external use
 */

import * as THREE from 'three';

/**
 * Configuration options for premium vehicle camera
 */
export interface PremiumCameraConfig {
  // Viewport framing (70-85% recommended)
  viewportPercentage?: number;

  // Field of view (30-40° recommended for cinematic)
  defaultFov?: number;
  minFov?: number;
  maxFov?: number;

  // Default three-quarter view angles
  defaultHorizontalAngle?: number; // 0.61 rad (~35°)
  defaultVerticalAngle?: number;   // 0.31 rad (~18°)

  // Orbit constraints
  minOrbitDistance?: number;
  maxOrbitDistance?: number;
  verticalAngleConstraint?: number; // Max vertical angle (prevents flipping)

  // Animation and smoothing
  animationDuration?: number; // ms
  orbitDamping?: number; // 0-1, higher = more damping
  zoomDamping?: number;

  // Interaction sensitivity
  orbitSensitivity?: number;
  zoomSensitivity?: number;

  // Camera near/far planes
  nearPlane?: number;
  farPlane?: number;
}

/**
 * Orbit state including current position and target position
 */
export interface OrbitState {
  horizontalAngle: number;
  verticalAngle: number;
  radius: number;
  targetHorizontalAngle: number;
  targetVerticalAngle: number;
  targetRadius: number;
  fov: number;
  targetFov: number;
}

/**
 * Animation state for smooth transitions
 */
export interface AnimationState {
  isAnimating: boolean;
  startTime: number;
  duration: number;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startFov: number;
  targetFov: number;
}

/**
 * Camera state returned from getState()
 */
export interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  orbit: {
    horizontalAngle: number;
    verticalAngle: number;
    radius: number;
  };
  isAnimating: boolean;
  isUserInteracting: boolean;
}

/**
 * Framing calculation result
 */
export interface FramingResult {
  distance: number;
  fov: number;
}

/**
 * Orbit angles calculation result
 */
export interface OrbitAngles {
  horizontalAngle: number;
  verticalAngle: number;
  radius: number;
}

/**
 * Bounding box information
 */
export interface BoundingBoxInfo {
  boundingBox: THREE.Box3;
  center: THREE.Vector3;
  size: THREE.Vector3;
  maxDimension: number;
}

/**
 * Orbit radius calculation result
 */
export interface OrbitRadiusConstraints {
  minRadius: number;
  recommendedRadius: number;
  maxRadius: number;
}

/**
 * Animation target with partial configuration
 */
export interface AnimationTarget {
  horizontalAngle?: number;
  verticalAngle?: number;
  radius?: number;
  fov?: number;
}

/**
 * Part focus options
 */
export interface PartFocusOptions {
  animate?: boolean;
  duration?: number;
  offset?: number; // Additional offset from calculated distance
}

/**
 * Hook options for usePremiumCamera
 */
export interface UsePremiumCameraOptions {
  camera: THREE.PerspectiveCamera | null;
  container: HTMLElement | null;
  vehicleGroup: THREE.Object3D | null;
  cameraConfig?: PremiumCameraConfig;
  autoFrame?: boolean;
  onCameraReady?: (camera: any) => void; // PremiumVehicleCamera type
}

/**
 * Hook return value from usePremiumCamera
 */
export interface UsePremiumCameraReturn {
  camera: any; // PremiumVehicleCamera | null
  resetCamera: () => void;
  focusOnPart: (part: THREE.Object3D, animate?: boolean, duration?: number) => void;
  focusOnPartList: (parts: THREE.Object3D[], duration?: number) => void;
  animateTo: (target: AnimationTarget, duration?: number) => void;
  getState: () => CameraState | undefined;
}

/**
 * Camera preset configuration
 */
export interface CameraPreset {
  name: string;
  horizontalAngle: number;
  verticalAngle: number;
  radius?: number;
  fov?: number;
}

/**
 * Default camera presets
 */
export const DEFAULT_CAMERA_PRESETS: Record<string, CameraPreset> = {
  default: {
    name: 'Default Three-Quarter',
    horizontalAngle: 0.61, // 35°
    verticalAngle: 0.31,   // 18°
  },
  frontLeft: {
    name: 'Front Left',
    horizontalAngle: Math.PI / 6, // 30°
    verticalAngle: 0.3,
  },
  frontRight: {
    name: 'Front Right',
    horizontalAngle: -Math.PI / 6, // -30°
    verticalAngle: 0.3,
  },
  rear: {
    name: 'Rear',
    horizontalAngle: Math.PI, // 180°
    verticalAngle: 0.3,
  },
  rearLeft: {
    name: 'Rear Left',
    horizontalAngle: (Math.PI * 5) / 6, // 150°
    verticalAngle: 0.3,
  },
  rearRight: {
    name: 'Rear Right',
    horizontalAngle: (-Math.PI * 5) / 6, // -150°
    verticalAngle: 0.3,
  },
  left: {
    name: 'Left Profile',
    horizontalAngle: Math.PI / 2, // 90°
    verticalAngle: 0.2,
  },
  right: {
    name: 'Right Profile',
    horizontalAngle: -Math.PI / 2, // -90°
    verticalAngle: 0.2,
  },
  topDown: {
    name: 'Top Down',
    horizontalAngle: 0,
    verticalAngle: Math.PI / 2.2,
  },
  lowAngle: {
    name: 'Low Angle',
    horizontalAngle: 0,
    verticalAngle: 0.1,
  },
};

/**
 * Default camera configuration values
 */
export const DEFAULT_CAMERA_CONFIG: Required<PremiumCameraConfig> = {
  viewportPercentage: 75,
  defaultFov: 35,
  minFov: 30,
  maxFov: 40,
  defaultHorizontalAngle: 0.61,
  defaultVerticalAngle: 0.31,
  minOrbitDistance: 3,
  maxOrbitDistance: 20,
  verticalAngleConstraint: Math.PI / 2 + 0.1,
  animationDuration: 800,
  orbitDamping: 0.08,
  zoomDamping: 0.1,
  orbitSensitivity: 0.01,
  zoomSensitivity: 0.1,
  nearPlane: 0.1,
  farPlane: 100,
};

/**
 * Helper type for camera animation callbacks
 */
export type CameraAnimationCallback = (state: CameraState) => void;

/**
 * Helper type for camera state change listeners
 */
export type CameraStateListener = (state: CameraState) => void;
