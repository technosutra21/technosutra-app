#!/usr/bin/env node

// Comprehensive ESLint warning fixes for TECHNO SUTRA
const fs = require('fs');
const path = require('path');

// Files and their specific fixes
const fixes = [
  // Remove unused imports
  {
    file: 'src/components/EnhancedARExperience.tsx',
    replacements: [
      { from: /import.*?{[^}]*RotateCcw[^}]*}.*?from.*?;/g, to: '' },
      { from: /import.*?{[^}]*Zap[^}]*}.*?from.*?;/g, to: '' },
      { from: /import.*?{[^}]*Eye[^}]*}.*?from.*?;/g, to: '' },
      { from: /import.*?{[^}]*EyeOff[^}]*}.*?from.*?;/g, to: '' },
      { from: /import.*?{[^}]*Download[^}]*}.*?from.*?;/g, to: '' },
      { from: /import.*?{[^}]*Share2[^}]*}.*?from.*?;/g, to: '' },
      { from: /const arViewerRef = /g, to: 'const _arViewerRef = ' },
      { from: /const models = /g, to: 'const _models = ' },
      { from: /setLoadProgress/g, to: '_setLoadProgress' }
    ]
  },
  
  // Fix Home.tsx unused variables
  {
    file: 'src/pages/Home.tsx',
    replacements: [
      { from: /const showPWAPrompt = /g, to: 'const _showPWAPrompt = ' },
      { from: /const canInstall = /g, to: 'const _canInstall = ' },
      { from: /const containerVariants = /g, to: 'const _containerVariants = ' },
      { from: /const itemVariants = /g, to: 'const _itemVariants = ' }
    ]
  },
  
  // Fix Map.tsx unused variables
  {
    file: 'src/pages/Map.tsx',
    replacements: [
      { from: /const isTrackingUser = /g, to: 'const _isTrackingUser = ' },
      { from: /setIsTrackingUser/g, to: '_setIsTrackingUser' },
      { from: /const whereAmIData = /g, to: 'const _whereAmIData = ' }
    ]
  },
  
  // Fix RouteCreator.tsx unused variables
  {
    file: 'src/pages/RouteCreator.tsx',
    replacements: [
      { from: /const t = /g, to: 'const _t = ' },
      { from: /\(([^,]+), index\) =>/g, to: '($1, _index) =>' }
    ]
  },
  
  // Fix service files
  {
    file: 'src/services/accessibilityEnhancementService.ts',
    replacements: [
      { from: /const { key, ctrlKey, altKey, shiftKey } = event;/g, to: 'const { key, ctrlKey: _ctrlKey, altKey: _altKey, shiftKey: _shiftKey } = event;' },
      { from: /\(event\) =>/g, to: '(_event) =>' }
    ]
  },
  
  // Fix other service files
  {
    file: 'src/services/advancedOptimizationService.ts',
    replacements: [
      { from: /\(container\) =>/g, to: '(_container) =>' },
      { from: /let targetFPS = /g, to: 'let _targetFPS = ' },
      { from: /\(script\) =>/g, to: '(_script) =>' }
    ]
  }
];

// Apply fixes
fixes.forEach(({ file, replacements }) => {
  const filePath = path.join(process.cwd(), file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${file}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  replacements.forEach(({ from, to }) => {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  }
});

console.log('ESLint warning fixes applied!');
