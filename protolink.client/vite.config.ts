import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

import dotenv from 'dotenv';
dotenv.config();

const baseFolder =
    env.APPDATA !== undefined && env.APPDATA !== ''
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;

const certificateName = "protolink.client";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

if (!fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, { recursive: true });
}

if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
    if (0 !== child_process.spawnSync('dotnet', [
        'dev-certs',
        'https',
        '--export-path',
        certFilePath,
        '--format',
        'Pem',
        '--no-password',
    ], { stdio: 'inherit', }).status) {
        throw new Error("Could not create certificate.");
    }
}

// Force local API during dev to avoid accidental external URLs from env
const target = 'http://localhost:5000';

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
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
        proxy: {
            '^/api': {
                target,
                changeOrigin: true,
                secure: false,
                configure: (proxy) => {
                    proxy.on('error', (err) => {
                        console.log(target);
                        console.log('proxy error', err);
                        //try { fs.appendFileSync('proxy.log', `[ERROR] target=${target} error=${err?.message || err}\n`); } catch { /* empty */ }
                    });
                    proxy.on('proxyReq', (_, req) => {
                        console.log(req.method, `${target}${req.url}`);
                        //try { fs.appendFileSync('proxy.log', `[REQ] ${req.method} ${target}${req.url}\n`); } catch { /* empty */ }
                    });
                    proxy.on('proxyRes', (proxyRes, req) => {
                        console.log(proxyRes.statusCode, req.url);
                        //try { fs.appendFileSync('proxy.log', `[RES] ${proxyRes.statusCode} ${req.url}\n`); } catch { /* empty */ }
                    });
                }
            },
            '^/scalar': {
                target,
                changeOrigin: true,
                secure: false,
                rewrite: path => path.replace(/^\//, '')
            },
        },
        port: parseInt(env.DEV_SERVER_PORT || '3000'),
    }
})

//const stringify = (obj: unknown) => {
//    let cache: unknown[]|null = [];
//    const str = JSON.stringify(obj, function (_, value) {
//        if (typeof value === "object" && value !== null) {
//            if (cache?.indexOf(value) !== -1) {
//                // Circular reference found, discard key
//                return;
//            }
//            // Store value in our collection
//            cache.push(value);
//        }
//        return value;
//    });
//    cache = null; // reset the cache
//    return str;
//}
