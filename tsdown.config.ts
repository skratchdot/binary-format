import { defineConfig } from 'tsdown';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  target: 'es2022',
  platform: 'neutral',
  // TS7 no longer exposes the classic compiler API; Oxc emits declarations instead.
  dts: { generator: 'oxc' },
  clean: true,
  sourcemap: true,
});
