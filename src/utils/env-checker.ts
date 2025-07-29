/**
 * Environment Configuration Checker
 * Validates that required environment variables are properly configured
 */

interface _EnvConfig {
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
  // Debug: Log what we can see in the environment
  console.log('🔍 Environment debugging:');
  console.log('- VITE_MAPTILER_API_KEY:', import.meta.env.VITE_MAPTILER_API_KEY ? '[SET]' : '[NOT SET]');
  console.log('- MAPTILER_API_KEY:', import.meta.env.MAPTILER_API_KEY ? '[SET]' : '[NOT SET]');
  console.log('- import.meta.env keys:', Object.keys(import.meta.env));
  
  // Try to get from environment variables
  const apiKey = import.meta.env.VITE_MAPTILER_API_KEY || 
                 import.meta.env.MAPTILER_API_KEY;
  
  if (!apiKey || apiKey === 'test' || apiKey === 'your_api_key_here' || apiKey === 'undefined') {
    console.warn('⚠️ MapTiler API key not configured.');
    console.warn('📝 To fix this:');
    console.warn('   1. Create a .env.local file in the project root');
    console.warn('   2. Add: VITE_MAPTILER_API_KEY=your_actual_api_key');
    console.warn('   3. Restart the development server');
    return null;
  }
  
  console.log('✅ MapTiler API key loaded successfully');
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
