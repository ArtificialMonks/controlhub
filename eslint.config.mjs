import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  // Override for test files and development utilities
  {
    files: [
      "**/*.test.ts",
      "**/*.test.tsx",
      "**/*.spec.ts",
      "**/*.spec.tsx",
      "**/test/**/*",
      "**/tests/**/*",
      "src/test/**/*",
      "scripts/**/*",
      "avarice-protocol/**/*",
      // Include specific test file patterns that might be missed
      "**/__tests__/**/*",
      "**/lib/**/*.test.*",
      "**/components/**/*.test.*"
    ],
    rules: {
      // Disable unused variable warnings for test files and development utilities
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      // Allow explicit any in test files for mocking and testing purposes
      "@typescript-eslint/no-explicit-any": "off",
      // Disable complexity warnings for test files
      "complexity": "off"
    }
  },

  // Override for specific development/utility files that commonly have unused imports
  {
    files: [
      "**/lib/architecture/**/*",
      "**/lib/deployment/**/*",
      "**/lib/memory/**/*",
      "**/lib/mobile/**/*",
      "**/lib/performance/**/*",
      "**/lib/quality/**/*",
      "**/lib/security/**/*",
      "**/lib/termination/**/*",
      "**/lib/verification/**/*"
    ],
    rules: {
      // Allow unused variables in development utilities that may be work-in-progress
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "ignoreRestSiblings": true
      }]
    }
  }
];

export default eslintConfig;
