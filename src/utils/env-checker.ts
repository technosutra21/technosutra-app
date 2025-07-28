/**
 * Environment Configuration Checker
 * Validates that required environment variables are properly configured
 */

interface EnvConfig {
  MAPTILER_API_KEY?: string;
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
  const apiKey = getMapTilerApiKey();

  const missingVars: string[] = [];
  const warnings: string[] = [];

  // Check MapTiler API Key
  if (!apiKey) {
    missingVars.push('MAPTILER_API_KEY');
    warnings.push('MapTiler API key is missing. Please set MAPTILER_API_KEY as a GitHub secret.');
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
  // Try to get from environment variables (GitHub secrets in production)
  const apiKey = import.meta.env.VITE_MAPTILER_API_KEY || 
                 import.meta.env.MAPTILER_API_KEY ||
                 process.env.MAPTILER_API_KEY;
  
  if (!apiKey || apiKey === 'test' || apiKey === 'your_api_key_here') {
    console.warn('⚠️ MapTiler API key not configured. Please set MAPTILER_API_KEY as a GitHub secret.');
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
