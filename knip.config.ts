import type { KnipConfig } from 'knip'

const config: KnipConfig = {
  entry: [
    'src/app/**/*.{ts,tsx}',
    'src/components/**/*.{ts,tsx}',
    'src/lib/**/*.{ts,tsx}',
    'src/hooks/**/*.{ts,tsx}',
    'src/types/**/*.{ts,tsx}',
    'avarice-protocol/**/*.{ts,tsx}',
    'scripts/**/*.{ts,tsx}',
    'tests/**/*.{ts,tsx}',
    'config/**/*.{ts,tsx}',
    'middleware.ts',
    'next.config.js',
    'tailwind.config.ts'
  ],
  project: [
    'src/**/*.{ts,tsx}',
    'avarice-protocol/**/*.{ts,tsx}',
    'scripts/**/*.{ts,tsx}',
    'tests/**/*.{ts,tsx}',
    'config/**/*.{ts,tsx}',
    '*.{ts,tsx,js,jsx}',
    '!**/.backups/**',
    '!**/backup-*/**',
    '!**/backups/**',
    '!**/*.backup.*',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/dist/**',
    '!**/coverage/**',
    '!**/.git/**',
    '!**/.vercel/**'
  ],
  ignore: [
    '**/.backups/**',
    '**/backup-*/**',
    '**/backups/**',
    '**/*.backup.*',
    '**/node_modules/**',
    '**/.next/**',
    '**/dist/**',
    '**/coverage/**',
    '**/.git/**',
    '**/.vercel/**',
    // Specific backup directories we know exist
    '.backups/**',
    'backup-*/**',
    'backups/**'
  ],
  ignoreBinaries: [
    'depcheck',
    'lhci', 
    'cspell',
    'tail'
  ],
  ignoreDependencies: [
    '@radix-ui/react-collapsible',
    '@radix-ui/react-separator',
    '@types/dompurify',
    '@vitest/coverage-v8',
    'dotenv'
  ]
}

export default config
