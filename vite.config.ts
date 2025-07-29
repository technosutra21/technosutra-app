import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// Dynamic base path detection for different deployment environments
const getBasePath = (mode: string, env: Record<string, string>) => {
  // Check if we're building for GitHub Pages
  const isGitHubPages = env.GITHUB_PAGES === 'true' || 
                       env.DEPLOY_TARGET === 'github-pages' ||
                       process.env.GITHUB_PAGES === 'true';
  
  // If deploying to GitHub Pages, use repo name as base
  if (isGitHubPages && mode === 'production') {
    return '/technosutra-app/';
  }
  
  // For custom domain or local development, use root
  return '/';
};

// Enhanced Vite configuration for TECHNO SUTRA
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '');
  
  // Get dynamic base path
  const basePath = getBasePath(mode, env);

  return {
    // Dynamic base path for different deployment environments
    base: basePath,
    plugins: [
      react({
        // Include .tsx files
        include: "**/*.{jsx,tsx}",
      }),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,webp,csv,json}'],
          // Exclude large GLB files from precaching to avoid quota issues
          globIgnores: ['**/*.glb'],
          maximumFileSizeToCacheInBytes: 10 * 1024 * 1024, // 10MB limit
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/api\.maptiler\.com\/.*/i,
              handler: 'StaleWhileRevalidate', // Better for API calls
              options: {
                cacheName: 'maptiler-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
                },
              },
            },
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|webp)$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'images-cache',
                expiration: {
                  maxEntries: 200,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                },
              },
            },
            {
              // Smart caching for 3D models - only cache smaller ones
              urlPattern: /\/modelo[0-9]+\.glb$/,
              handler: 'NetworkFirst', // Try network first, fallback to cache
              options: {
                cacheName: '3d-models-cache',
                expiration: {
                  maxEntries: 20, // Only cache most recently used models
                  maxAgeSeconds: 60 * 60 * 24 * 14, // 2 weeks
                },
                cacheableResponse: {
                  statuses: [0, 200],
                  headers: {
                    'content-length': '5242880', // Only cache files under 5MB
                  },
                },
              },
            },
          ],
        },
        manifest: {
          name: 'TECHNO SUTRA - Buddhist Trail Hiking',
          short_name: 'TECHNO SUTRA',
          description: 'Buddhist cyberpunk futuristic trail hiking app in Águas da Prata, SP',
          theme_color: '#000000',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          icons: [
            {
              src: '/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/icon-550x558.png',
              sizes: '550x558',
              type: 'image/png',
            },
            {
              src: '/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],

    // Enhanced server configuration
    server: {
        port: 3001,
        host: true, // Listen on all addresses
        strictPort: true,
        hmr: {
            port: 3001,
            host: 'localhost',
            clientPort: 3001,
        },
        cors: {
            origin: ['http://localhost:3001', 'http://127.0.0.1:3001'],
            credentials: true,
        },
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                changeOrigin: true,
                secure: false,
            },
        },
        headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'strict-origin-when-cross-origin',
            'Permissions-Policy': 'geolocation=(self), microphone=(), camera=()',
        },
    },

    // Enhanced build configuration
    build: {
      target: 'esnext',
      minify: 'terser',
      sourcemap: true,

      // Optimize chunk splitting
      rollupOptions: {
        output: {
          manualChunks: {
            // Vendor chunks
            'react-vendor': ['react', 'react-dom'],
            'router-vendor': ['react-router-dom'],
            'ui-vendor': ['framer-motion', 'lucide-react'],
            'map-vendor': ['@maptiler/sdk'],

            // Feature chunks
            'ar-features': ['./src/pages/ARPage.tsx', './src/components/EnhancedARExperience.tsx'],
            'map-features': ['./src/pages/Map.tsx', './src/pages/RouteCreatorPage.tsx'],
            'gallery-features': ['./src/pages/Gallery.tsx'],

            // Service chunks
            'services': [
              './src/services/performanceMonitoringService.ts',
              './src/services/securityService.ts',
              './src/services/advancedOptimizationService.ts',
              './src/services/accessibilityEnhancementService.ts',
            ],
          },
        },
      },

      // Terser options for better minification
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      },

      // Increase chunk size warning limit for map libraries
      chunkSizeWarningLimit: 1500,
    },

    // Path resolution
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },

    // CSS configuration
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          // additionalData: `@import "@/styles/variables.scss";`,
        },
      },
    },

    // Optimization configuration
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        'framer-motion',
        'lucide-react',
        '@maptiler/sdk',
        '@tanstack/react-query',
      ],
    },

    // Environment variables
    define: {
      'process.env': env,
      __APP_VERSION__: JSON.stringify(env.npm_package_version),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
    },

    // Enhanced preview configuration
    preview: {
      port: 3001,
      host: true,
      strictPort: true,
      cors: true,
    },

    // Worker configuration
    worker: {
      format: 'es',
    },

    // Experimental features
    experimental: {
      renderBuiltUrl(filename, { hostType }) {
        if (hostType === 'js') {
          return { js: `/${filename}` };
        } else {
          return { relative: true };
        }
      },
    },

    // Enhanced logging
    logLevel: 'info',
    clearScreen: false,

    // Performance monitoring
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
      target: 'esnext',
      platform: 'browser',
      format: 'esm',
    },
  };
});
