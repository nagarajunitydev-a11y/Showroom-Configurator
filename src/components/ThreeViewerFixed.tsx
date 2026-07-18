import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { useAppStore } from '../store';
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
}

export const ThreeViewer = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const threeRef = useRef<ThreeRefState | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [modelLoadProgress, setModelLoadProgress] = useState(0);

  const { selections, activeVehicleId, vehicles, activeCameraPreset } = useAppStore();
  const vehicle = vehicles.find((entry) => entry.id === activeVehicleId);

  useEffect(() => {
    if (!containerRef.current || !vehicle) return;

    let isMounted = true;
    setIsModelLoading(Boolean(vehicle.url));
    setModelLoadProgress(0);

    const variant = vehicle.variants.find((entry) => entry.id === vehicle.activeVariantId) ?? vehicle.variants[0] ?? null;

    // ============================================
    // SCENE SETUP
    // ============================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050505');
    scene.fog = new THREE.Fog('#050505', 10, 30);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
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

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2);
    dirLight.position.set(10, 10, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
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

    // ============================================
    // MODEL LOADING
    // ============================================
    if (vehicle.url) {
      const loader = new GLTFLoader();
      loader.load(
        vehicle.url,
        (gltf) => {
          if (!isMounted) return;
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
          setModelLoadProgress(progress);
        },
        (error) => {
          if (!isMounted) return;
          console.error('Failed to load 3D model', error);
          setIsModelLoading(false);
          setModelLoadProgress(100);
        }
      );
    } else {
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

      const validation = validateVehiclePivot(pivotGroup);
      if (!validation.isValid) {
        console.warn('⚠️ Procedural vehicle pivot validation failed:', validation.issues);
        debugVehiclePivot(pivotGroup, 'Procedural Vehicle');
      }
    }

    // ============================================
    // SHADOW PLANE
    // ============================================
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.5 });
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2; // Position below the vehicle
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

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

    threeRef.current = { mats, camera, controls, state, pivotGroup, scene, renderer };

    // ============================================
    // CLEANUP
    // ============================================
    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      window.cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
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
    <div className="absolute inset-0 z-0 h-full w-full bg-gradient-to-b from-zinc-900 to-black">
      {isModelLoading && (
        <div className="absolute inset-x-0 top-0 z-10 flex flex-col gap-2 bg-black/40 px-4 py-3 backdrop-blur-sm sm:px-6">
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-300">
            <span>Loading 3D model</span>
            <span>{Math.round(modelLoadProgress)}%</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-white transition-all duration-300" style={{ width: `${Math.max(6, modelLoadProgress)}%` }} />
          </div>
        </div>
      )}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
};
