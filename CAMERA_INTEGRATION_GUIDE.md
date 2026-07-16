# Premium Camera System - Integration Guide

## Quick Start

### Step 1: Files Created

The premium camera system consists of 5 key files:

```
src/
├── utils/
│   ├── cameraUtils.ts              # Pure math utilities
│   └── PremiumVehicleCamera.ts     # Main camera controller
├── hooks/
│   └── usePremiumCamera.ts         # React hook wrapper
├── components/
│   ├── ThreeViewerPremium.tsx      # Example implementation
│   └── CameraExamples.tsx          # 6 usage examples
```

### Step 2: Replace Your Existing Viewer (Option A - Easy)

If you want to use the new camera system immediately:

1. Replace your current viewer with `ThreeViewerPremium`:

```tsx
// App.tsx or main configurator component
import { ThreeViewerPremium } from './components/ThreeViewerPremium';

export function Configurator() {
  return (
    <div className="flex h-screen">
      <div className="flex-1">
        <ThreeViewerPremium /> {/* Drop-in replacement */}
      </div>
      <SidePanel />
    </div>
  );
}
```

2. Everything works with default settings (cinematic 35° FOV, 75% viewport framing, smooth damping)

### Step 3: Migrate Your Existing Viewer (Option B - Custom)

If you have custom setup in your current `ThreeViewer.tsx`:

1. Keep your scene setup code
2. Add camera initialization:

```tsx
import { usePremiumCamera } from '../hooks/usePremiumCamera';

export function ThreeViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);
  const [vehicleGroup, setVehicleGroup] = useState<THREE.Object3D | null>(null);

  // Your existing scene setup...
  useEffect(() => {
    // ... existing scene code ...
    
    const camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 100);
    setCamera(camera);
    
    // ... rest of setup ...
  }, []);

  // Add this hook
  const { resetCamera, focusOnPart } = usePremiumCamera({
    camera,
    container: containerRef.current,
    vehicleGroup,
    autoFrame: true,
  });

  return <div ref={containerRef} />;
}
```

### Step 4: Configure Camera Behavior

Customize the camera for your specific needs:

```tsx
import { PremiumCameraConfig } from '../utils/PremiumVehicleCamera';

const cameraConfig: PremiumCameraConfig = {
  viewportPercentage: 75,      // 70-85% recommended
  defaultFov: 35,              // Cinematic
  minFov: 30,
  maxFov: 40,
  defaultHorizontalAngle: 0.61, // 35°
  defaultVerticalAngle: 0.31,   // 18°
  minOrbitDistance: 2.5,
  maxOrbitDistance: 20,
  animationDuration: 800,
  orbitDamping: 0.08,
  zoomDamping: 0.1,
};

const { resetCamera } = usePremiumCamera({
  camera,
  container: containerRef.current,
  vehicleGroup,
  cameraConfig,
  autoFrame: true,
});
```

## Key Features to Use

### 1. Auto-Framing (Automatic)

```tsx
const { camera } = usePremiumCamera({
  camera,
  container: containerRef.current,
  vehicleGroup,
  autoFrame: true, // Automatically frames vehicle when loaded
});
```

### 2. Part Focus (Manual)

```tsx
const { focusOnPart } = usePremiumCamera({...});

// Focus on a single part
const wheels = vehicleGroup.getObjectByName('Wheels');
focusOnPart(wheels, true, 800); // 800ms animation

// Focus on multiple parts
const parts = [
  vehicleGroup.getObjectByName('Wheels'),
  vehicleGroup.getObjectByName('Lights'),
];
focusOnPartList(parts, 600);
```

### 3. Reset View

```tsx
const { resetCamera } = usePremiumCamera({...});

<button onClick={resetCamera}>Reset to Default</button>
```

### 4. Custom Animations

```tsx
const { animateTo } = usePremiumCamera({...});

// Rotate 45° left
animateTo({
  horizontalAngle: -Math.PI / 4,
  verticalAngle: 0.3,
});

// Zoom in closer
animateTo({
  radius: 4,
  fov: 38,
});

// Top-down view
animateTo({
  horizontalAngle: 0,
  verticalAngle: Math.PI / 2.5,
  fov: 40,
});
```

### 5. Camera State (Debug/Monitoring)

```tsx
const { getState } = usePremiumCamera({...});

const state = getState();
console.log(state);
// {
//   position: Vector3,
//   target: Vector3,
//   fov: 35,
//   orbit: { horizontalAngle: 0.61, verticalAngle: 0.31, radius: 5 },
//   isAnimating: false,
//   isUserInteracting: false
// }
```

## Common Integration Patterns

### Pattern 1: Side Panel with Part Focus Buttons

```tsx
export function ConfiguratorWithCamera() {
  const [vehicleGroup, setVehicleGroup] = useState<THREE.Object3D | null>(null);
  const { focusOnPart, resetCamera } = usePremiumCamera({...});

  return (
    <div className="flex h-screen">
      {/* 3D Viewer */}
      <div className="flex-1">
        <ThreeViewerPremium onVehicleLoad={setVehicleGroup} />
      </div>

      {/* Side Panel */}
      <div className="w-80 bg-white shadow-lg">
        <button 
          onClick={() => focusOnPart(vehicleGroup.getObjectByName('Wheels'))}
          className="w-full p-3 text-left hover:bg-gray-100"
        >
          👨 Wheels
        </button>
        
        <button 
          onClick={() => focusOnPart(vehicleGroup.getObjectByName('Interior'))}
          className="w-full p-3 text-left hover:bg-gray-100"
        >
          🛋️ Interior
        </button>

        <button 
          onClick={resetCamera}
          className="w-full p-3 bg-blue-600 text-white font-semibold"
        >
          Reset View
        </button>
      </div>
    </div>
  );
}
```

### Pattern 2: Feature Tour

```tsx
function FeatureTour() {
  const { focusOnPart, resetCamera, animateTo } = usePremiumCamera({...});
  const [tourStep, setTourStep] = useState(0);

  const runTour = async () => {
    setTourStep(1);
    await animateTo({ horizontalAngle: Math.PI / 4 });
    
    setTourStep(2);
    focusOnPart(vehicleGroup.getObjectByName('Wheels'), true, 1000);
    
    setTourStep(3);
    focusOnPart(vehicleGroup.getObjectByName('Lights'), true, 1000);
    
    setTourStep(4);
    resetCamera();
  };

  return <button onClick={runTour}>Start Tour</button>;
}
```

### Pattern 3: Preset Cameras

```tsx
const presets = {
  default: { horizontalAngle: 0.61, verticalAngle: 0.31 },
  frontLeft: { horizontalAngle: Math.PI / 6, verticalAngle: 0.3 },
  rear: { horizontalAngle: Math.PI, verticalAngle: 0.3 },
  top: { horizontalAngle: 0, verticalAngle: Math.PI / 2.2 },
  profile: { horizontalAngle: Math.PI / 2, verticalAngle: 0.2 },
};

function CameraPresets() {
  const { animateTo } = usePremiumCamera({...});

  return (
    <div className="grid grid-cols-5 gap-2">
      {Object.entries(presets).map(([name, angles]) => (
        <button
          key={name}
          onClick={() => animateTo(angles)}
          className="px-3 py-2 bg-zinc-700 hover:bg-zinc-600 rounded"
        >
          {name}
        </button>
      ))}
    </div>
  );
}
```

## Migration Checklist

- [ ] Copy 5 files to your project:
  - [ ] `cameraUtils.ts`
  - [ ] `PremiumVehicleCamera.ts`
  - [ ] `usePremiumCamera.ts`
  - [ ] `ThreeViewerPremium.tsx` (reference only, customize as needed)
  - [ ] `CameraExamples.tsx` (reference only)

- [ ] Update your scene setup to use the new camera controller

- [ ] Remove old OrbitControls if present:
  ```tsx
  // Remove this:
  const controls = new OrbitControls(camera, renderer.domElement);
  
  // The new camera controller handles all interaction
  ```

- [ ] Update camera initialization:
  ```tsx
  const camera = new THREE.PerspectiveCamera(
    35,  // defaultFov from config
    aspect,
    0.1, // nearPlane
    100  // farPlane
  );
  ```

- [ ] Add hook to your component:
  ```tsx
  const { resetCamera, focusOnPart } = usePremiumCamera({...});
  ```

- [ ] Test features:
  - [ ] Mouse drag to orbit
  - [ ] Scroll to zoom
  - [ ] Part focus buttons work
  - [ ] Reset view works
  - [ ] Auto-frame on vehicle load

- [ ] Tune configuration for your use case:
  - [ ] Adjust viewport percentage (70-85%)
  - [ ] Tune damping values
  - [ ] Set min/max zoom distances
  - [ ] Customize default angles

## Troubleshooting

### Camera not responding to mouse
```tsx
// Make sure container is set correctly
const { camera: premiumCamera } = usePremiumCamera({
  camera,
  container: containerRef.current, // Must be the Three.js container
  vehicleGroup,
});
```

### Vehicle not centered
```tsx
// Ensure vehicle is centered at (0, 0, 0)
// Or set custom target center:
premiumCamera?.setTargetCenter(new THREE.Vector3(0, 0.5, 0));
```

### Parts not focusing correctly
```tsx
// Verify part name matches exactly
const part = vehicleGroup.getObjectByName('WheelFL');
console.log('Part found:', part); // Should not be undefined

if (part) {
  focusOnPart(part, true, 800);
}
```

### Animations too slow/fast
```tsx
// Adjust animation duration
animateTo({...}, 400); // 400ms instead of default 800ms

// Or configure globally
const config: PremiumCameraConfig = {
  animationDuration: 600, // 600ms for snappier feel
};
```

### Mouse sensitivity too high/low
```tsx
const config: PremiumCameraConfig = {
  orbitSensitivity: 0.005,    // Lower = less sensitive
  zoomSensitivity: 0.05,      // Lower = less sensitive
};
```

## Performance Tips

1. **Disable auto-frame for static vehicles:**
   ```tsx
   autoFrame: false, // If vehicle doesn't change
   ```

2. **Use longer animation durations for slower devices:**
   ```tsx
   animationDuration: 1200, // 1.2s instead of 800ms
   ```

3. **Reduce damping for performance:**
   ```tsx
   orbitDamping: 0.15, // Higher = fewer calculations
   ```

4. **Monitor frame rate:**
   ```tsx
   const state = getState();
   if (state?.isUserInteracting) {
     console.time('frame');
     // render
     console.timeEnd('frame');
   }
   ```

## Next Steps

1. Review `CAMERA_SYSTEM_GUIDE.md` for complete API documentation
2. Check `CameraExamples.tsx` for 6 different usage patterns
3. Experiment with configuration values to match your brand
4. Test on different vehicles and screen sizes

## Support & Customization

For advanced customization, edit `PremiumVehicleCamera.ts` directly:
- Modify easing functions in `easeInOutCubic()`
- Adjust framing calculations in `calculateFramingForBoundingBox()`
- Add custom constraints in the `update()` method
- Extend with custom events or callbacks

## Questions?

Refer to:
1. API docs in `CAMERA_SYSTEM_GUIDE.md`
2. Examples in `CameraExamples.tsx`
3. Type definitions in `PremiumVehicleCamera.ts`
4. Utility functions in `cameraUtils.ts`
