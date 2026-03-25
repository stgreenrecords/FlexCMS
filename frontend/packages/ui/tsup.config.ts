import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/themes/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  external: ['react'],
  banner: {
    js: "'use client';",
  },
});
