import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';
import { PremiumVehicleCamera, PremiumCameraConfig } from '../utils/PremiumVehicleCamera';

interface UsePremiumCameraOptions {
  camera: THREE.PerspectiveCamera | null;
  container: HTMLElement | null;
  vehicleGroup: THREE.Object3D | null;
  cameraConfig?: PremiumCameraConfig;
  autoFrame?: boolean;
  onCameraReady?: (camera: PremiumVehicleCamera) => void;
}

/**
 * React hook for managing premium vehicle camera
 * Handles initialization, updates, and cleanup
 */
export function usePremiumCamera({
  camera,
  container,
  vehicleGroup,
  cameraConfig,
  autoFrame = true,
  onCameraReady,
}: UsePremiumCameraOptions) {
  const cameraRef = useRef<PremiumVehicleCamera | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Initialize camera controller
  useEffect(() => {
    if (!camera || !container) {
      return;
    }

    cameraRef.current = new PremiumVehicleCamera(camera, container, cameraConfig);
    onCameraReady?.(cameraRef.current);

    return () => {
      if (cameraRef.current) {
        cameraRef.current.dispose();
        cameraRef.current = null;
      }
    };
  }, [camera, container, cameraConfig, onCameraReady]);

  // Frame vehicle when it's loaded
  useEffect(() => {
    if (!cameraRef.current || !vehicleGroup || !autoFrame) {
      return;
    }

    cameraRef.current.frameVehicle(vehicleGroup, true);
  }, [vehicleGroup, autoFrame]);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      if (cameraRef.current) {
        cameraRef.current.update();
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      cameraRef.current?.onWindowResize();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Public methods
  const resetCamera = useCallback(() => {
    cameraRef.current?.resetToDefault(true);
  }, []);

  const focusOnPart = useCallback((partObject: THREE.Object3D, duration?: number) => {
    cameraRef.current?.focusOnPart(partObject, true, duration);
  }, []);

  const focusOnPartList = useCallback((partObjects: THREE.Object3D[], duration?: number) => {
    if (!partObjects.length) return;

    if (partObjects.length === 1) {
      cameraRef.current?.focusOnPart(partObjects[0], true, duration);
    } else {
      // Create a group to get combined bounding box
      const group = new THREE.Group();
      partObjects.forEach((obj) => group.add(obj.clone()));
      cameraRef.current?.focusOnPart(group, true, duration);
    }
  }, []);

  const animateTo = useCallback(
    (target: {
      horizontalAngle?: number;
      verticalAngle?: number;
      radius?: number;
      fov?: number;
    }) => {
      cameraRef.current?.animateTo(target);
    },
    []
  );

  const getState = useCallback(() => {
    return cameraRef.current?.getState();
  }, []);

  return {
    camera: cameraRef.current,
    resetCamera,
    focusOnPart,
    focusOnPartList,
    animateTo,
    getState,
  };
}
