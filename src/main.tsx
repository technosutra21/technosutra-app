import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize PWA service for offline functionality
import './services/pwaService';

createRoot(document.getElementById("root")!).render(<App />);
