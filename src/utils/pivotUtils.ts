import * as THREE from 'three';

/**
 * Pivot system utilities for accurate vehicle rotation
 * Ensures the vehicle rotates around its true geometric center
 */

/**
 * Calculates the true geometric center and bounds of an object
 */
export function calculateVehicleBounds(object: THREE.Object3D): {
  boundingBox: THREE.Box3;
  center: THREE.Vector3;
  size: THREE.Vector3;
  height: number;
  depth: number;
  width: number;
} {
  const boundingBox = new THREE.Box3().setFromObject(object);
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());

  return {
    boundingBox,
    center,
    size,
    width: size.x,
    height: size.y,
    depth: size.z,
  };
}

/**
 * Creates a proper pivot structure for the vehicle
 * The pivot group becomes the rotation center, while the vehicle mesh is positioned relative to it
 *
 * Structure:
 * ├─ pivotGroup (rotates, always at world origin 0,0,0)
 * │  └─ vehicleWrapper (positioned to center the mesh geometry)
 * │     └─ vehicleMesh (the actual loaded/created model)
 */
export function createVehiclePivot(
  vehicleMesh: THREE.Object3D,
  _scene: THREE.Scene,
  modelGroup: THREE.Group
): {
  pivotGroup: THREE.Group;
  vehicleWrapper: THREE.Group;
  bounds: ReturnType<typeof calculateVehicleBounds>;
} {
  // Calculate current bounds of the vehicle mesh
  const bounds = calculateVehicleBounds(vehicleMesh);
  const { center } = bounds;

  // Create pivot group - this will be our rotation center (always at world origin)
  const pivotGroup = new THREE.Group();
  pivotGroup.position.set(0, 0, 0);
  pivotGroup.name = 'VehiclePivot';

  // Create wrapper group that holds the positioned vehicle
  const vehicleWrapper = new THREE.Group();
  vehicleWrapper.name = 'VehicleWrapper';

  // Position the wrapper to center the vehicle geometry around the pivot
  // We want the vehicle center to be at world origin
  vehicleWrapper.position.set(-center.x, -center.y, -center.z);

  // Add vehicle mesh to wrapper
  vehicleWrapper.add(vehicleMesh);

  // Add wrapper to pivot
  pivotGroup.add(vehicleWrapper);

  // Add pivot to scene/modelGroup
  modelGroup.add(pivotGroup);

  return {
    pivotGroup,
    vehicleWrapper,
    bounds,
  };
}

/**
 * Fixes an improperly centered vehicle by recalculating its pivot
 * Use this if the vehicle is already in the scene with wrong positioning
 */
export function recalculateVehiclePivot(
  vehicleObject: THREE.Object3D,
  modelGroup: THREE.Group
): {
  pivotGroup: THREE.Group;
  bounds: ReturnType<typeof calculateVehicleBounds>;
} {
  // Calculate bounds before any modifications
  const bounds = calculateVehicleBounds(vehicleObject);
  const { center } = bounds;

  // Remove from current parent
  if (vehicleObject.parent) {
    vehicleObject.parent.remove(vehicleObject);
  }

  // Reset the object's local transform
  vehicleObject.position.set(0, 0, 0);
  vehicleObject.rotation.set(0, 0, 0);
  vehicleObject.scale.set(1, 1, 1);

  // Create new pivot group centered at origin
  const pivotGroup = new THREE.Group();
  pivotGroup.position.set(0, 0, 0);
  pivotGroup.name = 'VehiclePivot';

  // Offset the vehicle so its center is at the pivot
  vehicleObject.position.set(-center.x, -center.y, -center.z);

  // Build hierarchy
  pivotGroup.add(vehicleObject);
  modelGroup.add(pivotGroup);

  return { pivotGroup, bounds };
}

/**
 * Ensures the vehicle mesh bounds are calculated after scale
 * Recalculates pivot after scaling the model
 */
export function recalculatePivotAfterScale(
  vehicleObject: THREE.Object3D,
  scale: number,
  modelGroup: THREE.Group
): {
  pivotGroup: THREE.Group;
  bounds: ReturnType<typeof calculateVehicleBounds>;
  adjustedCenter: THREE.Vector3;
} {
  // Apply scale to the object
  vehicleObject.scale.set(scale, scale, scale);

  // Update world matrix to reflect scale
  vehicleObject.updateMatrixWorld(true);

  // Now calculate bounds with scale applied
  const bounds = calculateVehicleBounds(vehicleObject);
  const { center } = bounds;

  // The adjusted center accounts for the scaled dimensions
  // NOTE: `center` was computed after applying the scale and calling updateMatrixWorld,
  // so it's already in the correct (world) units. Do NOT multiply by scale again —
  // that caused the vehicle wrapper to be offset incorrectly and produced a drift when rotating.
  const adjustedCenter = center.clone();

  // Create or update pivot
  const pivotGroup = new THREE.Group();
  pivotGroup.position.set(0, 0, 0); // explicitly keep pivot at world origin
  pivotGroup.name = 'VehiclePivot';

  // Position vehicle relative to pivot
  // The negative offset centers the vehicle geometry at the pivot point
  // Clamp very small values to zero to avoid cumulative floating point drift
  const clamp = (v: number) => (Math.abs(v) < 1e-8 ? 0 : v);
  vehicleObject.position.set(clamp(-adjustedCenter.x), clamp(-adjustedCenter.y), clamp(-adjustedCenter.z));

  // Remove from old parent and add to pivot
  if (vehicleObject.parent) {
    vehicleObject.parent.remove(vehicleObject);
  }
  pivotGroup.add(vehicleObject);

  // Add pivot to scene
  modelGroup.add(pivotGroup);

  return { pivotGroup, bounds, adjustedCenter };
}

/**
 * Validates that the vehicle pivot is correctly positioned
 * Returns true if pivot is at origin and vehicle is centered
 */
export function validateVehiclePivot(
  pivotGroup: THREE.Group,
  tolerance: number = 0.001
): {
  isValid: boolean;
  pivotAtOrigin: boolean;
  vehicleCentered: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check if pivot is at world origin
  const pivotAtOrigin =
    Math.abs(pivotGroup.position.x) < tolerance &&
    Math.abs(pivotGroup.position.y) < tolerance &&
    Math.abs(pivotGroup.position.z) < tolerance;

  if (!pivotAtOrigin) {
    issues.push(`Pivot not at origin: (${pivotGroup.position.x}, ${pivotGroup.position.y}, ${pivotGroup.position.z})`);
  }

  // Check if vehicle mesh is centered around pivot
  let vehicleCentered = true;
  const boundingBox = new THREE.Box3();

  pivotGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      const meshBox = new THREE.Box3().setFromObject(child);
      boundingBox.union(meshBox);
    }
  });

  const center = boundingBox.getCenter(new THREE.Vector3());
  const isCentered =
    Math.abs(center.x) < tolerance &&
    Math.abs(center.y) < tolerance &&
    Math.abs(center.z) < tolerance;

  if (!isCentered) {
    vehicleCentered = false;
    issues.push(`Vehicle not centered: center at (${center.x.toFixed(4)}, ${center.y.toFixed(4)}, ${center.z.toFixed(4)})`);
  }

  return {
    isValid: pivotAtOrigin && vehicleCentered,
    pivotAtOrigin,
    vehicleCentered,
    issues,
  };
}

/**
 * Gets the rotation center that OrbitControls should use
 * This should be set as controls.target
 */
export function getOrbitControlsTarget(
  pivotGroup: THREE.Group,
  verticalOffset: number = 0.5 // Typical offset to aim at vehicle's center of mass
): THREE.Vector3 {
  // The pivot is at the geometric center, but we might want to offset vertically
  // for visual aesthetics (e.g., aiming at the center of the vehicle body)
  const worldPos = new THREE.Vector3();
  pivotGroup.getWorldPosition(worldPos);
  return new THREE.Vector3(worldPos.x, worldPos.y + verticalOffset, worldPos.z);
}

/**
 * Rotates the vehicle around its pivot by a given angle
 * Useful for programmatic rotation or animation
 */
export function rotateVehicle(
  pivotGroup: THREE.Group,
  deltaY: number, // Rotation in radians around Y axis
  deltaX: number = 0, // Optional: Rotation around X axis
  deltaZ: number = 0  // Optional: Rotation around Z axis
): void {
  if (deltaY !== 0) {
    pivotGroup.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), deltaY);
  }
  if (deltaX !== 0) {
    pivotGroup.rotateOnWorldAxis(new THREE.Vector3(1, 0, 0), deltaX);
  }
  if (deltaZ !== 0) {
    pivotGroup.rotateOnWorldAxis(new THREE.Vector3(0, 0, 1), deltaZ);
  }
}

/**
 * Gets the current rotation of the vehicle around Y axis (0 to 2π)
 */
export function getVehicleRotation(pivotGroup: THREE.Group): number {
  // Extract Y rotation from quaternion
  const euler = new THREE.Euler();
  euler.setFromQuaternion(pivotGroup.quaternion);
  
  // Normalize to 0 to 2π range
  let angle = euler.y;
  while (angle < 0) angle += Math.PI * 2;
  while (angle > Math.PI * 2) angle -= Math.PI * 2;
  
  return angle;
}

/**
 * Resets the vehicle to its default rotation
 */
export function resetVehicleRotation(pivotGroup: THREE.Group): void {
  pivotGroup.quaternion.set(0, 0, 0, 1);
  pivotGroup.rotation.set(0, 0, 0);
}

/**
 * Debug utility: Logs the vehicle pivot state
 */
export function debugVehiclePivot(
  pivotGroup: THREE.Group,
  name: string = 'Vehicle'
): void {
  const validation = validateVehiclePivot(pivotGroup);
  
  console.group(`🚗 ${name} Pivot Debug Info`);
  console.log('Valid:', validation.isValid);
  console.log('Pivot Position:', pivotGroup.position);
  console.log('Pivot Rotation:', {
    x: (pivotGroup.rotation.x * 180 / Math.PI).toFixed(2) + '°',
    y: (pivotGroup.rotation.y * 180 / Math.PI).toFixed(2) + '°',
    z: (pivotGroup.rotation.z * 180 / Math.PI).toFixed(2) + '°',
  });
  console.log('Pivot Scale:', pivotGroup.scale);
  
  if (validation.issues.length > 0) {
    console.warn('Issues Found:');
    validation.issues.forEach(issue => console.warn('  -', issue));
  }
  
  const bounds = calculateVehicleBounds(pivotGroup);
  console.log('Vehicle Bounds:', {
    center: bounds.center,
    size: bounds.size,
    width: bounds.width.toFixed(2),
    height: bounds.height.toFixed(2),
    depth: bounds.depth.toFixed(2),
  });
  
  console.groupEnd();
}
