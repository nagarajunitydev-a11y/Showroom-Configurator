import * as THREE from 'three';
import {
  calculateFramingForBoundingBox,
  calculateOrbitPosition,
  positionToOrbitAngles,
  easeInOutCubic,
  clamp,
  normalizeAngle,
  lerpAngle,
} from '../utils/cameraUtils';

export interface PremiumCameraConfig {
  // Viewport framing (70-85% recommended)
  viewportPercentage?: number;

  // Field of view (30-40° recommended for cinematic look)
  defaultFov?: number;
  minFov?: number;
  maxFov?: number;

  // Default three-quarter view angles
  defaultHorizontalAngle?: number; // 35° = ~0.61 radians
  defaultVerticalAngle?: number; // 18° = ~0.31 radians

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

interface AnimationState {
  isAnimating: boolean;
  startTime: number;
  duration: number;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  startFov: number;
  targetFov: number;
}

interface OrbitState {
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
 * Premium 3D vehicle configurator camera controller
 * - Orbits around a vehicle's center pivot
 * - Auto-frames the vehicle in 70-85% of viewport
 * - Smooth damping and animations
 * - Prevents clipping, flipping, and excessive panning
 * - Default cinematic three-quarter view
 */
export class PremiumVehicleCamera {
  private camera: THREE.PerspectiveCamera;
  private container: HTMLElement;
  private config: Required<PremiumCameraConfig>;
  private targetCenter: THREE.Vector3 = new THREE.Vector3();
  private orbitState: OrbitState;
  private animationState: AnimationState | null = null;
  private isUserInteracting = false;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  // Event listeners tracking
  private mouseDownListener: ((e: MouseEvent) => void) | null = null;
  private mouseUpListener: ((e: MouseEvent) => void) | null = null;
  private mouseMoveListener: ((e: MouseEvent) => void) | null = null;
  private wheelListener: ((e: WheelEvent) => void) | null = null;

  constructor(
    camera: THREE.PerspectiveCamera,
    container: HTMLElement,
    userConfig?: PremiumCameraConfig
  ) {
    this.camera = camera;
    this.container = container;

    // Merge user config with defaults
    this.config = {
      viewportPercentage: userConfig?.viewportPercentage ?? 75,
      defaultFov: userConfig?.defaultFov ?? 35,
      minFov: userConfig?.minFov ?? 30,
      maxFov: userConfig?.maxFov ?? 40,
      defaultHorizontalAngle: userConfig?.defaultHorizontalAngle ?? 0.61, // 35°
      defaultVerticalAngle: userConfig?.defaultVerticalAngle ?? 0.31, // 18°
      minOrbitDistance: userConfig?.minOrbitDistance ?? 3,
      maxOrbitDistance: userConfig?.maxOrbitDistance ?? 20,
      verticalAngleConstraint: userConfig?.verticalAngleConstraint ?? (Math.PI / 2 + 0.1),
      animationDuration: userConfig?.animationDuration ?? 800,
      orbitDamping: userConfig?.orbitDamping ?? 0.08,
      zoomDamping: userConfig?.zoomDamping ?? 0.1,
      orbitSensitivity: userConfig?.orbitSensitivity ?? 0.01,
      zoomSensitivity: userConfig?.zoomSensitivity ?? 0.1,
      nearPlane: userConfig?.nearPlane ?? 0.1,
      farPlane: userConfig?.farPlane ?? 100,
    };

    // Initialize orbit state
    this.orbitState = {
      horizontalAngle: this.config.defaultHorizontalAngle,
      verticalAngle: this.config.defaultVerticalAngle,
      radius: 5,
      targetHorizontalAngle: this.config.defaultHorizontalAngle,
      targetVerticalAngle: this.config.defaultVerticalAngle,
      targetRadius: 5,
      fov: this.config.defaultFov,
      targetFov: this.config.defaultFov,
    };

    this.setupCamera();
    this.setupEventListeners();
  }

  private setupCamera() {
    this.camera.fov = this.config.defaultFov;
    this.camera.near = this.config.nearPlane;
    this.camera.far = this.config.farPlane;
    this.camera.updateProjectionMatrix();
  }

  private setupEventListeners() {
    this.mouseDownListener = () => {
      this.isUserInteracting = true;
    };

    this.mouseUpListener = () => {
      this.isUserInteracting = false;
    };

    this.mouseMoveListener = (e: MouseEvent) => {
      if (!this.isUserInteracting) return;

      const deltaX = e.movementX || 0;
      const deltaY = e.movementY || 0;

      // Update target angles based on mouse movement
      this.orbitState.targetHorizontalAngle -= deltaX * this.config.orbitSensitivity;
      this.orbitState.targetVerticalAngle += deltaY * this.config.orbitSensitivity;

      // Clamp vertical angle to prevent flipping
      this.orbitState.targetVerticalAngle = clamp(
        this.orbitState.targetVerticalAngle,
        -this.config.verticalAngleConstraint,
        this.config.verticalAngleConstraint
      );
    };

    this.wheelListener = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomDelta = e.deltaY > 0 ? 1 : -1;
      this.orbitState.targetRadius *= 1 + zoomDelta * this.config.zoomSensitivity;

      // Clamp radius within bounds
      this.orbitState.targetRadius = clamp(
        this.orbitState.targetRadius,
        this.config.minOrbitDistance,
        this.config.maxOrbitDistance
      );
    };

    this.container.addEventListener('mousedown', this.mouseDownListener);
    this.container.addEventListener('mouseup', this.mouseUpListener);
    this.container.addEventListener('mousemove', this.mouseMoveListener);
    this.container.addEventListener('wheel', this.wheelListener, { passive: false });
  }

  /**
   * Remove all event listeners
   */
  public dispose() {
    if (this.mouseDownListener) this.container.removeEventListener('mousedown', this.mouseDownListener);
    if (this.mouseUpListener) this.container.removeEventListener('mouseup', this.mouseUpListener);
    if (this.mouseMoveListener) this.container.removeEventListener('mousemove', this.mouseMoveListener);
    if (this.wheelListener) this.container.removeEventListener('wheel', this.wheelListener);
  }

  /**
   * Auto-frame a vehicle based on its bounding box
   * Updates the orbit center and radius to keep the vehicle in 70-85% of viewport
   */
  public frameVehicle(vehicleGroup: THREE.Object3D, animate: boolean = false) {
    // Calculate bounding box of vehicle
    const boundingBox = new THREE.Box3().setFromObject(vehicleGroup);
    const center = boundingBox.getCenter(new THREE.Vector3());
    const size = boundingBox.getSize(new THREE.Vector3());

    // Update target center
    this.targetCenter.copy(center);

    // Calculate optimal framing
    const { distance } = calculateFramingForBoundingBox(
      boundingBox,
      this.config.viewportPercentage,
      this.orbitState.targetFov,
      this.camera.aspect
    );

    // Update orbit radius
    if (animate) {
      this.animateTo({
        horizontalAngle: this.orbitState.targetHorizontalAngle,
        verticalAngle: this.orbitState.targetVerticalAngle,
        radius: distance,
      });
    } else {
      this.orbitState.targetRadius = distance;
      this.orbitState.radius = distance;
    }
  }

  /**
   * Animate camera to a specific position with easing
   */
  public animateTo(
    target: {
      horizontalAngle?: number;
      verticalAngle?: number;
      radius?: number;
      fov?: number;
    },
    duration?: number
  ) {
    const startPos = calculateOrbitPosition(
      this.targetCenter,
      this.orbitState.horizontalAngle,
      this.orbitState.verticalAngle,
      this.orbitState.radius
    );

    const targetRadius = target.radius ?? this.orbitState.targetRadius;
    const targetTargetHorizontalAngle = target.horizontalAngle ?? this.orbitState.targetHorizontalAngle;
    const targetVerticalAngle = target.verticalAngle ?? this.orbitState.targetVerticalAngle;

    const targetPos = calculateOrbitPosition(
      this.targetCenter,
      targetTargetHorizontalAngle,
      targetVerticalAngle,
      targetRadius
    );

    this.animationState = {
      isAnimating: true,
      startTime: performance.now(),
      duration: duration ?? this.config.animationDuration,
      startPos,
      targetPos,
      startFov: this.orbitState.fov,
      targetFov: target.fov ?? this.orbitState.targetFov,
    };

    // Update target angles immediately
    this.orbitState.targetHorizontalAngle = targetTargetHorizontalAngle;
    this.orbitState.targetVerticalAngle = clamp(
      targetVerticalAngle,
      -this.config.verticalAngleConstraint,
      this.config.verticalAngleConstraint
    );
    this.orbitState.targetRadius = clamp(
      targetRadius,
      this.config.minOrbitDistance,
      this.config.maxOrbitDistance
    );
    this.orbitState.targetFov = clamp(
      target.fov ?? this.orbitState.targetFov,
      this.config.minFov,
      this.config.maxFov
    );
  }

  /**
   * Reset camera to default three-quarter view
   */
  public resetToDefault(animate: boolean = true) {
    if (animate) {
      this.animateTo({
        horizontalAngle: this.config.defaultHorizontalAngle,
        verticalAngle: this.config.defaultVerticalAngle,
        fov: this.config.defaultFov,
      });
    } else {
      this.orbitState.targetHorizontalAngle = this.config.defaultHorizontalAngle;
      this.orbitState.targetVerticalAngle = this.config.defaultVerticalAngle;
      this.orbitState.targetFov = this.config.defaultFov;
    }
  }

  /**
   * Focus on a specific part with smooth animation
   * partBounds: Bounding box of the part to focus on
   */
  public focusOnPart(partObject: THREE.Object3D, animate: boolean = true, duration?: number) {
    const partBounds = new THREE.Box3().setFromObject(partObject);
    const partCenter = partBounds.getCenter(new THREE.Vector3());
    const partSize = partBounds.getSize(new THREE.Vector3());

    // Create a temporary bounding box for the part to calculate framing
    const tempBox = new THREE.Box3();
    tempBox.setFromCenterAndSize(partCenter, partSize);

    const { distance, fov } = calculateFramingForBoundingBox(
      tempBox,
      this.config.viewportPercentage,
      this.config.defaultFov,
      this.camera.aspect
    );

    // Calculate angle to face the part center
    const toCenterPart = partCenter.clone().sub(this.targetCenter);
    const horizontalAngle = Math.atan2(toCenterPart.x, toCenterPart.z);
    const verticalAngle = Math.atan2(toCenterPart.y, toCenterPart.length());

    if (animate) {
      this.animateTo(
        {
          horizontalAngle,
          verticalAngle: Math.max(verticalAngle, this.config.defaultVerticalAngle * 0.5),
          radius: distance * 0.9,
          fov: Math.min(fov, this.config.maxFov),
        },
        duration
      );
    } else {
      this.orbitState.targetHorizontalAngle = horizontalAngle;
      this.orbitState.targetVerticalAngle = Math.max(verticalAngle, this.config.defaultVerticalAngle * 0.5);
      this.orbitState.targetRadius = distance * 0.9;
      this.orbitState.targetFov = Math.min(fov, this.config.maxFov);
    }
  }

  /**
   * Update camera position based on current state (called every frame)
   */
  public update(deltaTime: number = 0) {
    // Handle animation
    if (this.animationState && this.animationState.isAnimating) {
      const elapsed = performance.now() - this.animationState.startTime;
      const progress = Math.min(elapsed / this.animationState.duration, 1);
      const eased = easeInOutCubic(progress);

      // Interpolate position
      const currentPos = this.animationState.startPos.clone().lerp(this.animationState.targetPos, eased);
      const angles = positionToOrbitAngles(currentPos, this.targetCenter);

      this.orbitState.horizontalAngle = angles.horizontalAngle;
      this.orbitState.verticalAngle = angles.verticalAngle;
      this.orbitState.radius = angles.radius;

      // Interpolate FOV
      this.orbitState.fov = this.animationState.startFov + (this.animationState.targetFov - this.animationState.startFov) * eased;

      if (progress >= 1) {
        this.animationState.isAnimating = false;
        this.animationState = null;
      }
    } else {
      // Apply damping to smoothly transition to target values
      const orbitDamping = this.isUserInteracting ? 0.5 : this.config.orbitDamping;
      const zoomDamping = this.config.zoomDamping;

      this.orbitState.horizontalAngle = lerpAngle(
        this.orbitState.horizontalAngle,
        this.orbitState.targetHorizontalAngle,
        orbitDamping
      );

      this.orbitState.verticalAngle +=
        (this.orbitState.targetVerticalAngle - this.orbitState.verticalAngle) * orbitDamping;

      this.orbitState.radius += (this.orbitState.targetRadius - this.orbitState.radius) * zoomDamping;

      this.orbitState.fov += (this.orbitState.targetFov - this.orbitState.fov) * zoomDamping;
    }

    // Clamp values
    this.orbitState.radius = clamp(
      this.orbitState.radius,
      this.config.minOrbitDistance,
      this.config.maxOrbitDistance
    );

    this.orbitState.verticalAngle = clamp(
      this.orbitState.verticalAngle,
      -this.config.verticalAngleConstraint,
      this.config.verticalAngleConstraint
    );

    this.orbitState.fov = clamp(
      this.orbitState.fov,
      this.config.minFov,
      this.config.maxFov
    );

    // Calculate camera position
    const newPos = calculateOrbitPosition(
      this.targetCenter,
      this.orbitState.horizontalAngle,
      this.orbitState.verticalAngle,
      this.orbitState.radius
    );

    this.camera.position.copy(newPos);
    this.camera.lookAt(this.targetCenter);

    // Update FOV
    if (Math.abs(this.camera.fov - this.orbitState.fov) > 0.01) {
      this.camera.fov = this.orbitState.fov;
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * Handle window resize
   */
  public onWindowResize() {
    if (this.camera.aspect !== this.container.clientWidth / this.container.clientHeight) {
      this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
      this.camera.updateProjectionMatrix();
    }
  }

  /**
   * Get current camera state
   */
  public getState() {
    return {
      position: this.camera.position.clone(),
      target: this.targetCenter.clone(),
      fov: this.orbitState.fov,
      orbit: {
        horizontalAngle: this.orbitState.horizontalAngle,
        verticalAngle: this.orbitState.verticalAngle,
        radius: this.orbitState.radius,
      },
      isAnimating: this.animationState?.isAnimating ?? false,
      isUserInteracting: this.isUserInteracting,
    };
  }

  /**
   * Set camera target center
   */
  public setTargetCenter(center: THREE.Vector3) {
    this.targetCenter.copy(center);
  }

  /**
   * Get camera target center
   */
  public getTargetCenter(): THREE.Vector3 {
    return this.targetCenter.clone();
  }
}
