import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, '.', '');

  return {
    plugins: [react()],
    server: {
      host: true, // Listen on all addresses (0.0.0.0), essential for Termux/Mobile
      port: 5173,
      strictPort: false, // Allow fallback to next port if 5173 is busy
    },
    define: {
      // This allows 'process.env.API_KEY' to work in the client-side code
      'process.env.API_KEY': JSON.stringify(env.API_KEY)
    }
  };
});