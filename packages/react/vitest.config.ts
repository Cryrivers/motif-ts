import { createVitestConfig } from '../../vitest.config.base';

export default createVitestConfig({
  test: {
    // React package only includes .ts files (no .js)
    include: ['tests/**/*.ts'],
  },
});
