import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Vitest defaults to “hit files only”; set `VITEST_COVERAGE_FULL_TREE=1` for entire `src` (unchanged modules = 0%). */
const coverageFullTree = process.env.VITEST_COVERAGE_FULL_TREE === '1';

const coverageSharedExclude = [
  '**/*.d.ts',
  '**/routeTree.gen.ts',
  'src/**/*.{test,spec}.{ts,tsx}',
];

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'test-unit': path.resolve(__dirname, './test-unit'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'test-e2e/**',
      '**/playwright-report/**',
    ],
    coverage: coverageFullTree
      ? {
          provider: 'v8',
          reportsDirectory: './coverage/full',
          include: ['src/**/*.{ts,tsx}'],
          exclude: coverageSharedExclude,
        }
      : {
          provider: 'v8',
          reportsDirectory: './coverage/imported',
          exclude: coverageSharedExclude,
        },
  },
});
