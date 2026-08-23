import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // Resolve workspace packages from source during tests, so the renderers can be
      // tested without building their dependencies first.
      '@flexcms/sdk': path.resolve(__dirname, '../sdk/src/index.ts'),
      '@flexcms/react': path.resolve(__dirname, '../react/src/index.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
  },
});
