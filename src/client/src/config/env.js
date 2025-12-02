// src/config/env.js
export const env = {
  appName: import.meta.env.VITE_APP_NAME,
  appDescription: import.meta.env.VITE_APP_DESCRIPTION,
  appVersion: import.meta.env.VITE_APP_VERSION,
  serverUrl: import.meta.env.VITE_SERVER_URL,
  isDevelopment: import.meta.env.MODE === 'development',
  isProduction: import.meta.env.MODE === 'production'
};

export default env;