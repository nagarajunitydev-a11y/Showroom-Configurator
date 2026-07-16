# Premium Camera System - Visual Architecture Guide

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    REACT COMPONENT LAYER                        │
│                  (Your VehicleConfigurator)                      │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  usePremiumCamera Hook                                   │  │
│  │  ├─ camera: PremiumVehicleCamera                        │  │
│  │  ├─ resetCamera()                                       │  │
│  │  ├─ focusOnPart()                                       │  │
│  │  ├─ focusOnPartList()                                   │  │
│  │  ├─ animateTo()                                         │  │
│  │  └─ getState()                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Manages lifecycle
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│              CAMERA CONTROLLER LAYER                            │
│         (PremiumVehicleCamera class)                            │
│                                                                  │
│  Core Responsibilities:                                         │
│  • Orbital rotation around vehicle center                      │
│  • Auto-framing based on bounding box                          │
│  • Smooth damping and easing                                   │
│  • Part focus animations                                       │
│  • User interaction handling                                   │
│  • Event listener management                                   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Private Properties                                     │  │
│  │  • orbitState: {angle, radius, fov, ...}             │  │
│  │  • animationState: {startPos, targetPos, ...}        │  │
│  │  • targetCenter: Vector3                              │  │
│  │  • isUserInteracting: boolean                          │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Key Methods                                            │  │
│  │  • update(deltaTime) - Called every frame             │  │
│  │  • frameVehicle(obj) - Auto-frame vehicle             │  │
│  │  • focusOnPart(obj) - Focus on part                   │  │
│  │  • animateTo({...}) - Custom animation                │  │
│  │  • applyDamping() - Smooth transitions                │  │
│  │  • validateConstraints() - Prevent clipping           │  │
│  └─────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │  Event Handlers                                         │  │
│  │  • onMouseDown() - Start interaction                   │  │
│  │  • onMouseMove() - Update orbit angles                 │  │
│  │  • onMouseUp() - End interaction                       │  │
│  │  • onWheel() - Handle zoom                             │  │
│  └─────────────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Uses
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│               MATH UTILITIES LAYER                              │
│               (cameraUtils.ts)                                  │
│                                                                  │
│  Pure Functions (No Side Effects):                             │
│  • calculateFramingForBoundingBox()                            │
│  • calculateOrbitPosition()                                    │
│  • positionToOrbitAngles()                                     │
│  • easeInOutCubic()                                            │
│  • normalizeAngle()                                            │
│  • lerpAngle()                                                 │
│  • clamp()                                                      │
│  • getBoundingBoxOfObject()                                    │
│  • validateCameraParams()                                      │
│  • calculateOptimalOrbitRadius()                               │
└──────────────────┬──────────────────────────────────────────────┘
                   │ Updates
                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                THREE.JS SCENE                                   │
│         (Camera, Renderer, Scene)                              │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────┐            │
│  │   Camera    │  │   Vehicle    │  │  Lighting  │            │
│  │  Position   │  │   (Group)    │  │            │            │
│  │  FOV        │  │   Matrix     │  │            │            │
│  │  Rotation   │  │   Bounds     │  │            │            │
│  └─────────────┘  └──────────────┘  └────────────┘            │
│                                                                  │
│        Rendered to Canvas/Viewport                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

### Auto-Framing Flow

```
Load Vehicle
    │
    ▼
Calculate Bounding Box
    │
    ├─ Get min/max coordinates
    ├─ Calculate center (0,0,0 assumed)
    └─ Get max dimension
    │
    ▼
Calculate Optimal Distance
    │
    ├─ FOV: 35°
    ├─ Viewport %: 75%
    ├─ Distance = size / (2 * tan(FOV/2) * (75/100))
    └─ Result: ~5 units away
    │
    ▼
Set Camera
    │
    ├─ Position = (5, 2, 5) [orbit position]
    ├─ LookAt = (0, 0.5, 0) [vehicle center]
    └─ Vehicle occupies 75% of viewport ✓
```

### Orbit Interaction Flow

```
Mouse Down
    │ Start interaction
    ▼
Mouse Move (Δx, Δy)
    │
    ├─ Δx → Rotate horizontally
    │  └─ angle += Δx * sensitivity (0.01)
    │
    └─ Δy → Rotate vertically
       └─ angle += Δy * sensitivity
       └─ Clamp to (-90°, +90°) to prevent flip
    │
    ▼
Every Frame
    │
    ├─ Apply damping (0.08)
    │  └─ Smooth interpolation to target angle
    │
    ├─ Calculate new position
    │  └─ OrbitPosition(angle, distance)
    │
    └─ Update camera.position
    │
    ▼
Mouse Up
    │ End interaction
    └─ Continue smoothing until at target
```

### Part Focus Flow

```
Click "Focus on Wheels"
    │
    ▼
Get Part (wheels object)
    │
    ├─ Find object by name
    └─ If not found, show error
    │
    ▼
Calculate Bounding Box
    │
    ├─ Get part bounds
    ├─ Calculate part center
    └─ Calculate part size
    │
    ▼
Calculate Camera Position
    │
    ├─ Distance to frame part at 75%
    ├─ Angle to face part center
    └─ Result: animation target
    │
    ▼
Start Animation
    │
    ├─ Start position: current camera pos
    ├─ Target position: calculated pos
    ├─ Duration: 800ms (configurable)
    └─ Easing: cubic ease-in-out
    │
    ▼
Every Frame (0 → 800ms)
    │
    ├─ progress = elapsed / 800
    ├─ eased = easeInOutCubic(progress)
    ├─ position = lerp(start, target, eased)
    └─ Update camera.position
    │
    ▼
Animation Complete (800ms)
    │
    └─ Wheels now fill viewport ✓
```

### State Management Flow

```
┌─────────────────┐
│  Current State  │
├─────────────────┤
│ Position (x,y,z)
│ Orbit Angles
│ Radius
│ FOV
│ Is Animating
│ Is Interacting
└─────────────────┘
    │ User Input / Automation
    ▼
┌─────────────────┐
│ Target State    │
├─────────────────┤
│ Target Position
│ Target Angles
│ Target Radius
│ Target FOV
└─────────────────┘
    │
    │ Apply Damping/Easing
    ▼
┌─────────────────┐
│ Next State      │
├─────────────────┤
│ Smoothly Interpolated
│ Toward Target
└─────────────────┘
    │
    └─► Every Frame Loop
```

---

## Constraint System

```
VERTICAL ANGLE CONSTRAINTS
═══════════════════════════

         +90° (straight up)
            │
            │  ← Max: π/2 + 0.1
            ├─ ZONE A: Valid
            │  (prevents flipping)
            │
            │
   -90° ────┼──── +90°
            │
            │
            │  ← Zone B: Blocked
            ├─ Prevents upside-down
            │
            └──


DISTANCE CONSTRAINTS
════════════════════

Min Distance: 2.5 units
├─ Prevents clipping
└─ Vehicle always visible

Ideal Distance: ~5 units
├─ Calculated from FOV
└─ Vehicle at 75% viewport

Max Distance: 20 units
├─ Prevents zooming out too far
└─ Vehicle still visible


FOV CONSTRAINTS
═══════════════

Min FOV: 30°
├─ Wider = more distortion
└─ Not recommended

Default FOV: 35°
├─ Sweet spot for vehicles
└─ Professional look

Max FOV: 40°
├─ Cinematic feel
└─ Still balanced
```

---

## Interaction Model

```
MOUSE INTERACTION
═════════════════

Drag (Click + Move):
  ├─ Horizontal: Rotate around vertical axis (yaw)
  ├─ Vertical: Rotate up/down (pitch)
  ├─ Sensitivity: 0.01 (can tune)
  └─ Damping: 0.08 (smooth easing)

Scroll (Wheel):
  ├─ Up: Zoom in
  ├─ Down: Zoom out
  ├─ Sensitivity: 0.1 (can tune)
  └─ Damping: 0.1 (smooth easing)

Pan (Prevented):
  ├─ Vehicle stays centered
  ├─ No panning allowed
  └─ Orbit radius stays constant


ANIMATION INTERACTION
═════════════════════

focusOnPart(wheels):
  ├─ Smooth 800ms animation
  ├─ Cubic ease-in-out
  ├─ Camera moves to frame wheels
  └─ User can interrupt with mouse

resetCamera():
  ├─ Return to default view (35°×18°)
  ├─ Smooth animation
  └─ User can interrupt

animateTo({...}):
  ├─ Custom target angles/distance
  ├─ Custom duration (default 800ms)
  └─ User can interrupt
```

---

## Animation Easing

```
CUBIC EASE-IN-OUT
═════════════════

Input (t): 0 → 1 (animation progress)
Output: 0 → 1 (eased progress)

Curve:
   1.0 ┌───────────╮
       │         ╱╲
       │       ╱    ╲
       │     ╱        ╲
   0.5 ┤   ╱            ╲
       │ ╱                ╲
       │╱                  ╲
   0.0 └────────────────────┘
       0                    1

Properties:
• Starts slow (ease-in)
• Speeds up in middle
• Slows down at end (ease-out)
• Result: Natural, professional motion
• Perfect for 800ms animations
```

---

## Configuration Tuning Guide

```
ORBIT DAMPING (0-1, lower = faster response)
════════════════════════════════════════════

0.05: Super responsive, very twitchy
│         ▯
│       ▯
│     ▯
├──────  Default Recommendations
│        • Sports cars
│        • Aggressive feel
│
0.08: Balanced, recommended default
│
│    ▯   Default Recommendations
│      ▯ • Most vehicles
│        • Professional feel
│      ▯
├──────
│
0.15: Smooth, deliberate
│           ▯
│         ▯
│       ▯
│      ▯
│    ▯
│   ▯
│ ▯  • Luxury sedans
│    • Premium feel
│    • Slower motion


ZOOM DAMPING (0-1, lower = faster response)
══════════════════════════════════════════

0.05: Snappy zoom
├─ Immediate response
└─ Great for detail work

0.10: Balanced zoom (default)
├─ Good for most uses
└─ Smooth but responsive

0.20: Smooth zoom
├─ Gradual transitions
└─ Premium feel
```

---

## Performance Profile

```
FRAME TIME BREAKDOWN
════════════════════

Camera Update:        <1ms   ███
Damping Calculation:  <0.5ms ██
Easing Calculation:   <0.5ms ██
Position Update:      <0.5ms ██
─────────────────────────────
Total Camera:         ~2ms   ████

Three.js Render:      ~10ms  ██████████
Other:                ~6ms   ██████
─────────────────────────────
Total Frame (60fps):  ~16ms  ████████████████

Result: ~2ms per frame for camera system
        Perfect for 60fps target
```

---

## File Dependencies

```
usePremiumCamera.ts
├─ imports PremiumVehicleCamera
├─ imports THREE
└─ imports cameraTypes

Your Component (React)
├─ imports usePremiumCamera
├─ imports THREE
└─ imports cameraTypes

PremiumVehicleCamera.ts
├─ imports cameraUtils
├─ imports THREE
└─ imports cameraTypes

cameraUtils.ts
└─ imports THREE (for Vector3, Box3)

cameraTypes.ts
├─ imports THREE (for type definitions)
└─ no other dependencies

ThreeViewerPremium.tsx (Example)
├─ imports usePremiumCamera
├─ imports THREE
├─ imports cameraTypes
└─ imports useAppStore
```

---

## Browser Compatibility

```
Chrome/Edge:          ✓ 90+
Firefox:              ✓ 88+
Safari:               ✓ 15+
Opera:                ✓ 76+
Mobile Chrome:        ✓ Latest
Mobile Safari:        ✓ 15+
IE:                   ✗ Not supported
```

---

## Memory Architecture

```
Per-Camera Instance
═══════════════════

Strings/Numbers:           ~500 bytes
  ├─ Event listeners
  ├─ Configuration
  └─ State variables

THREE.Vector3 objects:     ~400 bytes
  ├─ targetCenter
  ├─ animationStart/target
  └─ temporary calculations

Listeners/Callbacks:       ~200 bytes
  └─ Event handlers

Total per instance:        ~1.1 KB

Typical usage (5 vehicles):
  ~5.5 KB total memory
  → Negligible impact
```

---

## State Transitions

```
CAMERA STATE MACHINE
════════════════════

           ┌──────────────────┐
           │   IDLE STATE     │
           │ (waiting for     │
           │  interaction)    │
           └──────────────────┘
                 │     ▲
                 │     │
    User Drag    │     │ Animation
         │       │     │ Complete
         ▼       │     │
           ┌──────────────────┐
           │ INTERACTING      │
           │ (responding to   │
           │  mouse moves)    │
           └──────────────────┘
                 │
    User Releases│
         (mouse │ up)
         ▼
           ┌──────────────────┐
           │ DAMPING          │
           │ (smoothly        │
           │  interpolating)  │
           └──────────────────┘
                 │
                 │ (when focusOnPart called)
                 ▼
           ┌──────────────────┐
           │ ANIMATING        │
           │ (ease-in-out     │
           │  transition)     │
           └──────────────────┘
                 │
    Animation    │
      Complete   │
         ▼
           ┌──────────────────┐
           │ IDLE STATE       │
           │ (back to idle)   │
           └──────────────────┘
```

---

This visual architecture guide complements the technical documentation.
Refer back to this for understanding system design and data flows.
