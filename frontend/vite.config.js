
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

// Load environment variables for local development and deployment.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBase = env.VITE_API_BASE_URL || 'http://localhost:5000';

  return {
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
  };
});
