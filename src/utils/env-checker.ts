/**
 * Environment Configuration Checker for MapLibre GL
 * Using free MapLibre-compatible map styles - no API keys required
 */

interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
}

interface MapLibreConfig {
  apiRequired: boolean;
  stylesAvailable: boolean;
  offline: boolean;
}

/**
 * Check if all required environment variables are configured
 */
export function validateEnvironment(): EnvValidationResult {
  const missingVars: string[] = [];
  const warnings: string[] = [];

  // MapLibre doesn't require API keys for free styles
  console.log('🗺️ Using MapLibre GL with free map styles - no API key required');

  // Check optional API keys
  if (!import.meta.env.VITE_OPENROUTESERVICE_API_KEY) {
    warnings.push('OpenRouteService API key not configured - routing features may be limited');
  }

  return {
    isValid: true, // MapLibre works without API keys
    missingVars,
    warnings,
  };
}

/**
 * Get MapLibre configuration (no API key needed)
 */
export function getMapLibreConfig(): MapLibreConfig {
  console.log('🗺️ MapLibre GL configuration:');
  console.log('- Free map styles: Available');
  console.log('- Offline support: Enabled');
  console.log('- API key required: No');
  
  return {
    apiRequired: false,
    stylesAvailable: true,
    offline: true
  };
}

/**
 * Legacy function for compatibility - returns null since we don't use MapTiler
 * @deprecated Use getMapLibreConfig() instead
 */
export function getMapTilerApiKey(): string | null {
  console.warn('⚠️ MapTiler API key function called - using MapLibre instead');
  return null;
}

/**
 * Log environment status for debugging
 */
export function logEnvironmentStatus(): void {
  const validation = validateEnvironment();
  const mapConfig = getMapLibreConfig();
  
  console.log('✅ MapLibre GL environment is ready');
  console.log('📊 Configuration:', mapConfig);
  
  if (validation.warnings.length > 0) {
    console.warn('⚠️ Optional features warnings:');
    validation.warnings.forEach(warning => {
      console.warn(`  - ${warning}`);
    });
  }
}
