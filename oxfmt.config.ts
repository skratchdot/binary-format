import { defineConfig } from 'oxfmt';

export default defineConfig({
  singleQuote: true,
  trailingComma: 'es5',
  sortPackageJson: { sortScripts: true },
  // Release Please owns changelog formatting; keep generated release PRs CI-clean.
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**', 'CHANGELOG.md'],
});
