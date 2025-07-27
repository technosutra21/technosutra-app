# Techno Sutra - Unified Repository

A unified repository combining the modern React/TypeScript application with the legacy HTML implementation for the Techno Sutra AR experience.

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

- **Gallery**: Interactive 3D model gallery with dynamic detection
- **AR Experience**: Augmented reality viewer for 3D models
- **Route Creator**: Interactive route planning tool
- **Map Integration**: MapTiler-based mapping functionality
- **Responsive Design**: Mobile-first responsive layout

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

This project is part of the Techno Sutra educational initiative.
