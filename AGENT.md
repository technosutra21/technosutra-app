# AGENT.md - TECHNO SUTRA Development Guide

## Commands
- **Build**: `npm run build` | `npm run build:dev` (development mode) | `npm run build:analyze` (bundle analysis)
- **Lint**: `npm run lint` (check) | `npm run lint:fix` (auto-fix)
- **Type Check**: `npm run type-check` (TypeScript validation without emit)
- **Test**: `npm run test` (vitest) | `npm run test:ui` (interactive UI) | `npm run test:coverage` | `npm run test:e2e` (playwright)
- **Dev Server**: `npm run dev` (port 3001 with HMR) | `npm start` (alias)
- **PWA Testing**: `npm run pwa:test` | `npm run lighthouse` (performance audit)

## Architecture
- **Frontend**: React 18 + TypeScript + Vite PWA app focused on Buddhist cyberpunk trail hiking
- **Core Features**: AR experiences, interactive maps (MapTiler SDK), 3D models, route creation
- **Structure**: `/src` with pages/, components/, services/, hooks/, lib/, utils/, types/, contexts/
- **Key Services**: Analytics, geolocation, performance monitoring, accessibility enhancement
- **Build**: Optimized chunks (react-vendor, map-vendor, ar-features), Terser minification, PWA caching

## Code Style
- **Imports**: Use `@/` alias for src paths, prefer named imports
- **UI Components**: Radix UI + TailwindCSS with shadcn/ui pattern, toast via useToast hook
- **Naming**: PascalCase components, camelCase functions/variables, descriptive names
- **Types**: Relaxed TypeScript config (noImplicitAny: false), define in types/ directory
- **Error Handling**: Use logger service, toast notifications for user feedback
- **Performance**: Lazy loading, code splitting, optimized dependencies, PWA caching strategies
