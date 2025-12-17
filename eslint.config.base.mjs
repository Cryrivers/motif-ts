import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

/**
 * Shared ESLint configuration for motif-ts packages.
 * Each package imports this and passes its own directory for tsconfigRootDir.
 *
 * @param dirname - The directory of the package (typically import.meta.dirname)
 * @returns ESLint configuration object
 */
export const createBaseEslintConfig = (dirname) =>
  defineConfig({
    name: 'motif-ts-base',
    files: ['**/*.ts'],
    plugins: {
      '@typescript-eslint': tseslint.plugin,
    },
    languageOptions: {
      parser: tseslint.parser,
      ecmaVersion: 2018,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: dirname,
      },
      globals: {
        process: 'readonly',
      },
    },
    rules: {
      curly: ['error', 'all'],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        {
          'ts-check': false,
          'ts-expect-error': false,
          'ts-ignore': true,
          'ts-nocheck': true,
        },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': 'warn',
      '@typescript-eslint/no-inferrable-types': 'error',
      '@typescript-eslint/no-unnecessary-type-parameters': 'error',
      '@typescript-eslint/no-unnecessary-type-constraint': 'error',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    },
  });
