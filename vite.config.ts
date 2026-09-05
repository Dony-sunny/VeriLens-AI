import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

import type { Plugin } from 'vite'

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-plugin',
    configureServer(server) {
      const env = loadEnv(server.config.mode || 'development', process.cwd(), '');
      Object.assign(process.env, env);

      server.middlewares.use('/api/analyze', async (req, res) => {
        try {
          const mod = await server.ssrLoadModule('./api/analyze.ts');
          await mod.default(req, res);
        } catch (err) {
          console.error('[VeriLens Dev API Error]:', err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(
              JSON.stringify({
                error: err instanceof Error ? err.message : 'Dev API Error',
                code: 'DEV_API_ERROR',
              })
            );
          }
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    apiDevPlugin(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/modules/**', 'src/utils/**'],
      exclude: ['src/tests/**', 'node_modules/**'],
    },
  },
})
