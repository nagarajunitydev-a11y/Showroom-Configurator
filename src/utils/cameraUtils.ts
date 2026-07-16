import * as THREE from 'three';

/**
 * Calculates the optimal camera distance and FOV to frame a bounding box
 * while keeping the subject at a specific viewport percentage
 */
export function calculateFramingForBoundingBox(
  boundingBox: THREE.Box3,
  viewportPercentage: number = 75, // 70-85% is optimal
  fov: number = 35,
  aspect: number = 1.6
): { distance: number; fov: number } {
  const size = boundingBox.getSize(new THREE.Vector3());
  const maxDim = Math.max(size.x, size.y, size.z);

  // Calculate FOV in radians
  const vFOV = (fov * Math.PI) / 180;

  // Calculate required distance to frame the object at the desired viewport percentage
  // We use the vertical FOV since that's typically the limiting factor
  const targetHeight = (maxDim / viewportPercentage) * 100;
  const distance = targetHeight / (2 * Math.tan(vFOV / 2));

  return { distance, fov };
}

/**
 * Calculates camera position for an orbit at a given angle and radius
 */
export function calculateOrbitPosition(
  center: THREE.Vector3,
  horizontalAngle: number,
  verticalAngle: number,
  radius: number
): THREE.Vector3 {
  const pos = new THREE.Vector3();
  pos.x = center.x + radius * Math.sin(horizontalAngle) * Math.cos(verticalAngle);
  pos.y = center.y + radius * Math.sin(verticalAngle);
  pos.z = center.z + radius * Math.cos(horizontalAngle) * Math.cos(verticalAngle);
  return pos;
}

/**
 * Converts camera position to orbit angles and radius
 */
export function positionToOrbitAngles(
  cameraPos: THREE.Vector3,
  center: THREE.Vector3
): { horizontalAngle: number; verticalAngle: number; radius: number } {
  const relative = cameraPos.clone().sub(center);
  const radius = relative.length();
  const horizontalAngle = Math.atan2(relative.x, relative.z);
  const verticalAngle = Math.asin(relative.y / radius);

  return { horizontalAngle, verticalAngle, radius };
}

/**
 * Eases value using ease-in-out cubic function for smooth animations
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Clamps a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Normalizes an angle to the -PI to PI range
 */
export function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

/**
 * Interpolates between two angles using the shortest path
 */
export function lerpAngle(a: number, b: number, t: number): number {
  let delta = normalizeAngle(b - a);
  return a + delta * t;
}

/**
 * Gets the center and bounding box of a scene or group
 */
export function getBoundingBoxOfObject(obj: THREE.Object3D): {
  boundingBox: THREE.Box3;
  center: THREE.Vector3;
  size: THREE.Vector3;
  maxDimension: number;
} {
  const boundingBox = new THREE.Box3().setFromObject(obj);
  const center = boundingBox.getCenter(new THREE.Vector3());
  const size = boundingBox.getSize(new THREE.Vector3());
  const maxDimension = Math.max(size.x, size.y, size.z);

  return { boundingBox, center, size, maxDimension };
}

/**
 * Validates camera parameters to prevent clipping and invalid states
 */
export function validateCameraParams(params: {
  fov: number;
  distance: number;
  minDistance: number;
  maxDistance: number;
  verticalAngle: number;
  maxVerticalAngle: number;
}): boolean {
  return (
    params.fov > 0 &&
    params.fov < 180 &&
    params.distance >= params.minDistance &&
    params.distance <= params.maxDistance &&
    params.verticalAngle >= -Math.PI / 2 &&
    params.verticalAngle <= params.maxVerticalAngle
  );
}

/**
 * Calculates optimal orbit radius to prevent clipping with near plane
 */
export function calculateOptimalOrbitRadius(
  boundingBoxSize: THREE.Vector3,
  nearPlane: number = 0.1,
  safetyMargin: number = 1.5
): { minRadius: number; recommendedRadius: number; maxRadius: number } {
  const maxDim = Math.max(boundingBoxSize.x, boundingBoxSize.y, boundingBoxSize.z);
  const minRadius = (maxDim / 2) * safetyMargin + nearPlane;
  const recommendedRadius = minRadius * 1.2;
  const maxRadius = recommendedRadius * 3;

  return { minRadius, recommendedRadius, maxRadius };
}
