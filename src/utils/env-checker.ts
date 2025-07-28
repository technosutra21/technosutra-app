/**
 * Environment Configuration Checker
 * Validates that required environment variables are properly configured
 */

interface EnvConfig {
  VITE_MAPTILER_API_KEY?: string;
}

interface EnvValidationResult {
  isValid: boolean;
  missingVars: string[];
  warnings: string[];
}

/**
 * Check if all required environment variables are configured
 */
export function validateEnvironment(): EnvValidationResult {
  const env: EnvConfig = {
    VITE_MAPTILER_API_KEY: import.meta.env.VITE_MAPTILER_API_KEY,
  };

  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Check MapTiler API Key
  if (!env.VITE_MAPTILER_API_KEY || env.VITE_MAPTILER_API_KEY === 'test') {
    missingVars.push('VITE_MAPTILER_API_KEY');
    warnings.push('MapTiler API key is missing or set to test value. Map features will be limited.');
  }

  return {
    isValid: missingVars.length === 0,
    missingVars,
    warnings,
  };
}

/**
 * Get the MapTiler API key with fallback handling
 */
export function getMapTilerApiKey(): string | null {
  const apiKey = import.meta.env.VITE_MAPTILER_API_KEY;
  
  if (!apiKey || apiKey === 'test') {
    console.warn('⚠️ MapTiler API key not configured. Please set VITE_MAPTILER_API_KEY environment variable.');
    return null;
  }
  
  return apiKey;
}

/**
 * Log environment status for debugging
 */
export function logEnvironmentStatus(): void {
  const validation = validateEnvironment();
  
  if (validation.isValid) {
    console.log('✅ Environment configuration is valid');
  } else {
    console.warn('⚠️ Environment configuration issues detected:');
    validation.missingVars.forEach(varName => {
      console.warn(`  - Missing: ${varName}`);
    });
    validation.warnings.forEach(warning => {
      console.warn(`  - ${warning}`);
    });
  }
}
