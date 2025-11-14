import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = 'http://localhost:5000';
const DEV_PORT = 3000;

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    build: {
        outDir: 'build',
        emptyOutDir: true,
        rollupOptions: {
            external: ['aspnet_client']
        }
    },
    server: {
        port: DEV_PORT,
        proxy: {
            '/api': {
                target: API_TARGET,
                changeOrigin: true,
                secure: false
            },
            '/scalar': {
                target: API_TARGET,
                changeOrigin: true,
                secure: false,
                rewrite: path => path.replace(/^\//, '')
            }
        }
    }
});
