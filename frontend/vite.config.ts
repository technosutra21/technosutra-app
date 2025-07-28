import react from "@vitejs/plugin-react";
import { componentTagger } from "lovable-tagger";
import path from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: process.env.NODE_ENV === 'production' ? '/technosutra-app/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: mode === 'development',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    rollupOptions: {
      external: mode === 'production' ? [] : undefined,
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select'
          ],
          maps: ['@maptiler/sdk'],
          models: ['@google/model-viewer', 'three'],
          animations: ['framer-motion'],
          router: ['react-router-dom'],
          query: ['@tanstack/react-query']
        }
      }
    },
    chunkSizeWarningLimit: 1000,
  },

  // Handle model-viewer dependencies
  optimizeDeps: {
    include: ['@google/model-viewer', 'three']
  },

  // Server configuration
  server: {
    port: 3000,
    host: '0.0.0.0', // Explicitly bind to all interfaces
    allowedHosts: true,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
