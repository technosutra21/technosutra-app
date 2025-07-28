# Deployment Checklist

## Pre-Deployment Validation

### ✅ File Structure
- [ ] All source files copied from both projects
- [ ] Models in `/public/` directory (modelo1.glb, modelo2.glb, etc.)
- [ ] CSV data in `/public/summaries/` directory
- [ ] Legacy HTML files in `/legacy/` directory
- [ ] Static assets (images, icons) in `/public/`

### ✅ Configuration
- [ ] `vite.config.ts` configured with correct base path
- [ ] `package.json` updated with deployment scripts
- [ ] GitHub Actions workflow configured
- [ ] `.gitignore` excludes node_modules and build artifacts

### ✅ Component Integration
- [ ] Gallery page integrates galeria.html functionality
- [ ] AR page integrates index.html functionality
- [ ] Route Creator responsive layout fixed
- [ ] Model-viewer types properly defined

### ✅ Path Updates
- [ ] CSV data paths updated to `/summaries/`
- [ ] Model paths point to `/public/`
- [ ] Asset paths corrected for new structure

## Deployment Steps

### Manual Deployment
```bash
# Install dependencies (resolve conflicts if needed)
npm install --legacy-peer-deps

# Build the application
npm run build

# Deploy to GitHub Pages
npm run deploy
```

### Automatic Deployment
1. Push changes to main branch
2. GitHub Actions will automatically build and deploy
3. Check deployment status in Actions tab

## Post-Deployment Testing

### Functionality Tests
- [ ] Gallery loads and displays models correctly
- [ ] Model detection works (available vs unavailable)
- [ ] AR page loads models properly
- [ ] Route Creator is responsive on mobile
- [ ] CSV data loads correctly
- [ ] Model-viewer components render

### Performance Tests
- [ ] Page load times acceptable
- [ ] Model loading performance
- [ ] Mobile responsiveness
- [ ] Cross-browser compatibility

### Integration Tests
- [ ] Navigation between pages works
- [ ] Model viewer AR functionality
- [ ] Search and filtering in gallery
- [ ] Route creation workflow

## Troubleshooting

### Common Issues

1. **Model-viewer not loading**
   - Check if model-viewer script is loaded
   - Verify model file paths
   - Check browser console for errors

2. **CSV data not loading**
   - Verify file paths in useSutraData hook
   - Check CORS settings
   - Ensure files exist in public/summaries/

3. **Build failures**
   - Resolve dependency conflicts
   - Check TypeScript errors
   - Verify import paths

4. **GitHub Pages deployment issues**
   - Check base path configuration
   - Verify GitHub Actions permissions
   - Ensure dist folder is generated

### Debug Commands
```bash
# Check build output
npm run build

# Preview build locally
npm run preview

# Run development server
npm run dev

# Check for TypeScript errors
npx tsc --noEmit
```

## Success Criteria

The deployment is successful when:
- ✅ All pages load without errors
- ✅ Gallery shows available models with 3D viewers
- ✅ AR page loads models correctly
- ✅ Route Creator is fully responsive
- ✅ CSV data loads and displays properly
- ✅ Model detection works accurately
- ✅ Navigation between pages functions
- ✅ Mobile experience is optimized
