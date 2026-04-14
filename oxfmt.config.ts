import { defineConfig } from 'oxfmt';

export default defineConfig({
  ignorePatterns: ['dist/**', '.yarn/**'],
  jsxSingleQuote: true,
  printWidth: 120,
  singleQuote: true,
});
