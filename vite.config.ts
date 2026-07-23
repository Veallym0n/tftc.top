import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const httpsKeyPath = path.resolve(__dirname, 'devfiles/key.pem');
    const httpsCertPath = path.resolve(__dirname, 'devfiles/cert.pem');
    const localHttps =
      fs.existsSync(httpsKeyPath) && fs.existsSync(httpsCertPath)
        ? {
            key: fs.readFileSync(httpsKeyPath),
            cert: fs.readFileSync(httpsCertPath),
          }
        : undefined;

    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        ...(localHttps ? { https: localHttps } : {}),
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      base: './',
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              react: ['react', 'react-dom'],
              vendor: ['h3-js', 'idb', 'zustand', 'coordtransform', '@ebay/nice-modal-react', 'use-long-press'],
            },
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
