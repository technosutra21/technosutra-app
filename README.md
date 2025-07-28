# TECHNO SUTRA - Unified Repository

A unified repository combining the modern React/TypeScript application with the legacy HTML implementation for the TECHNO SUTRA AR experience.

## Project Structure

```
/
├── src/                    # React application source
├── public/                 # Static assets and CSV data
├── legacy/                 # Original HTML implementations
├── models/                 # 3D model files (.glb)
├── dist/                   # Build output
└── docs/                   # Documentation
```

## Features

- **Interactive Map**: Explore the sacred geography with MapTiler integration
- **GPS Navigation**: Real-time location tracking and turn-by-turn directions
- **Geocoding**: Address search and reverse geocoding with MapTiler
- **Route Planning**: Calculate routes using OpenRouteService (FREE)
- **Gallery**: Interactive 3D model gallery with dynamic detection
- **AR Experience**: Augmented reality viewer for 3D models
- **Route Creator**: Interactive route planning tool
- **Responsive Design**: Mobile-first responsive layout
- **PWA Support**: Installable web app with offline capabilities
- **Multi-language**: Portuguese and English support

## API Configuration

This project uses **FREE** APIs for mapping and routing:

### 1. MapTiler (FREE - 100,000 requests/month)
- Used for: Map tiles, geocoding, reverse geocoding
- Get your free API key: https://cloud.maptiler.com/account/keys/
- Set in `.env`: `VITE_MAPTILER_API_KEY=your_key_here`

### 2. OpenRouteService (FREE - 2000 requests/day)
- Used for: Route calculation, turn-by-turn directions, geocoding (fallback)
- Get your free API key: https://openrouteservice.org/dev/#/signup
- Set in `.env`: `VITE_OPENROUTESERVICE_API_KEY=your_key_here`
- API Documentation: https://api.openrouteservice.org

### Environment Setup
1. Copy `.env.example` to `.env`
2. Add your API keys to the `.env` file
3. Restart the development server

### Service Architecture
The application uses a **unified geo service** that automatically handles:
- **Primary service**: MapTiler (better geocoding quality)
- **Fallback service**: OpenRouteService (if MapTiler fails)
- **Automatic switching**: Seamless fallback between services
- **Route optimization**: Multiple routing profiles and preferences

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

## Technologies

- **Frontend**: React 18, TypeScript, Vite
- **UI**: shadcn/ui, Tailwind CSS, Framer Motion
- **3D**: model-viewer, Three.js
- **Maps**: MapTiler SDK
- **Deployment**: GitHub Pages

## Legacy Integration

This repository preserves the original HTML implementations in the `legacy/` directory while providing enhanced React components that integrate the working functionality from:

- `galeria.html` - 3D model gallery with detection logic
- `index.html` - AR viewer implementation
- `ar.html` - Alternative AR interface

## Data Sources

CSV data files are located in `/public/` and include:
- `chapters.csv` - Chapter information
- `characters.csv` - Character details
- `waypoint-coordinates.json` - Map waypoints

## Deployment

The application is configured for GitHub Pages deployment with the base path `/TECHNOSUTRA1/`.

### Manual Deployment

```bash
npm run deploy
```

### Automatic Deployment

The repository includes a GitHub Actions workflow that automatically deploys to GitHub Pages when changes are pushed to the main branch.

## Model Integration

The application includes dynamic model detection that checks for available 3D models in the `/public/` directory. Models should be named `modelo{id}.glb` where `{id}` is the chapter number (1-56).

### Available Models

The gallery automatically detects which models are available and displays them accordingly. Unavailable models are shown with a "Em Breve" (Coming Soon) status.

## Legacy Integration

The `legacy/` directory contains the original HTML implementations that served as the foundation for the React components:

- `galeria.html` - Original gallery with model detection logic
- `index.html` - Original AR viewer implementation
- `ar.html` - Alternative AR interface

These files are preserved for reference and contain the working JavaScript logic that was integrated into the React components.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is part of the TECHNO SUTRA educational initiative.
