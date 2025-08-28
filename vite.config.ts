import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import mkcert from 'vite-plugin-mkcert';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    mkcert(), // Automatically creates trusted local HTTPS certificates
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@core': resolve(__dirname, './src/core'),
      '@games': resolve(__dirname, './src/games'),
      '@ui': resolve(__dirname, './src/ui'),
      '@services': resolve(__dirname, './src/services')
    }
  },
  server: {
    port: 3000,
    host: true,
    cors: true,
    headers: {
      // Allow Discord to frame this app
      'X-Frame-Options': 'ALLOWALL',
      // Alternative more secure approach:
      // 'Content-Security-Policy': "frame-ancestors 'self' https://*.discord.com https://*.discordapp.com https://*.discordsays.com"
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2022',
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash].js`,
        chunkFileNames: `assets/[name]-[hash].js`,
        assetFileNames: `assets/[name]-[hash].[ext]`
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(Date.now()),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  }
});

