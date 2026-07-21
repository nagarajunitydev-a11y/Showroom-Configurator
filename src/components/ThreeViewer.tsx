import { motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { useAppStore } from '../store';
import { recalculatePivotAfterScale, getOrbitControlsTarget, validateVehiclePivot, debugVehiclePivot } from '../utils/pivotUtils';

interface ThreeRefState {
  mats: Record<string, THREE.Material>;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  state: { targetCameraPos: THREE.Vector3 | null };
  modelGroup: THREE.Group | null;
}

export const ThreeViewer = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const threeRef = useRef<ThreeRefState | null>(null);

  const { selections, activeVehicleId, vehicles, activeCameraPreset } = useAppStore();
  const vehicle = vehicles.find((entry) => entry.id === activeVehicleId);
  const [isModelLoading, setIsModelLoading] = useState(Boolean(vehicle?.url));
  const [modelLoadProgress, setModelLoadProgress] = useState(0);
  const showLoadingScreen = Boolean(vehicle?.url) && isModelLoading;
  const displayProgress = modelLoadProgress > 0 ? Math.min(100, Math.max(8, modelLoadProgress)) : 12;

  useEffect(() => {
    if (!containerRef.current || !vehicle) return;

    let isMounted = true;
    setIsModelLoading(Boolean(vehicle.url));
    setModelLoadProgress(0);

    const variant = vehicle.variants.find((entry) => entry.id === vehicle.activeVariantId) ?? vehicle.variants[0] ?? null;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050505');
    scene.fog = new THREE.Fog('#050505', 10, 30);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction = 'none';

    const exporter = new GLTFExporter();

    const captureScreenshot = async (): Promise<string | null> => {
      await new Promise((resolve) => window.requestAnimationFrame(resolve));
      controls.update();
      renderer.render(scene, camera);
      await new Promise((resolve) => window.requestAnimationFrame(resolve));

      try {
        return renderer.domElement.toDataURL('image/png');
      } catch (error) {
        console.error('Failed to generate screenshot data URL', error);
        return null;
      }
    };

    const captureARModel = async (): Promise<string | null> => {
      if (!modelGroup) return null;

      try {
        const result = await exporter.parseAsync(modelGroup, { binary: true, embedImages: true });
        if (result instanceof ArrayBuffer) {
          const blob = new Blob([result], { type: 'model/gltf-binary' });
          return URL.createObjectURL(blob);
        }

        const output = JSON.stringify(result);
        const blob = new Blob([output], { type: 'application/json' });
        return URL.createObjectURL(blob);
      } catch (error) {
        console.error('Failed to export AR model', error);
        return null;
      }
    };

    useAppStore.getState().setScreenshotCapturer(captureScreenshot);
    useAppStore.getState().setARModelCapturer(captureARModel);

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

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    // Keep reference to pivotGroup so we can update controls.target once controls are created
    let pivotGroup: THREE.Group | null = null;

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

          // Calculate bounds and scale
          const box = new THREE.Box3().setFromObject(model);
          const size = box.getSize(new THREE.Vector3());
          const maxDim = Math.max(size.x, size.y, size.z);
          const scale = 4.0 / maxDim;

          // Apply scale and ensure matrixWorld is updated before computing bounds in pivot utility
          model.scale.set(scale, scale, scale);
          model.updateMatrixWorld(true);

          // Create a proper pivot group that centers geometry at the world origin
          const pivotResult = recalculatePivotAfterScale(model, scale, modelGroup);
          pivotGroup = pivotResult.pivotGroup;

          // Validate pivot
          const validation = validateVehiclePivot(pivotGroup);
          if (!validation.isValid) {
            console.warn('⚠️ Vehicle pivot validation failed:', validation.issues);
            debugVehiclePivot(pivotGroup, 'Loaded Vehicle');
          } else {
            console.log('✓ Vehicle pivot correctly configured');
          }

          // Apply materials to meshes (model is already parented into pivot inside recalculatePivotAfterScale)
          pivotGroup.traverse((child) => {
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
        },
      );
    } else {
      setIsModelLoading(false);
      setModelLoadProgress(100);
      const carGroup = new THREE.Group();
      carGroup.position.set(0, 0.4, 0);

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 4.2), mats.body);
      chassis.position.set(0, 0.5, 0);
      chassis.castShadow = true;
      carGroup.add(chassis);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2.2), mats.glass);
      cabin.position.set(0, 1.05, -0.2);
      carGroup.add(cabin);

      const wheelPositions: Array<[number, number, number]> = [[-0.95, 0.2, 1.4], [0.95, 0.2, 1.4], [-0.95, 0.2, -1.4], [0.95, 0.2, -1.4]];
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
      modelGroup.add(carGroup);
    }

    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.5 });
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    const camera = new THREE.PerspectiveCamera((variant?.cameraSettings?.zoom ?? vehicle.cameraSettings?.zoom ?? 45), containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.set(...(variant?.cameraSettings?.position ?? vehicle.cameraSettings?.position ?? [5, 2, 5]));

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
    controls.touches = {
      ONE: THREE.TOUCH.ROTATE,
      TWO: THREE.TOUCH.DOLLY_PAN,
    };

    // If a pivot was already created during model load, point the controls at the pivot world position.
    // Note: pivotGroup may be set asynchronously by the loader callback — it's safe to check here.
    try {
      if (typeof (pivotGroup) !== 'undefined' && pivotGroup) {
        const orbitTarget = getOrbitControlsTarget(pivotGroup, 0.5);
        controls.target.copy(orbitTarget);
      } else {
        controls.target.set(...(variant?.cameraSettings?.target ?? vehicle.cameraSettings?.target ?? [0, 0.5, 0]));
      }
    } catch (e) {
      // Defensive: if pivotGroup is not yet defined or getOrbitControlsTarget fails, use fallback
      controls.target.set(...(variant?.cameraSettings?.target ?? vehicle.cameraSettings?.target ?? [0, 0.5, 0]));
    }

    const state = { targetCameraPos: null as THREE.Vector3 | null };
    controls.addEventListener('start', () => {
      state.targetCameraPos = null;
    });

    let frameId = 0;
    const animate = () => {
      frameId = window.requestAnimationFrame(animate);
      if (state.targetCameraPos) camera.position.lerp(state.targetCameraPos, 0.05);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    let resizeTimer = 0;
    const updateRendererSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const clientWidth = rect.width;
      const clientHeight = rect.height;
      if (clientWidth === 0 || clientHeight === 0) return;
      camera.aspect = clientWidth / clientHeight;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(clientWidth, clientHeight);
      renderer.domElement.style.width = `${clientWidth}px`;
      renderer.domElement.style.height = `${clientHeight}px`;
    };

    const handleResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        updateRendererSize();
      }, 100);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    const visualViewport = window.visualViewport;
    if (visualViewport) {
      visualViewport.addEventListener('resize', handleResize);
      visualViewport.addEventListener('scroll', handleResize);
    }

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(containerRef.current);

    threeRef.current = { mats, camera, controls, state, modelGroup };

    // If the model loads after controls are created, the loader callback sets pivotGroup and
    // we should update controls.target to match the pivot's world position so the camera
    // always orbits the true vehicle center.
    // The loader callback may have already set pivotGroup; check and update now.
    try {
      // @ts-ignore - pivotGroup is a local to this effect; using the variable we declared above
      if (typeof (pivotGroup) !== 'undefined' && pivotGroup) {
        const orbitTarget = getOrbitControlsTarget(pivotGroup, 0.5);
        controls.target.copy(orbitTarget);
        controls.update();
      }
    } catch (e) {
      // ignore
    }

    return () => {
      isMounted = false;
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      if (visualViewport) {
        visualViewport.removeEventListener('resize', handleResize);
        visualViewport.removeEventListener('scroll', handleResize);
      }
      resizeObserver.disconnect();
      window.cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      useAppStore.getState().setScreenshotCapturer(null);
      useAppStore.getState().setARModelCapturer(null);
    };
  }, [vehicle]);

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
      className="absolute inset-x-0 z-0 w-full bg-gradient-to-b from-zinc-900 to-black"
      style={{ top: 'var(--header-height, 0px)', bottom: 'var(--footer-height, 0px)' }}
    >
      {showLoadingScreen && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 px-4 pb-8 pt-[max(4rem,env(safe-area-inset-top))] backdrop-blur-md sm:px-6 sm:pb-10">
          <div className="flex w-full max-w-sm flex-col items-center justify-center rounded-3xl border border-white/10 bg-white/5 p-6 text-center shadow-2xl shadow-black/40 sm:p-8">
            <motion.div
              className="mb-5 h-14 w-14 rounded-full border-4 border-white/15 border-t-white"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            />
            <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-zinc-400">Preparing 3D view</p>
            <h3 className="mt-2 text-lg font-semibold text-white">Loading vehicle model</h3>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              This can take a moment on slower mobile connections, especially on first load.
            </p>

            <div className="mt-6 flex w-full flex-col gap-2">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-400">
                <span>Download progress</span>
                <span>{Math.round(modelLoadProgress)}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-white via-zinc-100 to-white"
                  animate={modelLoadProgress > 0 ? { width: `${displayProgress}%` } : { width: ['8%', '72%', '8%'] }}
                  transition={modelLoadProgress > 0 ? { duration: 0.3, ease: 'easeOut' } : { repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
      <div ref={containerRef} className="absolute inset-0 h-full w-full" />
    </div>
  );
};
