import { defineConfig, mergeConfig, type UserConfig } from 'vitest/config';

/**
 * Shared Vitest base configuration for motif-ts packages.
 * Each package can extend this with package-specific settings.
 */
export const baseVitestConfig = defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.ts', 'tests/**/*.js'],
    exclude: ['node_modules/**', 'dist/**'],
    passWithNoTests: true,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['tests/**'],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 80,
        branches: 70,
      },
    },
  },
});

/**
 * Helper to merge custom config with base config.
 */
export const createVitestConfig = (customConfig: UserConfig = {}) =>
  mergeConfig(baseVitestConfig, customConfig);
