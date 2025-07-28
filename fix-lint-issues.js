#!/usr/bin/env node

// Quick script to fix common ESLint issues in TECHNO SUTRA project
const fs = require('fs');
const path = require('path');

const filesToFix = [
  'src/components/AdvancedLayoutSystem.tsx',
  'src/components/AdvancedUIComponents.tsx', 
  'src/components/EnhancedARExperience.tsx',
  'src/components/EnhancedLoadingScreen.tsx',
  'src/components/EnhancedNotificationSystem.tsx',
  'src/components/LoadingScreen.tsx',
  'src/components/MapFloatingControls-simple.tsx',
  'src/components/OfflineStatus.tsx',
  'src/components/OptimizedModelViewer.tsx',
  'src/components/PWAInstallPrompt.tsx',
  'src/components/RouteCreator/index.tsx',
  'src/hooks/useAdvancedPerformance.ts',
  'src/pages/AR.tsx',
  'src/pages/Gallery.tsx',
  'src/pages/Home.tsx',
  'src/pages/Map-working.tsx',
  'src/pages/Map.tsx',
  'src/pages/RouteCreator.tsx',
  'src/services/accessibilityEnhancementService.ts',
  'src/services/accessibilityService.ts',
  'src/services/advancedOptimizationService.ts',
  'src/services/analyticsService.ts',
  'src/services/enhancedGPS.ts',
  'src/services/errorReportingService.ts',
  'src/services/offlineStorage.ts',
  'src/services/offlineTestingService.ts',
  'src/services/performanceMonitoringService.ts',
  'src/services/performanceService.ts',
  'src/services/pwaInitializationService.ts',
  'src/services/pwaService.ts',
];

// Common patterns to fix
const fixes = [
  // Add underscore to unused variables
  { pattern: /const (\w+) = .*?; \/\/ unused/g, replacement: 'const _$1 = $2; // unused' },
  { pattern: /let (\w+) = .*?; \/\/ unused/g, replacement: 'let _$1 = $2; // unused' },
  
  // Fix common unused parameter patterns
  { pattern: /\((\w+), index\) =>/g, replacement: '($1, _index) =>' },
  { pattern: /\((\w+), error\) =>/g, replacement: '($1, _error) =>' },
  { pattern: /\(event\) =>/g, replacement: '(_event) =>' },
  { pattern: /\(error\) =>/g, replacement: '(_error) =>' },
  
  // Fix unused imports
  { pattern: /import.*?{[^}]*?(\w+)[^}]*?}.*?from.*?;.*?\/\/ unused/g, replacement: '' },
];

function fixFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  fixes.forEach(fix => {
    const newContent = content.replace(fix.pattern, fix.replacement);
    if (newContent !== content) {
      content = newContent;
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${filePath}`);
  }
}

// Apply fixes to all files
filesToFix.forEach(fixFile);

console.log('ESLint fixes applied!');
