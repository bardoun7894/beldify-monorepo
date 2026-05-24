import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Default to node for source-reading (Atlas compliance) tests
    // Component tests that need DOM should use @vitest-environment jsdom
    // inline annotation: // @vitest-environment jsdom
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    environmentMatchGlobs: [
      // React component tests that use render() need jsdom
      ['src/components/__tests__/**', 'jsdom'],
      ['src/contexts/__tests__/**', 'jsdom'],
      ['src/test-utils/__tests__/**', 'jsdom'],
      ['src/app/**/[id]/__tests__/**', 'jsdom'],
    ],
  },
});
