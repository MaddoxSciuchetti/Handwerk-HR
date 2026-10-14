import { readFileSync } from 'node:fs';
import { defineConfig, mergeConfig } from 'vite';
import base from './vite.config.js';

const payload = readFileSync('/tmp/fragebogen-preview.json');

export default mergeConfig(
  base,
  defineConfig({
    plugins: [
      {
        name: 'fragebogen-preview',
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if ((req.url ?? '').startsWith('/api/fragebogen/')) {
              res.setHeader('Content-Type', 'application/json');
              res.end(payload);
              return;
            }
            next();
          });
        },
      },
    ],
  })
);
