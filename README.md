# Vehicle Configurator

A production-ready React + TypeScript + Vite project for an interactive automotive configurator with a 3D viewer, showroom experience, and admin dashboard.

## Features

- Interactive vehicle configurator UI
- 3D viewer powered by Three.js
- Camera presets and material selection
- Vehicle showroom grid
- Admin dashboard for adding/removing vehicles
- Zustand-based state management
- Framer Motion animations

## Tech Stack

- React 18
- TypeScript
- Vite
- Three.js
- Zustand
- Framer Motion
- Tailwind CSS
- Lucide React

## Project Structure

```text
src/
  components/      # Reusable UI and 3D components
  pages/           # Landing, showroom, admin pages
  hooks/           # Custom hooks
  layouts/         # Layout wrappers
  services/        # Shared services/helpers
  utils/           # Utility functions
  styles/          # Global styles
  store.ts         # Zustand store
  types.ts         # Shared TypeScript models
  App.tsx          # App shell
  main.tsx         # Entry point
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install dependencies

```bash
npm install
```

### Run locally

```bash
npm run dev
```

Then open http://localhost:3000/

### Build for production

```bash
npm run build
```

## Notes

- The app uses a procedural 3D vehicle fallback when no custom GLB/GLTF model is uploaded.
- The admin portal password is `admin`.

## License

This project is for educational and demonstration purposes.
