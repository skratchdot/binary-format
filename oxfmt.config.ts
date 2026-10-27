import { defineConfig } from 'oxfmt';

export default defineConfig({
  singleQuote: true,
  trailingComma: 'es5',
  sortPackageJson: { sortScripts: true },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
});
