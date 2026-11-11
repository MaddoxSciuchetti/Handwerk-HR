import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { visualizer } from 'rollup-plugin-visualizer';
import { defineConfig } from 'vite';
import mdx from '@mdx-js/rollup';
import remarkFrontmatter from 'remark-frontmatter';
import remarkMdxFrontmatter from 'remark-mdx-frontmatter';
import remarkGfm from 'remark-gfm';
import { remarkHeading } from 'fumadocs-core/mdx-plugins/remark-heading';
import { rehypeToc } from 'fumadocs-core/mdx-plugins/rehype-toc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const analyze = process.env.ANALYZE === '1';
const documentationMdx = mdx({
  remarkPlugins: [
    remarkFrontmatter,
    remarkMdxFrontmatter,
    remarkGfm,
    remarkHeading,
  ],
  rehypePlugins: [rehypeToc],
});

const coverageFullTree = process.env.VITEST_COVERAGE_FULL_TREE === '1';

const coverageSharedExclude = [
  '**/*.d.ts',
  '**/routeTree.gen.ts',
  'src/**/*.{test,spec}.{ts,tsx}',
];

export default defineConfig({
  plugins: [
    {
      ...documentationMdx,
      transform(code, id) {
        // MDX's plugin strips query strings. Preserve Vite's raw imports for
        // browser search and Markdown exports instead of compiling them again.
        if (id.split('?')[1]?.split('&').includes('raw')) return null;
        return documentationMdx.transform.call(this, code, id);
      },
    },
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
    tailwindcss(),
    analyze
      ? visualizer({
          filename: 'dist/stats.html',
          gzipSize: true,
          brotliSize: true,
          open: false,
          template: 'treemap',
        })
      : null,
  ].filter(Boolean),
  optimizeDeps: {
    include: [
      '@shadcn/react/message-scroller',
      '@base-ui/react/merge-props',
      '@base-ui/react/use-render',
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, '../shared'),
      'test-unit': path.resolve(__dirname, './test-unit'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Exact package paths only — avoid matching @radix-ui/react-* etc.
          if (
            /[/\\]node_modules[/\\](?:react-dom|react|scheduler)[/\\]/.test(id)
          ) {
            return 'react-vendor';
          }
          if (/[/\\]node_modules[/\\]@tanstack[/\\]/.test(id)) {
            return 'tanstack-vendor';
          }
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['node_modules/**', 'dist/**', 'coverage/**'],
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
