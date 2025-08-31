import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';
import type { InlineConfig } from 'vitest/node';

const includeFile = process.argv[4] as string | undefined;
const testBase: InlineConfig = {
  environment: 'jsdom',
  setupFiles: ['tests/setup.ts'],
  testTimeout: 5000,
  // Mock problematic Node.js modules
  server: {
    deps: {
      inline: ['opentimestamps'],
    },
  },
};
const coverageBase = {
  include: ['src/**/*.{ts,tsx}', 'server/**/*.ts'],
  exclude: [
    'src/app/layout.tsx',
    'src/utils/apiClient.ts',
    'src/**/*.module.css.d.ts',
    'src/utils/condition.ts',
    'src/utils/$path.ts',
    'src/**/frourio.{client,server}.ts',
  ],
};

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  resolve: {
    alias: {
      // Fix opentimestamps package.json main field issue
      opentimestamps: 'opentimestamps/index.js',
    },
  },
  define: {
    // Ensure Node.js globals are available in test environment
    global: 'globalThis',
  },
  test:
    includeFile === undefined
      ? {
          ...testBase,
          coverage: {
            ...coverageBase,
            thresholds: { statements: 5, branches: 5, functions: 5, lines: 5 },
          },
        }
      : { ...testBase, coverage: coverageBase, include: [includeFile] },
});
