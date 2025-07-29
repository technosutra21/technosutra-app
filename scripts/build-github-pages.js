#!/usr/bin/env node

// Build script for GitHub Pages deployment
// Sets environment variables for proper path resolution

import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Building TECHNO SUTRA for GitHub Pages...');

// Set environment variables for GitHub Pages build
process.env.GITHUB_PAGES = 'true';
process.env.DEPLOY_TARGET = 'github-pages';

// Run the build command
exec('npm run build', { 
  cwd: path.resolve(__dirname, '..'),
  env: { ...process.env }
}, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
  
  if (stderr) {
    console.warn('⚠️ Build warnings:', stderr);
  }
  
  console.log('✅ Build output:', stdout);
  console.log('✅ GitHub Pages build completed successfully!');
  
  console.log('\n📁 Deploy the contents of the "dist" folder to GitHub Pages.');
  console.log('🌐 The app will be available at: https://technosutra21.github.io/technosutra-app/');
  console.log('🔄 Which redirects to: https://technosutra.bhumisparshaschool.org/');
});
