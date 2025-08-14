// ===== 5. File src/config/env.ts - Type-safe environment =====
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_TIMEOUT: string;
  readonly VITE_APP_NAME: string;
  readonly VITE_ENVIRONMENT: 'development' | 'staging' | 'production';
  readonly VITE_ENABLE_DEVTOOLS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export const config = {
  // API Configuration
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'https://api.bkstarstudy.com',
  apiTimeout: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
  
  // App Configuration
  appName: import.meta.env.VITE_APP_NAME || 'BK Star Study',
  environment: import.meta.env.VITE_ENVIRONMENT || 'development',
  
  // Feature flags
  enableDevtools: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
  
  // Computed values
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  mode: import.meta.env.MODE,
} as const;

// Validation
export const validateConfig = () => {
  const requiredVars = ['VITE_API_BASE_URL'];
  const missing = requiredVars.filter(varName => !import.meta.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};