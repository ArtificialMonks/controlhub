// A.V.A.R.I.C.E. Protocol ESLint Configuration (ES-001 Prevention Rule)
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    tsconfigRootDir: __dirname,  // Critical for proper TypeScript resolution
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
  ],
  env: {
    node: true,
    es6: true,
    jest: true,
  },
  globals: {
    NodeJS: 'readonly',  // Prevent NodeJS undefined errors
  },
  rules: {
    // Prevent unused variables with underscore exception
    '@typescript-eslint/no-unused-vars': ['error', {
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],

    // Allow any types throughout the codebase
    '@typescript-eslint/no-explicit-any': 'off',

    // Prevent lexical declaration issues
    'no-case-declarations': 'error',

    // Console usage control
    'no-console': 'off',  // Allowed in A.V.A.R.I.C.E. Protocol

    // Error handling
    'no-useless-catch': 'error',

    // Turn off base rule as it can report incorrect errors
    'no-unused-vars': 'off',
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.js',
    // Add specific files that need to be ignored
    'src/avarice-frameworks/ant-colony-ui/start-server.ts',
  ],
};
