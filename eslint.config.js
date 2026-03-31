import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist', '.claude', '.vite', 'node_modules']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Resetting modal state on open (useEffect + setState) is valid — downgrade to warn
      'react-hooks/set-state-in-effect': 'warn',
      // React Compiler memoization hints — not bugs, just optimization suggestions
      'react-hooks/preserve-manual-memoization': 'warn',
      // Non-component exports in component files affect HMR but aren't runtime bugs
      'react-refresh/only-export-components': 'warn',
      // any types — warn rather than error (some are in mock data / context)
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]);
