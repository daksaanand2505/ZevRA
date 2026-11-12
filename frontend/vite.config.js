import react from '@vitejs/plugin-react';
// loadEnv import removed; using process.env directly
import { defineConfig } from 'vite';

// Load environment variables for Vite. VITE_API_BASE_URL is used for production proxy target.
const env = loadEnv('', process.cwd());
const apiBase = env.VITE_API_BASE_URL || 'http://localhost:5000';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': {
        target: apiBase,
        changeOrigin: true
      },
      '/health': {
        target: apiBase,
        changeOrigin: true
      }
    }
  }
});
