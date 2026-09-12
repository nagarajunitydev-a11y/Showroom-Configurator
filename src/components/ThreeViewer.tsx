import { useEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { Maximize, Minimize, RefreshCcw, RotateCw, ZoomIn, ZoomOut } from 'lucide-react';
import { useAppStore } from '../store';
import { getVehicleModelUrl } from '../services/modelCatalog';
import {
  createVehiclePivot,
  recalculatePivotAfterScale,
  validateVehiclePivot,
  debugVehiclePivot,
  getOrbitControlsTarget,
  calculateVehicleBounds,
} from '../utils/pivotUtils';

interface ThreeRefState {
  mats: Record<string, THREE.Material>;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  state: { targetCameraPos: THREE.Vector3 | null };
  pivotGroup: THREE.Group | null;
  scene: THREE.Scene;
  renderer: THREE.WebGLRenderer;
  zoomBy: (factor: number) => void;
  resetView: () => void;
  toggleAutoRotate: () => boolean;
}

function DockButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-200 ${
        active
          ? 'bg-blue-600 text-white shadow-[0_6px_18px_-4px_rgba(37,99,235,0.55)]'
          : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600 active:scale-95'
      }`}
    >
      {children}
    </button>
  );
}

export const ThreeViewer = () => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const threeRef = useRef<ThreeRefState | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { selections, activeVehicleId, vehicles, activeCameraPreset } = useAppStore();
  const vehicle = vehicles.find((entry) => entry.id === activeVehicleId);
  const resolvedModelUrl = getVehicleModelUrl(vehicle);

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(document.fullscreenElement === rootRef.current);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!rootRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      rootRef.current.requestFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    if (!containerRef.current || !vehicle) return;

    let isMounted = true;
    setIsModelLoading(Boolean(resolvedModelUrl));
    setModelLoadProgress(0);

    const variant = vehicle.variants.find((entry) => entry.id === vehicle.activeVariantId) ?? vehicle.variants[0] ?? null;

    // ============================================
    // SCENE SETUP
    // ============================================
    const scene = new THREE.Scene();
    scene.background = null;
    scene.fog = new THREE.Fog('#e2eafb', 10, 30);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);

    // ============================================
    // LIGHTING & ENVIRONMENT
    // ============================================
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    // The generator's own intermediate render targets/materials aren't needed once the
    // environment texture has been produced — free them immediately rather than leaking
    // them on every vehicle switch (each switch tears down and recreates the whole scene).
    pmremGenerator.dispose();

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(10, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    // Tightly frame the shadow camera around the vehicle (scaled to ~4 units) instead of
    // three.js's default ±5 frustum with far=500 — this keeps the shadow map resolution
    // concentrated on the model instead of being wasted on empty space, producing a crisper,
    // properly contact-grounded shadow.
    dirLight.shadow.camera.near = 1;
    dirLight.shadow.camera.far = 20;
    dirLight.shadow.camera.left = -4;
    dirLight.shadow.camera.right = 4;
    dirLight.shadow.camera.top = 4;
    dirLight.shadow.camera.bottom = -4;
    dirLight.shadow.camera.updateProjectionMatrix();
    dirLight.shadow.bias = -0.0015;
    dirLight.shadow.normalBias = 0.02;
    scene.add(dirLight);

    // ============================================
    // MATERIALS
    // ============================================
    const mats = {
      body: new THREE.MeshPhysicalMaterial({ clearcoatRoughness: 0.1, envMapIntensity: 1.5 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x000000,
        transmission: 1,
        opacity: 1,
        metalness: 0,
        roughness: 0.05,
        ior: 1.5,
        thickness: 0.01,
        envMapIntensity: 1.5,
        side: THREE.DoubleSide,
      }),
      lights: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 }),
      rubber: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.1 }),
      wheel: new THREE.MeshStandardMaterial({ envMapIntensity: 2.0 }),
    };

    // ============================================
    // MODEL GROUP (For potential future multi-object scenes)
    // ============================================
    const modelGroup = new THREE.Group();
    modelGroup.name = 'ModelGroup';
    scene.add(modelGroup);

    let pivotGroup: THREE.Group | null = null;
    // Tracks whichever mesh tree (loaded GLTF or procedural fallback) actually ends up in
    // the scene, so cleanup can dispose its geometries/materials/textures on unmount.
    let loadedRoot: THREE.Object3D | null = null;

    // ============================================
    // GROUND PLANE / CONTACT SHADOW
    // Created up front with a neutral Y so it's already receiving shadows the moment the
    // model loads; each branch below repositions it to the vehicle's true bottom edge
    // once that vehicle's actual (scaled) bounds are known.
    // ============================================
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.35 });
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // Small downward nudge below the model's exact bottom to avoid z-fighting/shadow acne
    // between the ground plane and the wheels resting on it.
    const GROUND_CONTACT_OFFSET = 0.05;

    // ============================================
    // MODEL LOADING
    // ============================================
    if (resolvedModelUrl) {
      console.info('[ThreeViewer] Loading vehicle model', { vehicleId: vehicle.id, modelId: vehicle.modelId, url: resolvedModelUrl });

      const loader = new GLTFLoader();
      const dracoLoader = new DRACOLoader();
      const decoderPath = `${import.meta.env.BASE_URL}draco/`;
      console.info('[ThreeViewer] Draco decoder path', decoderPath);
      dracoLoader.setDecoderPath(decoderPath);
      loader.setDRACOLoader(dracoLoader);

      loader.load(
        resolvedModelUrl,
        (gltf) => {
          if (!isMounted) return;
          console.info('[ThreeViewer] Model loaded successfully', { vehicleId: vehicle.id, modelId: vehicle.modelId, url: resolvedModelUrl });
          setIsModelLoading(false);
          setModelLoadProgress(100);

          const model = gltf.scene;
          model.name = 'LoadedVehicle';

          // Calculate initial bounds
          const initialBounds = calculateVehicleBounds(model);
          const maxDim = Math.max(initialBounds.width, initialBounds.height, initialBounds.depth);
          const scale = 4.0 / maxDim;

          // Apply scale to model
          model.scale.set(scale, scale, scale);
          model.updateMatrixWorld(true);

          // Create proper pivot structure after scaling
          // This ensures the vehicle rotates around its geometric center
          const pivotResult = recalculatePivotAfterScale(model, scale, modelGroup);
          pivotGroup = pivotResult.pivotGroup;
          loadedRoot = model;

          // The vehicle is now centered on the pivot, so its lowest point (wheels) sits at
          // exactly -height/2. Ground the shadow plane there instead of a guessed constant.
          shadowPlane.position.y = -pivotResult.bounds.height / 2 - GROUND_CONTACT_OFFSET;

          // CRITICAL: When a model loads asynchronously we must update the orbit controls target
          // so the camera orbits the calculated pivot. Not updating controls.target here causes
          // the camera to orbit an incorrect point (or the previous fallback target) which appears
          // as the vehicle shifting when the user begins rotating.
          try {
            if (controls && pivotGroup) {
              const orbitTarget = getOrbitControlsTarget(pivotGroup, 0.5);
              controls.target.copy(orbitTarget);
              controls.update();
            }
          } catch (e) {
            // controls may not be initialized yet in some execution orders — it's safe to ignore
            // but leave a debug message so it's easier to diagnose if something goes wrong.
            console.debug('Could not update controls target on model load yet:', e);
          }

          // Validate the pivot setup
          const validation = validateVehiclePivot(pivotGroup);
          if (!validation.isValid) {
            console.warn('⚠️ Vehicle pivot validation failed:', validation.issues);
            debugVehiclePivot(pivotGroup, 'Loaded Vehicle');
          } else {
            console.log('✓ Vehicle pivot correctly configured');
          }

          // Apply materials
          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              const name = child.name.toLowerCase();
              if (name.includes('body') || name.includes('paint') || name.includes('shell')) {
                child.material = mats.body;
              } else if (name.includes('glass') || name.includes('window')) {
                child.material = mats.glass;
              } else if (name.includes('wheel') || name.includes('rim')) {
                child.material = mats.wheel;
              } else if (name.includes('tire') || name.includes('tyre')) {
                child.material = mats.rubber;
              }
            }
          });
        },
        (progressEvent) => {
          if (!isMounted) return;
          const progress = progressEvent.total ? (progressEvent.loaded / progressEvent.total) * 100 : 0;
          if (progress > 0) {
            console.debug('[ThreeViewer] Model loading progress', { vehicleId: vehicle.id, modelId: vehicle.modelId, progress, url: resolvedModelUrl });
          }
          setModelLoadProgress(progress);
        },
        (error) => {
          if (!isMounted) return;
          console.error('[ThreeViewer] Failed to load 3D model', { vehicleId: vehicle.id, modelId: vehicle.modelId, url: resolvedModelUrl, error });
          setIsModelLoading(false);
          setModelLoadProgress(100);
        }
      );
    } else {
      console.warn('[ThreeViewer] No model URL available for vehicle', { vehicleId: vehicle.id, modelId: vehicle.modelId });
      // ============================================
      // PROCEDURAL CAR (Fallback)
      // ============================================
      setIsModelLoading(false);
      setModelLoadProgress(100);
      const carGroup = new THREE.Group();
      carGroup.name = 'ProceduralVehicle';

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 4.2), mats.body);
      chassis.position.set(0, 0.5, 0);
      chassis.castShadow = true;
      carGroup.add(chassis);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2.2), mats.glass);
      cabin.position.set(0, 1.05, -0.2);
      carGroup.add(cabin);

      const wheelPositions: Array<[number, number, number]> = [
        [-0.95, 0.2, 1.4],
        [0.95, 0.2, 1.4],
        [-0.95, 0.2, -1.4],
        [0.95, 0.2, -1.4],
      ];
      wheelPositions.forEach((pos) => {
        const wGroup = new THREE.Group();
        wGroup.position.set(pos[0], pos[1], pos[2]);

        const tireGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.3, 32);
        tireGeo.rotateZ(Math.PI / 2);
        const tire = new THREE.Mesh(tireGeo, mats.rubber);
        tire.castShadow = true;
        wGroup.add(tire);

        const rimGeo = new THREE.CylinderGeometry(0.25, 0.25, 0.32, 16);
        rimGeo.rotateZ(Math.PI / 2);
        const rim = new THREE.Mesh(rimGeo, mats.wheel);
        wGroup.add(rim);

        carGroup.add(wGroup);
      });

      // Create pivot for procedural car
      const pivotResult = createVehiclePivot(carGroup, scene, modelGroup);
      pivotGroup = pivotResult.pivotGroup;
      loadedRoot = carGroup;
      shadowPlane.position.y = -pivotResult.bounds.height / 2 - GROUND_CONTACT_OFFSET;

      const validation = validateVehiclePivot(pivotGroup);
      if (!validation.isValid) {
        console.warn('⚠️ Procedural vehicle pivot validation failed:', validation.issues);
        debugVehiclePivot(pivotGroup, 'Procedural Vehicle');
      }
    }

    // ============================================
    // CAMERA SETUP
    // ============================================
    const camera = new THREE.PerspectiveCamera(
      variant?.cameraSettings?.zoom ?? vehicle.cameraSettings?.zoom ?? 45,
      containerRef.current.clientWidth / containerRef.current.clientHeight,
      0.1,
      100
    );
    camera.position.set(...(variant?.cameraSettings?.position ?? vehicle.cameraSettings?.position ?? [5, 2, 5]));

    // ============================================
    // ORBIT CONTROLS SETUP
    // ============================================
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;

    // Disable right-click and drag interaction
    // Configure mouse buttons: LEFT=rotate, MIDDLE=zoom, RIGHT=disabled
    // Using numeric constants: ROTATE=0, ZOOM=1, PAN=2
    controls.mouseButtons = {
      LEFT: 0,      // ROTATE
      MIDDLE: 1,    // ZOOM
      RIGHT: null,  // Disabled
    };
    // Also disable pan to ensure right-click has no effect
    controls.enablePan = false;

    // CRITICAL: Set orbit target to the true geometric center (pivot)
    // This ensures the camera orbits around the vehicle's center, not an offset point
    if (pivotGroup) {
      const orbitTarget = getOrbitControlsTarget(pivotGroup, 0.5); // 0.5 unit above geometric center for aesthetics
      controls.target.copy(orbitTarget);
      controls.enableRotate = true;
      controls.autoRotate = false;
    } else {
      // Fallback if pivot not yet created
      controls.target.set(...(variant?.cameraSettings?.target ?? vehicle.cameraSettings?.target ?? [0, 0.5, 0]));
    }

    controls.update();

    const state = { targetCameraPos: null as THREE.Vector3 | null };
    controls.addEventListener('start', () => {
      state.targetCameraPos = null;
    });

    // ============================================
    // FLOATING DOCK HELPERS (zoom / reset / auto-rotate)
    // Reuse the same targetCameraPos lerp used by camera presets above.
    // ============================================
    const zoomBy = (factor: number) => {
      const direction = camera.position.clone().sub(controls.target);
      const length = THREE.MathUtils.clamp(direction.length() * factor, controls.minDistance, controls.maxDistance);
      direction.setLength(length);
      state.targetCameraPos = controls.target.clone().add(direction);
    };

    const resetView = () => {
      const activeVariant = vehicle.variants.find((entry) => entry.id === vehicle.activeVariantId) ?? vehicle.variants[0] ?? null;
      const resetPosition = activeVariant?.cameraSettings?.position ?? vehicle.cameraSettings?.position ?? [5, 2, 5];
      state.targetCameraPos = new THREE.Vector3(...resetPosition);

      if (pivotGroup) {
        controls.target.copy(getOrbitControlsTarget(pivotGroup, 0.5));
      } else {
        const resetTarget = activeVariant?.cameraSettings?.target ?? vehicle.cameraSettings?.target ?? [0, 0.5, 0];
        controls.target.set(...resetTarget);
      }
      controls.autoRotate = false;
      controls.update();
    };

    const toggleAutoRotate = () => {
      controls.autoRotate = !controls.autoRotate;
      controls.autoRotateSpeed = 1.4;
      return controls.autoRotate;
    };

    // ============================================
    // ANIMATION LOOP
    // ============================================
    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      if (state.targetCameraPos) camera.position.lerp(state.targetCameraPos, 0.05);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // ============================================
    // EVENT HANDLERS
    // ============================================
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    threeRef.current = { mats, camera, controls, state, pivotGroup, scene, renderer, zoomBy, resetView, toggleAutoRotate };

    // ============================================
    // CLEANUP
    // Every vehicle switch tears down and rebuilds this whole scene (effect deps: [vehicle]),
    // so anything not explicitly disposed here leaks GPU memory/programs a little more each
    // time a user browses through vehicles — eventually exhausting the browser's WebGL
    // context budget. Dispose geometries/materials/textures the same way three.js's own
    // examples do.
    // ============================================
    const disposeMaterial = (material: THREE.Material) => {
      Object.values(material).forEach((value) => {
        if (value instanceof THREE.Texture) value.dispose();
      });
      material.dispose();
    };

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(frameId);
      controls.dispose();

      const sharedMaterials = new Set<THREE.Material>(Object.values(mats));
      loadedRoot?.traverse((child) => {
        if (!(child instanceof THREE.Mesh)) return;
        child.geometry?.dispose();
        const material = child.material;
        (Array.isArray(material) ? material : [material]).forEach((mat) => {
          if (mat && !sharedMaterials.has(mat)) disposeMaterial(mat);
        });
      });
      sharedMaterials.forEach(disposeMaterial);
      shadowPlane.geometry.dispose();
      shadowMat.dispose();
      scene.environment?.dispose();

      renderer.dispose();
      // renderer.dispose() only frees three.js's own tracked resources — the underlying
      // WebGLRenderingContext stays alive until the browser's GC gets around to it, which
      // is nowhere near fast enough when a user browses through several vehicles in one
      // session. Each mount opens a brand-new context, so without forcing this one closed
      // immediately, live contexts pile up until the browser hits its hard cap and starts
      // evicting the oldest ones (surfacing as WebGL "program not valid" errors).
      renderer.forceContextLoss();
      if (containerRef.current && renderer.domElement.parentNode === containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [vehicle]);

  // ============================================
  // MATERIAL UPDATES (Color/Texture Changes)
  // ============================================
  useEffect(() => {
    if (!threeRef.current || !vehicle) return;
    const { mats } = threeRef.current;

    const paintCat = vehicle.categories.find((category) => category.id === 'exterior_paint');
    const selectedPaint = paintCat?.options.find((option) => option.id === selections['exterior_paint']);
    if (selectedPaint) {
      const bodyMaterial = mats.body as THREE.MeshPhysicalMaterial;
      bodyMaterial.color.set(selectedPaint.hex ?? '#ffffff');
      bodyMaterial.roughness = selectedPaint.roughness ?? 0.1;
      bodyMaterial.metalness = selectedPaint.metalness ?? 0.1;
      bodyMaterial.clearcoat = selectedPaint.clearcoat ?? 0;
      bodyMaterial.needsUpdate = true;
    }

    const wheelCat = vehicle.categories.find((category) => category.id === 'wheels');
    const selectedWheel = wheelCat?.options.find((option) => option.id === selections['wheels']);
    if (selectedWheel) {
      const wheelMaterial = mats.wheel as THREE.MeshStandardMaterial;
      wheelMaterial.color.set(selectedWheel.hex ?? '#e0e0e0');
      wheelMaterial.roughness = selectedWheel.roughness ?? 0.2;
      wheelMaterial.metalness = selectedWheel.metalness ?? 0.2;
      wheelMaterial.needsUpdate = true;
    }
  }, [selections, vehicle]);

  // ============================================
  // CAMERA PRESET HANDLING
  // ============================================
  useEffect(() => {
    if (!threeRef.current || !vehicle) return;
    const { state } = threeRef.current;
    const variant = vehicle.variants.find((entry) => entry.id === vehicle.activeVariantId) ?? vehicle.variants[0] ?? null;

    if ((variant?.cameras ?? vehicle.cameras)[activeCameraPreset]) {
      const [x, y, z] = (variant?.cameras ?? vehicle.cameras)[activeCameraPreset];
      state.targetCameraPos = new THREE.Vector3(x, y, z);
    }
  }, [activeCameraPreset, vehicle]);

  return (
    <div
      ref={rootRef}
      className="absolute inset-0 z-0 h-full w-full overflow-hidden bg-[linear-gradient(180deg,#f8fafe_0%,#eef3fc_55%,#e2e9f8_100%)]"
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(46% 42% at 50% 40%, rgba(59,130,246,0.16) 0%, rgba(59,130,246,0) 72%)' }}
      />
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />

      <div className="pointer-events-auto absolute left-3 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 rounded-full border border-white/70 bg-white/60 p-1.5 shadow-[0_10px_35px_-12px_rgba(37,99,235,0.35)] backdrop-blur-xl sm:left-5">
        <DockButton label="Zoom in" onClick={() => threeRef.current?.zoomBy(0.85)}>
          <ZoomIn size={18} />
        </DockButton>
        <DockButton label="Zoom out" onClick={() => threeRef.current?.zoomBy(1.18)}>
          <ZoomOut size={18} />
        </DockButton>
        <DockButton
          label={isAutoRotating ? 'Stop rotation' : 'Auto-rotate'}
          active={isAutoRotating}
          onClick={() => {
            const next = threeRef.current?.toggleAutoRotate();
            if (typeof next === 'boolean') setIsAutoRotating(next);
          }}
        >
          <RotateCw size={18} />
        </DockButton>
        <DockButton
          label="Reset view"
          onClick={() => {
            threeRef.current?.resetView();
            setIsAutoRotating(false);
          }}
        >
          <RefreshCcw size={18} />
        </DockButton>
        <DockButton label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'} onClick={toggleFullscreen}>
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </DockButton>
      </div>

      {isModelLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-white/70 bg-white/85 p-6 shadow-[0_20px_45px_-15px_rgba(37,99,235,0.35)] backdrop-blur-xl">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
              <span>Loading model</span>
              <span className="text-blue-600">{Math.round(modelLoadProgress)}%</span>
            </div>
            <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300" style={{ width: `${Math.max(6, modelLoadProgress)}%` }} />
            </div>
            <p className="mt-3 text-sm text-slate-500">Preparing the scene — almost ready.</p>
          </div>
        </div>
      )}
    </div>
  );
};
