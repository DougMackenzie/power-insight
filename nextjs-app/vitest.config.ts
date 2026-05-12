import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['lib/**/*.test.ts', 'lib/**/*.test.tsx', 'components/**/*.test.tsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: ['lib/calculations.ts', 'lib/calculations/**/*.ts', 'lib/validation/**/*.ts'],
      exclude: [
        'lib/generatedTariffData.ts',
        'lib/calculations_backup.js',
        '**/*.test.ts',
        '**/*.test.tsx',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
