/**
 * COMPREHENSIVE EXAMPLE: Premium Vehicle Configurator Camera
 * 
 * This file demonstrates all features of the premium camera system:
 * - Auto-framing vehicles
 * - Smooth orbit and zoom controls
 * - Part focus animations
 * - Configuration options
 * - Error handling and debugging
 */

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { usePremiumCamera } from '../hooks/usePremiumCamera';
import { PremiumCameraConfig } from '../utils/PremiumVehicleCamera';

/**
 * EXAMPLE 1: Basic Setup with Default Configuration
 */
export function BasicVehicleViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [vehicleGroup, setVehicleGroup] = useState<THREE.Object3D | null>(null);

  const { resetCamera } = usePremiumCamera({
    camera,
    container: containerRef.current,
    vehicleGroup,
    autoFrame: true,
  });

  return (
    <div className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
      <button
        onClick={resetCamera}
        className="absolute top-4 right-4 px-4 py-2 bg-white rounded shadow"
      >
        Reset View
      </button>
    </div>
  );
}

/**
 * EXAMPLE 2: Custom Camera Configuration for Specific Look
 */
export function CustomCameraViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [vehicleGroup, setVehicleGroup] = useState<THREE.Object3D | null>(null);

  // Customize camera behavior for specific feel
  const cameraConfig: PremiumCameraConfig = {
    // Show vehicle at 80% of viewport (larger/more dominant)
    viewportPercentage: 80,

    // Slightly wider FOV for more dramatic showroom look
    defaultFov: 40,
    minFov: 35,
    maxFov: 45,

    // Adjust default view angle
    defaultHorizontalAngle: Math.PI / 4,  // 45° instead of 35°
    defaultVerticalAngle: 0.4,             // 23° instead of 18°

    // Allow zooming further for detail inspection
    minOrbitDistance: 2,
    maxOrbitDistance: 30,

    // Slower, more deliberate motion
    orbitDamping: 0.12,
    zoomDamping: 0.15,

    // Less sensitive to mouse movement
    orbitSensitivity: 0.008,
    zoomSensitivity: 0.08,

    // Quicker animations for snappy feel
    animationDuration: 600,
  };

  const { resetCamera, focusOnPart } = usePremiumCamera({
    camera,
    container: containerRef.current,
    vehicleGroup,
    cameraConfig,
    autoFrame: true,
  });

  return (
    <div className="w-full h-full">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}

/**
 * EXAMPLE 3: Part-Focused Camera with Multiple Interaction Points
 */
export function PartFocusedViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [vehicleGroup, setVehicleGroup] = useState<THREE.Object3D | null>(null);
  const [focusedPart, setFocusedPart] = useState<string | null>(null);

  const { resetCamera, focusOnPart, focusOnPartList, animateTo } = usePremiumCamera({
    camera,
    container: containerRef.current,
    vehicleGroup,
    autoFrame: true,
  });

  const handleFocusPart = (partName: string) => {
    if (!vehicleGroup) return;

    const part = vehicleGroup.getObjectByName(partName);
    if (part) {
      focusOnPart(part, true, 800);
      setFocusedPart(partName);
    }
  };

  const handleFocusMultipleParts = (partNames: string[]) => {
    if (!vehicleGroup) return;

    const parts = partNames
      .map(name => vehicleGroup.getObjectByName(name))
      .filter(Boolean) as THREE.Object3D[];

    if (parts.length > 0) {
      focusOnPartList(parts, 800);
      setFocusedPart(`${partNames.length} parts`);
    }
  };

  return (
    <div className="w-full h-full flex">
      {/* Viewer */}
      <div className="flex-1">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Control Panel */}
      <div className="w-72 bg-zinc-900 text-white p-6 space-y-4 overflow-y-auto">
        <h2 className="text-xl font-bold">Focus Camera</h2>

        {/* Individual Part Focus */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Exterior Details</h3>
          <div className="space-y-2">
            <button
              onClick={() => handleFocusPart('Wheels')}
              className={`w-full px-3 py-2 rounded text-sm ${
                focusedPart === 'Wheels'
                  ? 'bg-blue-600'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              Wheels & Rims
            </button>
            <button
              onClick={() => handleFocusPart('Lights')}
              className={`w-full px-3 py-2 rounded text-sm ${
                focusedPart === 'Lights'
                  ? 'bg-blue-600'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              Headlights & Taillights
            </button>
            <button
              onClick={() => handleFocusPart('Grille')}
              className={`w-full px-3 py-2 rounded text-sm ${
                focusedPart === 'Grille'
                  ? 'bg-blue-600'
                  : 'bg-zinc-700 hover:bg-zinc-600'
              }`}
            >
              Front Grille
            </button>
          </div>
        </div>

        {/* Multiple Part Focus */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Package Views</h3>
          <button
            onClick={() => handleFocusMultipleParts(['Wheels', 'Lights'])}
            className="w-full px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded text-sm"
          >
            Wheels + Lights
          </button>
        </div>

        {/* Reset */}
        <button
          onClick={() => {
            resetCamera();
            setFocusedPart(null);
          }}
          className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded text-sm font-semibold"
        >
          Reset to Default View
        </button>

        {/* Status */}
        {focusedPart && (
          <div className="text-xs text-zinc-400 pt-4 border-t border-zinc-700">
            Currently focused on: <span className="text-zinc-200">{focusedPart}</span>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * EXAMPLE 4: Advanced Animation with Custom Orbits
 */
export function AdvancedAnimationViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [vehicleGroup, setVehicleGroup] = useState<THREE.Object3D | null>(null);

  const { animateTo } = usePremiumCamera({
    camera,
    container: containerRef.current,
    vehicleGroup,
    autoFrame: true,
  });

  // Preset camera animations
  const rotateLeft = () =>
    animateTo({
      horizontalAngle: -Math.PI / 3, // -60°
      verticalAngle: 0.3,
    });

  const rotateRight = () =>
    animateTo({
      horizontalAngle: Math.PI / 3, // 60°
      verticalAngle: 0.3,
    });

  const topDown = () =>
    animateTo({
      horizontalAngle: 0,
      verticalAngle: Math.PI / 2.5,
      fov: 40,
    });

  const lowAngle = () =>
    animateTo({
      horizontalAngle: 0,
      verticalAngle: 0.1,
      fov: 32,
    });

  const zoomIn = () =>
    animateTo({
      radius: 4,
      fov: 38,
    });

  const zoomOut = () =>
    animateTo({
      radius: 8,
      fov: 35,
    });

  return (
    <div className="w-full h-full flex flex-col">
      {/* Viewer */}
      <div className="flex-1">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Camera Control Buttons */}
      <div className="bg-black/80 p-4">
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={rotateLeft}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
          >
            ← Rotate Left
          </button>
          <div /> {/* Spacer */}
          <button
            onClick={rotateRight}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white text-sm"
          >
            Rotate Right →
          </button>

          <button
            onClick={topDown}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm"
          >
            Top Down
          </button>
          <button
            onClick={lowAngle}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white text-sm"
          >
            Low Angle
          </button>
          <div /> {/* Spacer */}

          <button
            onClick={zoomIn}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
          >
            Zoom In
          </button>
          <div /> {/* Spacer */}
          <button
            onClick={zoomOut}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded text-white text-sm"
          >
            Zoom Out
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * EXAMPLE 5: Configuration Panel with Real-Time Adjustments
 */
export function ConfigurationPanelViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [vehicleGroup, setVehicleGroup] = useState<THREE.Object3D | null>(null);
  const [config, setConfig] = useState<PremiumCameraConfig>({
    viewportPercentage: 75,
    defaultFov: 35,
    orbitDamping: 0.08,
    zoomDamping: 0.1,
  });

  const { getState } = usePremiumCamera({
    camera,
    container: containerRef.current,
    vehicleGroup,
    cameraConfig: config,
    autoFrame: true,
  });

  const cameraState = getState();

  const updateConfig = (key: keyof PremiumCameraConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-full h-full flex">
      {/* Viewer */}
      <div className="flex-1">
        <div ref={containerRef} className="w-full h-full" />
      </div>

      {/* Configuration Panel */}
      <div className="w-80 bg-zinc-900 text-white p-4 space-y-4 overflow-y-auto">
        <h2 className="text-lg font-bold">Camera Settings</h2>

        {/* Viewport Percentage */}
        <div>
          <label className="text-xs font-semibold mb-2 block">
            Viewport %: {config.viewportPercentage}%
          </label>
          <input
            type="range"
            min="60"
            max="90"
            value={config.viewportPercentage || 75}
            onChange={e => updateConfig('viewportPercentage', Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* FOV */}
        <div>
          <label className="text-xs font-semibold mb-2 block">
            FOV: {config.defaultFov}°
          </label>
          <input
            type="range"
            min="25"
            max="50"
            value={config.defaultFov || 35}
            onChange={e => updateConfig('defaultFov', Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Orbit Damping */}
        <div>
          <label className="text-xs font-semibold mb-2 block">
            Orbit Damping: {(config.orbitDamping || 0.08).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.02"
            max="0.2"
            step="0.01"
            value={config.orbitDamping || 0.08}
            onChange={e => updateConfig('orbitDamping', Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Zoom Damping */}
        <div>
          <label className="text-xs font-semibold mb-2 block">
            Zoom Damping: {(config.zoomDamping || 0.1).toFixed(2)}
          </label>
          <input
            type="range"
            min="0.05"
            max="0.3"
            step="0.01"
            value={config.zoomDamping || 0.1}
            onChange={e => updateConfig('zoomDamping', Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Camera State Display */}
        {cameraState && (
          <div className="pt-4 border-t border-zinc-700">
            <h3 className="text-xs font-semibold mb-2">Camera State</h3>
            <div className="text-xs text-zinc-400 space-y-1">
              <div>FOV: {cameraState.fov.toFixed(2)}°</div>
              <div>Distance: {cameraState.orbit.radius.toFixed(2)}</div>
              <div>
                Angle: {(cameraState.orbit.horizontalAngle * 180 / Math.PI).toFixed(1)}° H,{' '}
                {(cameraState.orbit.verticalAngle * 180 / Math.PI).toFixed(1)}° V
              </div>
              <div>
                Animating: {cameraState.isAnimating ? 'Yes' : 'No'}
              </div>
              <div>
                User Control: {cameraState.isUserInteracting ? 'Yes' : 'No'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * EXAMPLE 6: Production-Ready Component with Error Handling
 */
export function ProductionVehicleViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [vehicleGroup, setVehicleGroup] = useState<THREE.Object3D | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cameraConfig: PremiumCameraConfig = {
    // Production-optimized settings
    viewportPercentage: 75,
    defaultFov: 35,
    minFov: 30,
    maxFov: 40,
    defaultHorizontalAngle: 0.61,
    defaultVerticalAngle: 0.31,
    minOrbitDistance: 2.5,
    maxOrbitDistance: 20,
    animationDuration: 800,
    orbitDamping: 0.08,
    zoomDamping: 0.1,
    orbitSensitivity: 0.01,
    zoomSensitivity: 0.1,
  };

  const { resetCamera, focusOnPart } = usePremiumCamera({
    camera,
    container: containerRef.current,
    vehicleGroup,
    cameraConfig,
    autoFrame: true,
    onCameraReady: (premiumCamera) => {
      console.log('Premium camera initialized');
      console.log('Camera state:', premiumCamera.getState());
    },
  });

  const safeFocusOnPart = (partName: string) => {
    try {
      if (!vehicleGroup) {
        setError('Vehicle not loaded yet');
        return;
      }

      const part = vehicleGroup.getObjectByName(partName);
      if (!part) {
        setError(`Part "${partName}" not found in vehicle model`);
        return;
      }

      focusOnPart(part, true, 800);
      setError(null);
    } catch (err) {
      setError(`Error focusing on part: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  return (
    <div className="w-full h-full relative">
      <div ref={containerRef} className="w-full h-full" />

      {/* Error Display */}
      {error && (
        <div className="absolute top-4 left-4 right-4 bg-red-500 text-white px-4 py-3 rounded shadow">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-4 underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-4 space-x-2">
        <button
          onClick={resetCamera}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}

// Export all examples
export const CameraExamples = {
  Basic: BasicVehicleViewer,
  Custom: CustomCameraViewer,
  PartFocus: PartFocusedViewer,
  Advanced: AdvancedAnimationViewer,
  Configuration: ConfigurationPanelViewer,
  Production: ProductionVehicleViewer,
};
