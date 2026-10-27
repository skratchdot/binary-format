import { defineConfig } from 'oxlint';

export default defineConfig({
  plugins: ['typescript', 'unicorn', 'oxc'],
  categories: { correctness: 'error' },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
});
