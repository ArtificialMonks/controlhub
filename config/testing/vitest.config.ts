import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['../../src/test/setup.ts'],
    globals: true,
    css: true,
    // AGGRESSIVE BACKUP EXCLUSION - Use both exclude and include
    exclude: [
      // ABSOLUTE BACKUP EXCLUSION - CRITICAL
      '**/.backups/**',
      '**/backup-*/**',
      '**/backups/**',
      '**/*.backup.*',
      '.backups/**',
      'backup-*/**',
      'backups/**',
      // Standard exclusions
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.git/**',
      '**/.next/**',
      '**/.vercel/**',
      '**/cypress/**',
      '**/.{idea,git,cache,output,temp}/**',
      '**/{karma,rollup,webpack,vite,vitest,jest,ava,babel,nyc,cypress,tsup,build,eslint,prettier}.config.*'
    ],
    // ONLY include legitimate test files - NO backup patterns allowed
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'avarice-protocol/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'tests/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'scripts/',
        '.next/',
        'docs/',
        'tests/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../../src'),
      '@/components': path.resolve(__dirname, '../../src/components'),
      '@/lib': path.resolve(__dirname, '../../src/lib'),
      '@/app': path.resolve(__dirname, '../../src/app'),
      '@/hooks': path.resolve(__dirname, '../../src/hooks'),
      '@/types': path.resolve(__dirname, '../../src/lib/types'),
      '@/test': path.resolve(__dirname, '../../src/test'),
    },
  },
})
