import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, type Plugin } from 'vite';
import fs from 'fs/promises';
import path from 'path';

// NOTE: https://stackoverflow.com/questions/78095780/web-assembly-wasm-errors-in-a-vite-vue-app-using-realm-web-sdk
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

export default defineConfig({
  plugins: [sveltekit(), wasmMiddleware()],
});
