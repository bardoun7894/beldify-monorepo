import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Mirrors the `@/*` → `./src/*` path mapping in tsconfig.json
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // Default to node for source-reading (Atlas compliance) tests
    // Component tests that need DOM should use @vitest-environment jsdom
    // inline annotation: // @vitest-environment jsdom
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    setupFiles: ['./src/test-utils/vitest.setup.ts'],
    environmentMatchGlobs: [
      // React component tests that use render() need jsdom
      ['src/components/__tests__/**', 'jsdom'],
      ['src/contexts/__tests__/**', 'jsdom'],
      ['src/test-utils/__tests__/**', 'jsdom'],
      ['src/app/**/[id]/__tests__/**', 'jsdom'],
      // src/__tests__ uses JSX components; needs jsdom
      ['src/__tests__/**', 'jsdom'],
      // register page uses React/JSX
      ['src/app/register/__tests__/**', 'jsdom'],
      ['src/app/checkout/__tests__/**', 'jsdom'],
    ],
  },
});
