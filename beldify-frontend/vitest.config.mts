import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Mirrors the `@/*` → `./src/*` path mapping in tsconfig.json
      '@': path.resolve(new URL('.', import.meta.url).pathname, './src'),
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
      // seller page component tests
      ['src/app/seller/**/__tests__/**', 'jsdom'],
      // buyer-AI component tests
      ['src/components/buyer-ai/__tests__/**', 'jsdom'],
      // seller component tests
      ['src/components/seller/__tests__/**', 'jsdom'],
      // assistant widget tests
      ['src/components/assistant/__tests__/**', 'jsdom'],
    ],
  },
});
