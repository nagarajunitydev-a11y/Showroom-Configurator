# Premium 3D Vehicle Configurator Camera System

A sophisticated camera controller for automotive configurators that delivers a premium, cinematic showroom experience. Automatically frames vehicles, enables smooth orbit controls, and smoothly transitions focus to specific parts.

## Features

### 🎥 **Cinematic Framing**
- **Auto-Framing**: Automatically frames any vehicle size or with accessories at 70-85% of viewport
- **Default Three-Quarter View**: Professional 35° horizontal × 18° vertical view angle
- **Optimized FOV**: Cinematic 30-40° field of view for showroom aesthetics
- **Bounding Box Detection**: Intelligently calculates framing based on vehicle dimensions

### 🎮 **Smooth Interactions**
- **Orbital Camera**: Smooth mouse-drag rotation around vehicle center
- **Scroll Zoom**: Seamless zoom with damping to prevent jarring transitions
- **Constant Orbit**: Maintains radius while rotating, never panning away from center
- **Damping**: Configurable easing for natural, fluid motion (similar to Lamborghini/Porsche)

### 🛡️ **Safety & Constraints**
- **No Clipping**: Prevents camera from intersecting the vehicle
- **No Flipping**: Vertical angle constraints prevent camera flip-overs
- **No Excessive Panning**: Vehicle stays centered throughout all interactions
- **Distance Constraints**: Configurable min/max orbit distances

### ✨ **Part Focus & Animations**
- **Smart Part Focusing**: Smoothly transition camera to focus on any vehicle part (wheels, lights, interior)
- **Ease-In-Out Animations**: Professional cubic easing for 800ms smooth transitions
- **Multiple Part Selection**: Focus on multiple parts simultaneously with combined bounding box
- **Customizable Duration**: Control animation speed per focus request

### 📱 **Professional Features**
- **Responsive**: Automatically adapts to window resizing
- **Memory Safe**: Proper cleanup and disposal of resources
- **Zero Dependencies**: Uses only Three.js, no extra camera libraries
- **Type-Safe**: Full TypeScript support with comprehensive interfaces

## Architecture

```
src/
├── utils/
│   ├── cameraUtils.ts              # Pure math utilities for camera calculations
│   └── PremiumVehicleCamera.ts     # Main camera controller class
├── hooks/
│   └── usePremiumCamera.ts         # React hook for easy integration
└── components/
    └── ThreeViewerPremium.tsx      # Complete example integration
```

## Installation

1. Copy the files to your project:
   - `src/utils/cameraUtils.ts`
   - `src/utils/PremiumVehicleCamera.ts`
   - `src/hooks/usePremiumCamera.ts`

2. No additional dependencies required (uses existing `three` package)

## Basic Usage

### In Your Three.js Scene Setup

```typescript
import { PremiumVehicleCamera, PremiumCameraConfig } from './utils/PremiumVehicleCamera';

const cameraConfig: PremiumCameraConfig = {
  viewportPercentage: 75,           // 70-85% recommended
  defaultFov: 35,                   // Cinematic field of view
  minFov: 30,
  maxFov: 40,
  defaultHorizontalAngle: 0.61,     // ~35° 
  defaultVerticalAngle: 0.31,       // ~18°
  minOrbitDistance: 2.5,
  maxOrbitDistance: 25,
  animationDuration: 800,           // ms for transitions
  orbitDamping: 0.08,
  zoomDamping: 0.1,
};

const camera = new THREE.PerspectiveCamera(35, aspect, 0.1, 100);
const premiumCamera = new PremiumVehicleCamera(camera, containerDiv, cameraConfig);

// Auto-frame the vehicle
premiumCamera.frameVehicle(vehicleGroup, true);

// In your animation loop
function animate() {
  premiumCamera.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

// Cleanup
window.addEventListener('beforeunload', () => {
  premiumCamera.dispose();
});
```

### Using the React Hook

```typescript
import { usePremiumCamera } from './hooks/usePremiumCamera';

function VehicleConfigurator() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [vehicleGroup, setVehicleGroup] = useState<THREE.Object3D | null>(null);
  const [camera, setCamera] = useState<THREE.PerspectiveCamera | null>(null);

  const { resetCamera, focusOnPart, focusOnPartList, animateTo, getState } = usePremiumCamera({
    camera,
    container: containerRef.current,
    vehicleGroup,
    cameraConfig: {
      viewportPercentage: 75,
      defaultFov: 35,
      // ... other config
    },
    autoFrame: true,
  });

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%' }}>
      {/* Your Three.js canvas */}
    </div>
  );
}
```

## API Reference

### PremiumVehicleCamera Class

#### Constructor
```typescript
new PremiumVehicleCamera(
  camera: THREE.PerspectiveCamera,
  container: HTMLElement,
  config?: PremiumCameraConfig
)
```

#### Methods

**frameVehicle(vehicleGroup, animate?)**
- Auto-frames a vehicle based on its bounding box
- Automatically calculates the optimal camera distance to show vehicle at 70-85% viewport
- Parameters:
  - `vehicleGroup`: THREE.Object3D - The vehicle model/group
  - `animate`: boolean - Whether to smoothly animate to new framing (default: false)

**focusOnPart(partObject, animate?, duration?)**
- Smoothly focuses camera on a specific vehicle part (wheel, light, interior, etc.)
- Parameters:
  - `partObject`: THREE.Object3D - The part to focus on
  - `animate`: boolean - Use smooth easing animation (default: true)
  - `duration`: number - Animation duration in ms (default: 800ms)

**focusOnPartList(partObjects, duration?)**
- Focuses on multiple parts simultaneously using their combined bounding box
- Parameters:
  - `partObjects`: THREE.Object3D[] - Array of parts to focus on
  - `duration`: number - Animation duration in ms

**animateTo(target, duration?)**
- Animates camera to specific orbit position with easing
- Parameters:
  - `target`: Object containing:
    - `horizontalAngle?`: number - Rotation around vertical axis (radians)
    - `verticalAngle?`: number - Elevation angle (radians)
    - `radius?`: number - Distance from center
    - `fov?`: number - Field of view angle (degrees)
  - `duration`: number - Animation duration in ms

**resetToDefault(animate?)**
- Returns camera to default three-quarter view (35° × 18°)
- Parameters:
  - `animate`: boolean - Use smooth animation (default: true)

**update(deltaTime?)**
- Updates camera position based on current state and damping
- Must be called every frame in your animation loop
- Parameters:
  - `deltaTime`: number - Delta time since last frame (optional)

**onWindowResize()**
- Handles window resize events
- Updates camera aspect ratio and projection matrix

**setTargetCenter(center)**
- Sets the point around which camera orbits
- Parameters:
  - `center`: THREE.Vector3 - New orbit center

**getTargetCenter()**
- Returns the current orbit center point

**getState()**
- Returns current camera state for debugging or persistence
- Returns:
  ```typescript
  {
    position: THREE.Vector3,
    target: THREE.Vector3,
    fov: number,
    orbit: {
      horizontalAngle: number,
      verticalAngle: number,
      radius: number
    },
    isAnimating: boolean,
    isUserInteracting: boolean
  }
  ```

**dispose()**
- Cleans up all event listeners and resources
- Call when destroying the camera controller

### usePremiumCamera Hook

```typescript
const {
  camera,           // PremiumVehicleCamera instance (or null)
  resetCamera,      // () => void
  focusOnPart,      // (part, duration?) => void
  focusOnPartList,  // (parts, duration?) => void
  animateTo,        // (target) => void
  getState,         // () => CameraState | undefined
} = usePremiumCamera(options);
```

### Configuration Interface

```typescript
interface PremiumCameraConfig {
  // Viewport framing (70-85% recommended)
  viewportPercentage?: number;

  // Field of view (30-40° recommended for cinematic)
  defaultFov?: number;        // 35° default
  minFov?: number;            // 30° default
  maxFov?: number;            // 40° default

  // Default three-quarter view
  defaultHorizontalAngle?: number;  // 0.61 rad (~35°)
  defaultVerticalAngle?: number;    // 0.31 rad (~18°)

  // Orbit constraints
  minOrbitDistance?: number;   // 3 default
  maxOrbitDistance?: number;   // 20 default
  verticalAngleConstraint?: number; // Math.PI/2 + 0.1

  // Animation and smoothing
  animationDuration?: number;  // 800ms
  orbitDamping?: number;       // 0.08 (0-1)
  zoomDamping?: number;        // 0.1 (0-1)

  // Interaction sensitivity
  orbitSensitivity?: number;   // 0.01
  zoomSensitivity?: number;    // 0.1

  // Camera planes
  nearPlane?: number;          // 0.1
  farPlane?: number;           // 100
}
```

## Utility Functions

### Camera Math Utilities

**calculateFramingForBoundingBox(boundingBox, viewportPercentage, fov, aspect)**
- Calculates optimal camera distance to frame a bounding box
- Returns: `{ distance: number, fov: number }`

**calculateOrbitPosition(center, horizontalAngle, verticalAngle, radius)**
- Calculates camera position for an orbit
- Returns: `THREE.Vector3`

**positionToOrbitAngles(cameraPos, center)**
- Converts camera position to orbit angles
- Returns: `{ horizontalAngle, verticalAngle, radius }`

**easeInOutCubic(t)**
- Cubic ease-in-out easing function
- Input: 0 to 1
- Returns: 0 to 1 (eased)

**normalizeAngle(angle)**
- Normalizes angle to -PI to PI range
- Prevents angle accumulation

**lerpAngle(a, b, t)**
- Linear interpolation between angles using shortest path
- Prevents spinning the long way

## Examples

### Example 1: Focus on Wheels

```typescript
// Find wheel meshes in your scene
const wheels = vehicleGroup.children.filter(child => 
  child.name.toLowerCase().includes('wheel')
);

// Focus camera on all wheels
cameraController.focusOnPartList(wheels, 600);
```

### Example 2: Interior Inspection

```typescript
// Get the cabin/interior part
const interior = vehicleGroup.getObjectByName('Cabin');

if (interior) {
  // Smoothly focus on interior with custom animation
  cameraController.focusOnPart(interior, true, 1000);
}
```

### Example 3: Custom Animation

```typescript
// Rotate around vehicle at current distance
cameraController.animateTo({
  horizontalAngle: Math.PI / 4,  // 45° from original
  verticalAngle: 0.3,
  // fov stays same
}, 1000);
```

### Example 4: Full Configurator Setup

```typescript
import { ThreeViewerPremium } from './components/ThreeViewerPremium';

export function VehicleConfigurator() {
  return (
    <div className="w-full h-screen flex">
      {/* 3D Viewer with premium camera */}
      <div className="flex-1">
        <ThreeViewerPremium />
      </div>

      {/* Control Panel */}
      <div className="w-80 bg-white shadow-lg overflow-y-auto">
        {/* Parts focus buttons */}
        <button onClick={() => focusOnPart(wheels)}>
          Focus on Wheels
        </button>
        <button onClick={() => focusOnPart(lights)}>
          Focus on Lights
        </button>
        <button onClick={resetCamera}>
          Reset View
        </button>
      </div>
    </div>
  );
}
```

## Performance Considerations

### Optimization Tips

1. **Use Damping Wisely**
   - `orbitDamping: 0.08` provides smooth, responsive feel
   - Increase to 0.15+ for slower, more deliberate motion
   - Decrease to 0.05 for twitchy, responsive feel

2. **Animation Duration**
   - 800ms is optimal for most part transitions
   - Keep between 400ms-1200ms for professional feel
   - Avoid animations < 300ms (feels janky)

3. **Distance Constraints**
   - Set `minOrbitDistance` high enough to prevent camera from entering vehicle (at least 2.5)
   - Set `maxOrbitDistance` based on your scene size

4. **FOV Range**
   - Keep between 30-40° for automotive (wider FOV distorts vehicle)
   - 35° is sweet spot for most vehicles

### Memory Management

```typescript
// Always dispose when unmounting
useEffect(() => {
  return () => {
    premiumCamera?.dispose();
  };
}, []);
```

## Troubleshooting

### Camera Clipping Through Vehicle
- Increase `minOrbitDistance`
- Reduce `viewportPercentage` to smaller value (70% instead of 85%)

### Camera Flipping When Rotating
- Adjust `verticalAngleConstraint` - increase to prevent flipping
- Default is `Math.PI/2 + 0.1` which prevents full flip

### Zoom Too Sensitive
- Reduce `zoomSensitivity` from 0.1 to 0.05
- Increase `zoomDamping` for smoother transitions

### Rotation Too Sensitive
- Reduce `orbitSensitivity` from 0.01 to 0.005
- Increase `orbitDamping` for smoother damping

### Vehicle Not Centering Properly
- Ensure vehicle model is centered at origin (0, 0, 0)
- Check that vehicle group matrix is updated: `vehicleGroup.matrixWorldAutoUpdate = true`

### Parts Not Focusing Correctly
- Verify part objects have correct geometry
- Ensure parts are children of vehicle group
- Check part bounding box: `new THREE.Box3().setFromObject(part).getSize()`

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 15+
- Opera 76+

## License

Same as parent project

## Credits

Inspired by premium automotive configurators:
- Lamborghini Configurator
- Porsche Configurator  
- Tesla Configurator

## Support

For issues or questions:
1. Check the API Reference
2. Review the Examples section
3. Enable debug logging in `getState()` method
4. Verify camera bounds and constraints
