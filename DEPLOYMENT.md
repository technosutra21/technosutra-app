# TECHNO SUTRA Deployment Guide

This guide explains how to deploy TECHNO SUTRA to different hosting environments with automatic path resolution.

## 🌐 Supported Environments

### 1. Custom Domain (technosutra.bhumisparshaschool.org)
- **Base Path**: `/`
- **Build Command**: `npm run build:custom-domain`
- **Detection**: Automatic based on hostname

### 2. GitHub Pages (technosutra21.github.io/technosutra-app)
- **Base Path**: `/technosutra-app/`
- **Build Command**: `npm run build:github`
- **Detection**: Automatic based on hostname and environment variables

## 🔧 How It Works

The app uses a dynamic path resolver (`src/utils/pathResolver.ts`) that:

1. **Detects the hosting environment** automatically
2. **Adjusts file paths** based on the environment
3. **Updates meta tags** for SEO and social sharing
4. **Configures router base** for React Router

### Path Resolution Examples

```typescript
// Development or Custom Domain
resolvePath('characters.csv') → '/characters.csv'
resolveModel(1) → '/modelo1.glb'

// GitHub Pages
resolvePath('characters.csv') → '/technosutra-app/characters.csv'
resolveModel(1) → '/technosutra-app/modelo1.glb'
```

## 🚀 Deployment Commands

### For Custom Domain (technosutra.bhumisparshaschool.org)
```bash
npm run build:custom-domain
```

### For GitHub Pages (technosutra21.github.io/technosutra-app)
```bash
npm run build:github
```

### Manual Environment Control
```bash
# Force GitHub Pages build
GITHUB_PAGES=true npm run build

# Force custom domain build (default)
npm run build
```

## 📁 File Structure After Build

```
dist/
├── index.html          # Main app entry
├── assets/             # JS/CSS bundles
├── *.glb              # 3D model files
├── *.csv              # Data files
├── manifest.json      # PWA manifest
└── sw.js             # Service worker
```

## 🔄 Automatic Features

### Environment Detection
- ✅ **GitHub Pages**: Detected by `.github.io` hostname
- ✅ **Custom Domain**: Detected by exact hostname match
- ✅ **Development**: Detected by `localhost` or local IPs

### Path Resolution
- ✅ **Asset files** (models, images, data)
- ✅ **Route navigation** (React Router)
- ✅ **Service Worker** caching
- ✅ **API calls** and fetches

### SEO & Meta Tags
- ✅ **Canonical URLs** updated automatically
- ✅ **Open Graph** URLs resolved
- ✅ **PWA manifest** paths corrected

## 🛠️ Configuration Files

### Vite Config (`vite.config.ts`)
- Dynamic base path based on environment
- Conditional build settings
- PWA configuration

### Path Resolver (`src/utils/pathResolver.ts`)
- Environment detection logic
- Path resolution functions
- Meta tag updates

### Build Scripts (`scripts/build-github-pages.js`)
- Environment variable setup
- Build process automation
- Deployment instructions

## 🧪 Testing

### Local Development
```bash
npm run dev
# Tests: localhost environment detection
```

### Production Preview
```bash
npm run build:custom-domain
npm run preview
# Tests: custom domain build
```

### GitHub Pages Simulation
```bash
GITHUB_PAGES=true npm run build
npm run preview
# Tests: GitHub Pages paths
```

## 📊 Environment Status

The app automatically logs environment information:

```
🌐 Environment Detection: {
  host: "technosutra.bhumisparshaschool.org",
  isGitHubPages: false,
  isCustomDomain: true,
  basePath: "/",
  fullURL: "https://technosutra.bhumisparshaschool.org/"
}
```

## 🔗 URLs

| Environment | URL | Status |
|-------------|-----|--------|
| Development | `http://localhost:3001` | ✅ Active |
| GitHub Pages | `https://technosutra21.github.io/technosutra-app/` | ✅ Redirects |
| Custom Domain | `https://technosutra.bhumisparshaschool.org/` | ✅ Primary |

## 🎯 Benefits

1. **Single Codebase**: No need for environment-specific builds
2. **Automatic Detection**: Works seamlessly across environments
3. **Zero Configuration**: Developers don't need to worry about paths
4. **SEO Friendly**: Proper meta tags for all environments
5. **PWA Compatible**: Service worker works in all environments

---

**Note**: The app automatically detects its environment and adjusts all paths accordingly. No manual configuration needed! 🚀
