import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { create } from 'zustand';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings2, 
  Palette, 
  CircleDot, 
  ChevronRight, 
  Undo2, 
  Redo2, 
  Camera as CameraIcon,
  Info,
  Check,
  Upload,
  Lock,
  LayoutGrid,
  Shield,
  CarFront,
  ArrowLeft,
  Trash2,
  Plus
} from 'lucide-react';

// ==========================================
// 1. DATA LAYER & CONFIG
// ==========================================

const MATERIAL_TYPES = {
  PAINT: 'paint',
  METAL: 'metal',
  GLASS: 'glass',
  CARBON: 'carbon',
};

const DEFAULT_CATEGORIES = [
  {
    id: 'exterior_paint',
    name: 'Exterior Paint',
    icon: 'Palette',
    options: [
      { id: 'p_white', name: 'Glacier White', price: 0, hex: '#ffffff', type: MATERIAL_TYPES.PAINT, roughness: 0.1, metalness: 0.1 },
      { id: 'p_black', name: 'Obsidian Black', price: 1200, hex: '#0a0a0a', type: MATERIAL_TYPES.PAINT, roughness: 0.05, metalness: 0.5, clearcoat: 1 },
      { id: 'p_red', name: 'Rosso Corsa', price: 2500, hex: '#cc0000', type: MATERIAL_TYPES.PAINT, roughness: 0.2, metalness: 0.4, clearcoat: 0.8 },
      { id: 'p_matte_grey', name: 'Stealth Grey (Matte)', price: 3500, hex: '#333333', type: MATERIAL_TYPES.PAINT, roughness: 0.8, metalness: 0.2, clearcoat: 0 },
    ],
    defaultOptionId: 'p_white'
  },
  {
    id: 'wheels',
    name: 'Wheels & Alloys',
    icon: 'CircleDot',
    options: [
      { id: 'w_20_silver', name: '20" Aero Silver', price: 0, hex: '#e0e0e0', type: MATERIAL_TYPES.METAL, roughness: 0.2, metalness: 1 },
      { id: 'w_21_black', name: '21" Turbine Black', price: 2000, hex: '#111111', type: MATERIAL_TYPES.METAL, roughness: 0.4, metalness: 0.8 },
    ],
    defaultOptionId: 'w_20_silver'
  }
];

const INITIAL_VEHICLES = [
  {
    id: 'v-001',
    type: 'Car',
    brand: 'Aero',
    model: 'Stratos Concept',
    year: 2026,
    basePrice: 85000,
    url: null, // null implies procedural generation
    cameras: {
      default: [5, 2, 5],
      front: [0, 1, 6],
      side: [6, 1, 0],
      wheel: [3, 0.5, 2.5],
      rear: [0, 1.5, -6],
    },
    categories: DEFAULT_CATEGORIES
  }
];

// ==========================================
// 2. STATE MANAGEMENT (Zustand)
// ==========================================

const useAppStore = create((set, get) => ({
  // App Routing: 'landing', 'client_grid', 'configurator', 'admin_login', 'admin_dashboard'
  currentView: 'landing',
  
  // Data State
  vehicles: INITIAL_VEHICLES,
  activeVehicleId: null,
  isAdminAuthed: false,

  // Configurator State
  selections: {},
  history: [],
  historyIndex: -1,
  activeCameraPreset: 'default',

  // Actions
  setView: (view) => set({ currentView: view }),
  
  adminLogin: (password) => {
    if (password === 'admin') { // Simulated Auth
      set({ isAdminAuthed: true, currentView: 'admin_dashboard' });
      return true;
    }
    return false;
  },
  
  adminLogout: () => set({ isAdminAuthed: false, currentView: 'landing' }),

  addVehicle: (vehicleData, file) => {
    const newVehicle = {
      ...vehicleData,
      id: `v-${Date.now()}`,
      url: URL.createObjectURL(file), // Create local blob URL for in-memory session
      cameras: INITIAL_VEHICLES[0].cameras, // reuse default cameras
      categories: DEFAULT_CATEGORIES // reuse default configuration options
    };
    set((state) => ({ vehicles: [...state.vehicles, newVehicle] }));
  },

  removeVehicle: (id) => {
    set((state) => ({ vehicles: state.vehicles.filter(v => v.id !== id) }));
  },

  initializeConfigurator: (vehicleId) => {
    const vehicle = get().vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;
    
    const initialSelections = {};
    vehicle.categories.forEach(cat => {
      initialSelections[cat.id] = cat.defaultOptionId;
    });
    
    set({ 
      activeVehicleId: vehicleId, 
      selections: initialSelections,
      history: [initialSelections],
      historyIndex: 0,
      activeCameraPreset: 'default',
      currentView: 'configurator'
    });
  },

  selectOption: (categoryId, optionId) => {
    set((state) => {
      const newSelections = { ...state.selections, [categoryId]: optionId };
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newSelections);
      
      let newCamera = state.activeCameraPreset;
      if (categoryId === 'wheels' || categoryId === 'calipers') newCamera = 'wheel';
      else if (categoryId === 'exterior_paint') newCamera = 'default';

      return { 
        selections: newSelections,
        history: newHistory,
        historyIndex: newHistory.length - 1,
        activeCameraPreset: newCamera
      };
    });
  },

  undo: () => set((state) => ({
    historyIndex: Math.max(0, state.historyIndex - 1),
    selections: state.history[Math.max(0, state.historyIndex - 1)] || state.selections
  })),

  redo: () => set((state) => ({
    historyIndex: Math.min(state.history.length - 1, state.historyIndex + 1),
    selections: state.history[Math.min(state.history.length - 1, state.historyIndex + 1)] || state.selections
  })),

  setCameraPreset: (preset) => set({ activeCameraPreset: preset }),

  getTotalPrice: () => {
    const state = get();
    const vehicle = state.vehicles.find(v => v.id === state.activeVehicleId);
    if (!vehicle) return 0;
    
    let total = vehicle.basePrice;
    vehicle.categories.forEach(cat => {
      const selectedOptionId = state.selections[cat.id];
      const option = cat.options.find(opt => opt.id === selectedOptionId);
      if (option) total += option.price;
    });
    return total;
  }
}));

// ==========================================
// 3. GRAPHICS ENGINE (Vanilla Three.js)
// ==========================================

const ThreeViewer = () => {
  const containerRef = useRef(null);
  const threeRef = useRef(null);
  
  const { selections, activeVehicleId, vehicles, activeCameraPreset } = useAppStore();
  const vehicle = vehicles.find(v => v.id === activeVehicleId);

  useEffect(() => {
    if (!containerRef.current || !vehicle) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#050505');
    scene.fog = new THREE.Fog('#050505', 10, 30);

    // 2. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    containerRef.current.appendChild(renderer.domElement);

    // 3. Environment & Lighting
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

    // 4. Materials Dictionary
    const mats = {
      body: new THREE.MeshPhysicalMaterial({ clearcoatRoughness: 0.1, envMapIntensity: 1.5 }),
      glass: new THREE.MeshPhysicalMaterial({
        color: 0x000000, transmission: 1, opacity: 1, metalness: 0, roughness: 0.05,
        ior: 1.5, thickness: 0.01, envMapIntensity: 1.5, side: THREE.DoubleSide
      }),
      lights: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 }),
      rubber: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.9, metalness: 0.1 }),
      wheel: new THREE.MeshStandardMaterial({ envMapIntensity: 2.0 }),
    };

    // 5. Model Loading logic
    let loadedModel = null;
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);

    if (vehicle.url) {
      // Load Uploaded GLTF/GLB
      const loader = new GLTFLoader();
      loader.load(vehicle.url, (gltf) => {
        const model = gltf.scene;
        
        // Auto-scale and center the uploaded model
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 4.0 / maxDim; // Normalize scale to fit viewer
        
        model.scale.set(scale, scale, scale);
        model.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale);
        
        // Try to apply materials heuristically based on naming
        model.traverse((child) => {
          if (child.isMesh) {
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
        
        modelGroup.add(model);
        loadedModel = model;
      });
    } else {
      // Load Procedural Concept Car (Fallback)
      const carGroup = new THREE.Group();
      carGroup.position.set(0, 0.4, 0);

      const chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 4.2), mats.body);
      chassis.position.set(0, 0.5, 0);
      chassis.castShadow = true;
      carGroup.add(chassis);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.5, 2.2), mats.glass);
      cabin.position.set(0, 1.05, -0.2);
      carGroup.add(cabin);

      const wheelPositions = [[-0.95, 0.2, 1.4], [0.95, 0.2, 1.4], [-0.95, 0.2, -1.4], [0.95, 0.2, -1.4]];
      wheelPositions.forEach((pos, i) => {
        const wGroup = new THREE.Group();
        wGroup.position.set(...pos);
        
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
      loadedModel = carGroup;
    }

    // Shadow Plane
    const shadowMat = new THREE.ShadowMaterial({ opacity: 0.5 });
    const shadowPlane = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), shadowMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.receiveShadow = true;
    scene.add(shadowPlane);

    // 6. Camera & Controls
    const camera = new THREE.PerspectiveCamera(45, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 100);
    camera.position.set(5, 2, 5);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI / 2 + 0.05;
    controls.target.set(0, 0.5, 0);

    const state = { targetCameraPos: null };

    controls.addEventListener('start', () => { state.targetCameraPos = null; });

    // 7. Loop
    let frameId;
    const animate = () => {
      frameId = requestAnimationFrame(animate);
      if (state.targetCameraPos) camera.position.lerp(state.targetCameraPos, 0.05);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize
    const handleResize = () => {
      if (!containerRef.current) return;
      camera.aspect = containerRef.current.clientWidth / containerRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    threeRef.current = { mats, camera, controls, state };

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(frameId);
      controls.dispose();
      renderer.dispose();
      if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, [vehicle]);

  // Materials Update Logic
  useEffect(() => {
    if (!threeRef.current || !vehicle) return;
    const { mats } = threeRef.current;

    const paintCat = vehicle.categories.find(c => c.id === 'exterior_paint');
    const selectedPaint = paintCat?.options.find(o => o.id === selections['exterior_paint']);
    if (selectedPaint) {
      mats.body.color.set(selectedPaint.hex);
      mats.body.roughness = selectedPaint.roughness;
      mats.body.metalness = selectedPaint.metalness;
      mats.body.clearcoat = selectedPaint.clearcoat || 0;
      mats.body.needsUpdate = true;
    }

    const wheelCat = vehicle.categories.find(c => c.id === 'wheels');
    const selectedWheel = wheelCat?.options.find(o => o.id === selections['wheels']);
    if (selectedWheel) {
      mats.wheel.color.set(selectedWheel.hex);
      mats.wheel.roughness = selectedWheel.roughness;
      mats.wheel.metalness = selectedWheel.metalness;
      mats.wheel.needsUpdate = true;
    }
  }, [selections, vehicle]);

  // Camera Update Logic
  useEffect(() => {
    if (!threeRef.current || !vehicle) return;
    const { state } = threeRef.current;
    
    if (vehicle.cameras[activeCameraPreset]) {
        const [x, y, z] = vehicle.cameras[activeCameraPreset];
        state.targetCameraPos = new THREE.Vector3(x, y, z);
    }
  }, [activeCameraPreset, vehicle]);

  return <div ref={containerRef} className="w-full h-full absolute inset-0 z-0 bg-gradient-to-b from-zinc-900 to-black" />;
};


// ==========================================
// 4. UI COMPONENTS
// ==========================================

const FormattedPrice = ({ price }) => (
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(price)
);

// --- 4A. Configurator UI ---
const ConfiguratorUI = () => {
  const { 
    activeVehicleId, vehicles, selections, selectOption, getTotalPrice, 
    history, historyIndex, undo, redo, setCameraPreset, activeCameraPreset, setView 
  } = useAppStore();
  
  const vehicle = vehicles.find(v => v.id === activeVehicleId);
  const [activeCategory, setActiveCategory] = useState(vehicle?.categories[0]?.id);

  if (!vehicle) return null;
  const currentCategoryData = vehicle.categories.find(c => c.id === activeCategory);

  const icons = { Palette: <Palette size={20} />, CircleDot: <CircleDot size={20} /> };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 pointer-events-none flex flex-col justify-between font-sans text-white z-10">
      
      {/* Header */}
      <header className="pointer-events-auto p-6 flex justify-between items-start w-full">
        <div className="flex flex-col drop-shadow-md">
          <button onClick={() => setView('client_grid')} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors mb-4 text-sm font-medium w-fit">
            <ArrowLeft size={16} /> Back to Showroom
          </button>
          <h2 className="text-sm tracking-[0.3em] text-zinc-400 uppercase font-semibold">{vehicle.brand}</h2>
          <h1 className="text-4xl md:text-5xl font-light tracking-tight mt-1">{vehicle.model}</h1>
        </div>

        <div className="flex gap-2">
          <button onClick={undo} disabled={historyIndex <= 0} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full backdrop-blur-xl disabled:opacity-30 transition-all">
            <Undo2 size={18} />
          </button>
          <button onClick={redo} disabled={historyIndex >= history.length - 1} className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full backdrop-blur-xl disabled:opacity-30 transition-all">
            <Redo2 size={18} />
          </button>
        </div>
      </header>

      {/* Main Panels */}
      <div className="flex-1 flex flex-col md:flex-row items-end md:items-stretch justify-end p-4 md:p-6 pb-24 md:pb-6 pointer-events-none">
        
        {/* Camera Preset Toolbar */}
        <div className="absolute left-6 bottom-28 md:bottom-1/2 md:translate-y-1/2 flex flex-col gap-3 pointer-events-auto">
          {Object.keys(vehicle.cameras).map(preset => (
            <button
              key={preset}
              onClick={() => setCameraPreset(preset)}
              className={`p-3 rounded-full backdrop-blur-md border transition-all ${
                activeCameraPreset === preset ? 'bg-white text-black border-white' : 'bg-black/40 border-white/10 hover:bg-black/60 text-white'
              }`}
              title={`View: ${preset}`}
            >
              <CameraIcon size={18} />
            </button>
          ))}
        </div>

        {/* Options Panel */}
        <div className="pointer-events-auto w-full md:w-96 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden flex flex-col shadow-2xl">
          <div className="flex overflow-x-auto border-b border-white/10 scrollbar-hide">
            {vehicle.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-2 py-4 px-2 min-w-[100px] transition-all ${
                  activeCategory === cat.id ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                }`}
              >
                {icons[cat.icon] || <Settings2 size={20} />}
                <span className="text-[10px] uppercase tracking-wider font-semibold">{cat.name}</span>
                {activeCategory === cat.id && <motion.div layoutId="activeTab" className="absolute bottom-0 w-full h-0.5 bg-white" />}
              </button>
            ))}
          </div>

          <div className="p-6 flex-1 overflow-y-auto max-h-[40vh] md:max-h-[60vh]">
            <AnimatePresence mode="wait">
              <motion.div key={activeCategory} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-3">
                {currentCategoryData.options.map(option => {
                  const isSelected = selections[activeCategory] === option.id;
                  const isColor = option.hex && option.type !== MATERIAL_TYPES.CARBON;
                  
                  return (
                    <button key={option.id} onClick={() => selectOption(activeCategory, option.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border transition-all ${isSelected ? 'border-white bg-white/10' : 'border-white/5 bg-black/40 hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-4">
                        {isColor ? (
                          <div className="w-8 h-8 rounded-full border border-white/20 shadow-inner flex items-center justify-center" style={{ backgroundColor: option.hex }}>
                            {isSelected && <Check size={14} className="mix-blend-difference text-white" />}
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center">
                            {isSelected && <Check size={14} className="text-white" />}
                          </div>
                        )}
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium">{option.name}</span>
                          <span className="text-xs text-zinc-400">{option.price > 0 ? `+${FormattedPrice(option.price)}` : 'Included'}</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Pricing Footer */}
      <div className="pointer-events-auto w-full bg-black/80 backdrop-blur-xl border-t border-white/10 p-4 md:px-8 md:py-5 flex flex-col md:flex-row justify-between items-center z-20 gap-4">
        <div className="flex flex-col w-full md:w-auto">
          <span className="text-xs text-zinc-400 uppercase tracking-widest font-semibold mb-1">Total Build Price</span>
          <div className="text-3xl font-light tabular-nums"><FormattedPrice price={getTotalPrice()} /></div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-medium text-sm transition-all flex items-center justify-center gap-2">
            <Info size={16} /> Summary
          </button>
          <button className="flex-1 md:flex-none px-8 py-3 rounded-full bg-white hover:bg-gray-200 text-black font-semibold text-sm transition-all flex items-center justify-center gap-2">
            Order Now <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// --- 4B. Client Grid View ---
const ClientGrid = () => {
  const { vehicles, initializeConfigurator, setView } = useAppStore();

  return (
    <div className="w-full h-full bg-zinc-950 text-white overflow-y-auto font-sans p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-end mb-12 border-b border-white/10 pb-6">
          <div>
            <h1 className="text-4xl font-light tracking-tight mb-2">Showroom</h1>
            <p className="text-zinc-400">Select a vehicle to begin configuration.</p>
          </div>
          <button onClick={() => setView('landing')} className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">
            Exit
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map(v => (
            <div 
              key={v.id} 
              onClick={() => initializeConfigurator(v.id)}
              className="group cursor-pointer bg-zinc-900 border border-white/5 rounded-2xl overflow-hidden hover:border-white/20 transition-all hover:-translate-y-1 shadow-lg hover:shadow-2xl"
            >
              <div className="h-48 bg-gradient-to-br from-zinc-800 to-black relative flex items-center justify-center">
                <CarFront size={64} className="text-zinc-700 group-hover:text-zinc-500 transition-colors" />
                {v.url && <div className="absolute top-4 right-4 bg-blue-500/20 text-blue-400 text-[10px] font-bold px-2 py-1 rounded border border-blue-500/30">Custom 3D Model</div>}
              </div>
              <div className="p-6">
                <div className="text-xs text-zinc-500 tracking-widest uppercase mb-1">{v.brand}</div>
                <h3 className="text-2xl font-light mb-4 group-hover:text-white text-zinc-200 transition-colors">{v.model}</h3>
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-zinc-400">From <span className="text-white">{FormattedPrice(v.basePrice)}</span></span>
                  <span className="text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform">Configure <ChevronRight size={16}/></span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 4C. Admin Dashboard ---
const AdminDashboard = () => {
  const { vehicles, removeVehicle, addVehicle, setView, adminLogout } = useAppStore();
  const [formData, setFormData] = useState({ brand: '', model: '', year: new Date().getFullYear(), basePrice: 50000 });
  const [file, setFile] = useState(null);

  const handleUpload = (e) => {
    e.preventDefault();
    if (!file || !formData.brand || !formData.model) return alert("Please fill all fields and select a GLB/GLTF file.");
    addVehicle({ ...formData, basePrice: Number(formData.basePrice), year: Number(formData.year) }, file);
    setFile(null);
    setFormData({ brand: '', model: '', year: new Date().getFullYear(), basePrice: 50000 });
    e.target.reset();
  };

  return (
    <div className="w-full h-full bg-zinc-950 text-white overflow-y-auto font-sans p-8 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        <header className="flex justify-between items-center mb-12 border-b border-white/10 pb-6">
          <div className="flex items-center gap-3">
            <Shield className="text-blue-500" />
            <h1 className="text-3xl font-light">Admin Control Panel</h1>
          </div>
          <button onClick={adminLogout} className="px-4 py-2 rounded border border-white/10 text-sm hover:bg-white/5 transition-colors">
            Secure Logout
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Upload Form */}
          <div className="col-span-1 bg-zinc-900 border border-white/10 p-6 rounded-2xl h-fit">
            <h2 className="text-xl font-medium mb-6 flex items-center gap-2"><Upload size={20}/> Upload New Model</h2>
            <form onSubmit={handleUpload} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Brand</label>
                <input required type="text" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} className="w-full bg-black border border-white/10 rounded p-3 mt-1 text-sm focus:border-blue-500 outline-none" placeholder="e.g. Porsche" />
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider">Model Name</label>
                <input required type="text" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full bg-black border border-white/10 rounded p-3 mt-1 text-sm focus:border-blue-500 outline-none" placeholder="e.g. 911 GT3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wider">Base Price ($)</label>
                  <input required type="number" value={formData.basePrice} onChange={e => setFormData({...formData, basePrice: e.target.value})} className="w-full bg-black border border-white/10 rounded p-3 mt-1 text-sm focus:border-blue-500 outline-none" />
                </div>
                <div>
                  <label className="text-xs text-zinc-400 uppercase tracking-wider">Year</label>
                  <input required type="number" value={formData.year} onChange={e => setFormData({...formData, year: e.target.value})} className="w-full bg-black border border-white/10 rounded p-3 mt-1 text-sm focus:border-blue-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="text-xs text-zinc-400 uppercase tracking-wider">3D Model File (.glb, .gltf)</label>
                <input required type="file" accept=".glb,.gltf" onChange={e => setFile(e.target.files[0])} className="w-full bg-black border border-white/10 rounded p-2 mt-1 text-sm text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-white/10 file:text-white hover:file:bg-white/20" />
              </div>
              
              <button type="submit" className="mt-4 w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded transition-colors flex items-center justify-center gap-2">
                <Plus size={18} /> Add Vehicle to Database
              </button>
            </form>
          </div>

          {/* Asset List Grid */}
          <div className="col-span-1 lg:col-span-2">
             <h2 className="text-xl font-medium mb-6">Current Inventory Database</h2>
             <div className="bg-zinc-900 border border-white/10 rounded-2xl overflow-hidden">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="bg-black/50 border-b border-white/10 text-xs uppercase tracking-wider text-zinc-500">
                     <th className="p-4 font-medium">ID / Type</th>
                     <th className="p-4 font-medium">Vehicle</th>
                     <th className="p-4 font-medium">Base Price</th>
                     <th className="p-4 font-medium text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody>
                   {vehicles.map(v => (
                     <tr key={v.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                       <td className="p-4">
                         <div className="text-sm font-mono text-zinc-300">{v.id}</div>
                         <div className="text-xs text-blue-400 mt-1">{v.url ? 'Custom Upload' : 'Procedural Mesh'}</div>
                       </td>
                       <td className="p-4">
                         <div className="font-medium text-white">{v.brand} {v.model}</div>
                         <div className="text-xs text-zinc-500">{v.year} Spec</div>
                       </td>
                       <td className="p-4 text-sm text-zinc-300">
                         {FormattedPrice(v.basePrice)}
                       </td>
                       <td className="p-4 text-right">
                         <button onClick={() => removeVehicle(v.id)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded transition-colors" title="Delete Database Entry">
                           <Trash2 size={18} />
                         </button>
                       </td>
                     </tr>
                   ))}
                   {vehicles.length === 0 && (
                     <tr><td colSpan="4" className="p-8 text-center text-zinc-500">No vehicles in inventory.</td></tr>
                   )}
                 </tbody>
               </table>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

// --- 4D. Landing & Login ---
const LandingPage = () => {
  const { setView, adminLogin } = useAppStore();
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);

  const handleLogin = (e) => {
    e.preventDefault();
    if (!adminLogin(password)) alert("Incorrect Password. Hint: It's 'admin'");
  };

  return (
    <div className="w-full h-full bg-black text-white flex flex-col items-center justify-center font-sans relative overflow-hidden">
      
      {/* Background Graphic */}
      <div className="absolute inset-0 opacity-20 pointer-events-none flex items-center justify-center">
         <div className="w-[800px] h-[800px] bg-blue-500/20 rounded-full blur-[100px]" />
      </div>

      <div className="z-10 text-center max-w-xl p-8">
        <h1 className="text-5xl font-light tracking-tight mb-4">Enterprise Configurator</h1>
        <p className="text-zinc-400 mb-12">Data-driven automotive visualization platform. Connect immersive 3D showrooms with your internal CMS seamlessly.</p>
        
        {!showLogin ? (
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <button onClick={() => setView('client_grid')} className="px-8 py-4 bg-white text-black rounded font-medium flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors">
              <LayoutGrid size={20} /> Client Showroom
            </button>
            <button onClick={() => setShowLogin(true)} className="px-8 py-4 bg-zinc-900 border border-white/10 text-white rounded font-medium flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors">
              <Lock size={20} /> Admin Portal
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin} className="bg-zinc-900 border border-white/10 p-8 rounded-2xl flex flex-col gap-4 text-left mx-auto max-w-sm w-full animate-in fade-in zoom-in duration-300">
            <h2 className="text-xl font-medium flex items-center gap-2"><Lock size={18} className="text-blue-400"/> Admin Access</h2>
            <p className="text-xs text-zinc-400">Password is "admin"</p>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter Master Password" autoFocus className="w-full bg-black border border-white/10 rounded p-3 text-sm focus:border-blue-500 outline-none" />
            <div className="flex gap-2 mt-2">
               <button type="button" onClick={() => setShowLogin(false)} className="flex-1 py-3 text-sm text-zinc-400 hover:text-white transition-colors">Cancel</button>
               <button type="submit" className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded text-sm font-medium transition-colors">Authenticate</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};


// ==========================================
// 5. APP BOOTSTRAP & ROUTER
// ==========================================

export default function App() {
  const { currentView } = useAppStore();

  return (
    <div className="w-full h-screen overflow-hidden relative">
      {/* View Router */}
      <AnimatePresence mode="wait">
        {currentView === 'landing' && <LandingPage key="landing" />}
        {currentView === 'client_grid' && <ClientGrid key="grid" />}
        {currentView === 'admin_dashboard' && <AdminDashboard key="admin" />}
        
        {currentView === 'configurator' && (
          <div key="config" className="w-full h-full relative">
            <ThreeViewer />
            <ConfiguratorUI />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}