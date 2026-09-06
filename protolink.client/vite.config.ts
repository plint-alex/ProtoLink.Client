import { readFileSync } from 'node:fs';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API_TARGET = 'http://localhost:5000';
const DEV_PORT = 3000;

const pkg = JSON.parse(
    readFileSync(fileURLToPath(new URL('./package.json', import.meta.url)), 'utf8')
) as { version: string };

export default defineConfig({
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version ?? '0.0.0')
    },
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
