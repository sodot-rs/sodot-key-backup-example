import { sveltekit } from '@sveltejs/kit/vite';
import 'dotenv/config';
import { readFileSync } from 'fs';
import fs from 'fs/promises';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

/**
 * This is a fix for development builds, as it appears Vite currently has an issue with WASM modules.
 * This problem doesn't happen in production builds.
 * For more info: https://stackoverflow.com/questions/78095780/web-assembly-wasm-errors-in-a-vite-vue-app-using-realm-web-sdk
 */
async function wasmMiddleware(): Promise<Plugin> {
  return {
    name: 'wasm-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.endsWith('.wasm')) {
          // Directly point to the .wasm file within the realm/dist directory
          const wasmPath = path.join(
            __dirname,
            'node_modules/@sodot/sodot-web-sdk-demo/dist/generated',
            path.basename(req.url)
          );
          try {
            const wasmFile = await fs.readFile(wasmPath);
            res.setHeader('Content-Type', 'application/wasm');
            res.end(wasmFile);
          } catch (error) {
            console.error('Failed to load WASM file:', error);
            next();
          }
          return;
        }
        next();
      });
    },
  };
}

// Set HTTPS settings if both the keyPath and chainPath are provided.
const keyPath = process.env.KEY_PATH ? readFileSync(process.env.KEY_PATH) : '';
const chainPath = process.env.CHAIN_PATH ? readFileSync(process.env.CHAIN_PATH) : '';
const https = keyPath && chainPath ? { key: keyPath, cert: chainPath } : undefined;

export default defineConfig({
  plugins: [sveltekit(), wasmMiddleware()],
  server: {
    https,
    origin: process.env.ORIGIN,
    proxy: {},
  },
});
