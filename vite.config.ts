import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.indexOf('node_modules/three/') >= 0) return 'vendor_three';
          if (id.indexOf('node_modules/@google/model-viewer') >= 0) return 'vendor_model-viewer';
          if (id.indexOf('node_modules/framer-motion') >= 0) return 'vendor_framer-motion';
          if (id.indexOf('node_modules/lucide-react') >= 0) return 'vendor_lucide';
          if (id.indexOf('node_modules/react') >= 0) return 'vendor_react';
        },
      },
    },
  },
});
