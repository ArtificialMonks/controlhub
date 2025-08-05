#!/usr/bin/env node

export interface ImportExportConfig {
  /** Analysis configuration */
  analysis: {
    /** File patterns to include */
    includePatterns: string[];
    /** File patterns to exclude */
    excludePatterns: string[];
    /** Framework-essential imports to always preserve */
    frameworkEssentials: string[];
    /** Directory paths that should be analyzed */
    includePaths: string[];
    /** Directory paths to exclude from analysis */
    excludePaths: string[];
  };

  /** Optimization configuration */
  optimization: {
    /** Risk tolerance levels */
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    /** Enable automatic backup creation */
    enableBackups: boolean;
    /** Backup directory path */
    backupPath: string;
    /** Enable dry-run mode */
    dryRun: boolean;
    /** Maximum files to process in a single batch */
    batchSize: number;
  };

  /** Validation configuration */
  validation: {
    /** Enable TypeScript compilation check */
    enableTypescriptCheck: boolean;
    /** Enable ESLint validation */
    enableEslintCheck: boolean;
    /** Enable build validation */
    enableBuildCheck: boolean;
    /** Timeout for validation steps (ms) */
    validationTimeout: number;
  };

  /** Reporting configuration */
  reporting: {
    /** Output directory for reports */
    outputDirectory: string;
    /** Enable detailed logging */
    verboseLogging: boolean;
    /** Report formats to generate */
    formats: Array<'json' | 'markdown' | 'html' | 'csv'>;
    /** Include performance metrics in reports */
    includeMetrics: boolean;
  };

  /** Advanced AST parsing options */
  parsing: {
    /** Enable advanced type checking */
    enableTypeChecking: boolean;
    /** Include ambient module declarations */
    includeAmbientModules: boolean;
    /** Parse JSX elements */
    parseJSX: boolean;
    /** Enable strict mode parsing */
    strictMode: boolean;
  };
}

export const DEFAULT_CONFIG: ImportExportConfig = {
  analysis: {
    includePatterns: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.js',
      '**/*.jsx'
    ],
    excludePatterns: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/.next/**',
      '**/coverage/**',
      '**/*.d.ts'
    ],
    frameworkEssentials: [
      'react',
      'next',
      '@supabase/supabase-js',
      '@typescript-eslint',
      'typescript',
      'vitest',
      'playwright',
      'tailwindcss',
      'zustand'
    ],
    includePaths: [
      'src/',
      'scripts/',
      'tests/'
    ],
    excludePaths: [
      'node_modules/',
      '.next/',
      'dist/',
      'build/',
      'coverage/',
      '.backup-import-paths/'
    ]
  },

  optimization: {
    riskTolerance: 'conservative',
    enableBackups: true,
    backupPath: '.backup-import-paths',
    dryRun: false,
    batchSize: 50
  },

  validation: {
    enableTypescriptCheck: true,
    enableEslintCheck: true,
    enableBuildCheck: false, // Skip by default for performance
    validationTimeout: 30000 // 30 seconds
  },

  reporting: {
    outputDirectory: 'logs/',
    verboseLogging: true,
    formats: ['json', 'markdown'],
    includeMetrics: true
  },

  parsing: {
    enableTypeChecking: true,
    includeAmbientModules: false,
    parseJSX: true,
    strictMode: true
  }
};

/**
 * Environment-specific configuration overrides
 */
export function getEnvironmentConfig(): {
  optimization?: Partial<ImportExportConfig['optimization']>;
  validation?: Partial<ImportExportConfig['validation']>;
  reporting?: Partial<ImportExportConfig['reporting']>;
  analysis?: Partial<ImportExportConfig['analysis']>;
  parsing?: Partial<ImportExportConfig['parsing']>;
} {
  const env = process.env.NODE_ENV || 'development';
  
  switch (env) {
    case 'production':
      return {
        optimization: {
          riskTolerance: 'conservative',
          dryRun: true, // Always dry-run in production
          enableBackups: true
        },
        validation: {
          enableBuildCheck: true, // Enable build check in production
          validationTimeout: 60000 // Longer timeout for production
        }
      };
    
    case 'test':
      return {
        optimization: {
          dryRun: true,
          enableBackups: false
        },
        reporting: {
          verboseLogging: false,
          formats: ['json']
        }
      };
    
    default: // development
      return {
        optimization: {
          riskTolerance: 'moderate'
        },
        reporting: {
          verboseLogging: true
        }
      };
  }
}

/**
 * Merge configuration with environment overrides
 */
export function createConfig(userConfig?: {
  optimization?: Partial<ImportExportConfig['optimization']>;
  validation?: Partial<ImportExportConfig['validation']>;
  reporting?: Partial<ImportExportConfig['reporting']>;
  analysis?: Partial<ImportExportConfig['analysis']>;
  parsing?: Partial<ImportExportConfig['parsing']>;
}): ImportExportConfig {
  const envConfig = getEnvironmentConfig();
  
  return {
    ...DEFAULT_CONFIG,
    // Deep merge nested objects
    analysis: {
      ...DEFAULT_CONFIG.analysis,
      ...envConfig.analysis,
      ...userConfig?.analysis
    },
    optimization: {
      ...DEFAULT_CONFIG.optimization,
      ...envConfig.optimization,
      ...userConfig?.optimization
    },
    validation: {
      ...DEFAULT_CONFIG.validation,
      ...envConfig.validation,
      ...userConfig?.validation
    },
    reporting: {
      ...DEFAULT_CONFIG.reporting,
      ...envConfig.reporting,
      ...userConfig?.reporting
    },
    parsing: {
      ...DEFAULT_CONFIG.parsing,
      ...envConfig.parsing,
      ...userConfig?.parsing
    }
  };
}

/**
 * Configuration presets for different use cases
 */
export const CONFIG_PRESETS = {
  /** Maximum safety - only remove obvious unused imports */
  ULTRA_SAFE: {
    optimization: {
      riskTolerance: 'conservative' as const,
      dryRun: true,
      enableBackups: true
    },
    validation: {
      enableTypescriptCheck: true,
      enableEslintCheck: true,
      enableBuildCheck: true
    }
  },

  /** Aggressive cleanup - remove more potential unused imports */
  AGGRESSIVE_CLEANUP: {
    optimization: {
      riskTolerance: 'aggressive' as const,
      dryRun: false,
      batchSize: 100
    },
    analysis: {
      excludePatterns: [
        '**/node_modules/**',
        '**/dist/**',
        '**/.next/**'
      ] as string[] // Reduced exclusions for more thorough analysis
    }
  },

  /** Performance focused - fast analysis with minimal validation */
  PERFORMANCE_FOCUSED: {
    validation: {
      enableTypescriptCheck: false,
      enableEslintCheck: false,
      enableBuildCheck: false,
      validationTimeout: 5000
    },
    reporting: {
      verboseLogging: false,
      formats: ['json'] as Array<'json' | 'markdown' | 'html' | 'csv'>
    },
    optimization: {
      batchSize: 200
    }
  }
} as const;