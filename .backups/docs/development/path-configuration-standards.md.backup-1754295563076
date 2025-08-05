# Path Configuration Standards

## Overview

This document defines the path configuration standards for the Communitee Control Hub project to ensure consistent, maintainable, and project-agnostic file structure.

## TypeScript Path Mapping

### Configured Aliases

The following path aliases are configured in `tsconfig.json` and `vitest.config.ts`:

```typescript
{
  "@/*": ["./src/*"],                    // General src access
  "@/components/*": ["./src/components/*"], // UI components
  "@/lib/*": ["./src/lib/*"],            // Utilities and services
  "@/app/*": ["./src/app/*"],            // Next.js app directory
  "@/hooks/*": ["./src/hooks/*"],        // React hooks
  "@/types/*": ["./src/lib/types/*"],    // TypeScript type definitions
  "@/test/*": ["./src/test/*"]           // Test utilities
}
```

### Usage Examples

```typescript
// ✅ CORRECT: Use path aliases
import { Button } from "@/components/ui/button"
import { AutomationService } from "@/lib/services/automation-service"
import { useAutomations } from "@/hooks/useAutomations"
import type { Automation } from "@/types/automation"

// ❌ WRONG: Relative paths for cross-directory imports
import { Button } from "../../components/ui/button"
import { AutomationService } from "../../../lib/services/automation-service"
```

## Directory Structure Standards

### Project-Agnostic Paths

All configuration files use relative paths to ensure project portability:

```typescript
// ✅ CORRECT: Relative paths in config
const config = {
  testDir: './tests',
  outputFolder: 'playwright-report'
}

// ❌ WRONG: Absolute paths
const config = {
  testDir: '/Users/username/project/tests',
  outputFolder: '/Users/username/project/playwright-report'
}
```

### Environment-Specific Paths

Use environment variables for deployment-specific paths:

```typescript
// ✅ CORRECT: Environment-based configuration
const config = {
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
  apiUrl: process.env.NEXT_PUBLIC_API_URL || '/api'
}
```

## Configuration Files

### TypeScript Configuration

- **File**: `tsconfig.json`
- **Purpose**: TypeScript compilation and IDE support
- **Path Mapping**: Configured for all major directories

### Vitest Configuration

- **File**: `vitest.config.ts`
- **Purpose**: Test execution and module resolution
- **Alignment**: Matches TypeScript path mapping exactly

### Tailwind Configuration

- **File**: `tailwind.config.ts`
- **Content Paths**: Uses glob patterns for flexibility
- **Relative Paths**: All paths relative to project root

## Best Practices

### Import Organization

1. **External libraries first**
2. **Internal imports using aliases**
3. **Type imports last**

```typescript
// ✅ CORRECT: Organized imports
import React from 'react'
import { NextRequest } from 'next/server'

import { Button } from "@/components/ui/button"
import { automationService } from "@/lib/services/automation-service"
import { useToast } from "@/hooks/use-toast"

import type { Automation } from "@/types/automation"
```

### Path Consistency

- Always use the most specific alias available
- Prefer `@/components/*` over `@/*` for component imports
- Use `@/types/*` for all type imports

### Configuration Portability

- Never hardcode absolute paths in configuration
- Use environment variables for deployment-specific settings
- Ensure all paths work across different operating systems

## Validation

### Build Verification

```bash
# Verify TypeScript compilation
npm run build

# Verify test configuration
npm run test

# Verify linting
npm run lint
```

### Path Resolution Testing

```typescript
// Test import resolution
import { describe, it, expect } from 'vitest'
import { Button } from "@/components/ui/button"
import type { Automation } from "@/types/automation"

describe('Path Resolution', () => {
  it('should resolve component imports', () => {
    expect(Button).toBeDefined()
  })
})
```

## Troubleshooting

### Common Issues

1. **Module not found**: Check alias configuration in both `tsconfig.json` and `vitest.config.ts`
2. **IDE not recognizing paths**: Restart TypeScript service in IDE
3. **Test imports failing**: Verify Vitest alias configuration matches TypeScript

### Resolution Steps

1. Verify path mapping configuration
2. Check file exists at expected location
3. Restart development server
4. Clear Next.js cache: `rm -rf .next`

## Compliance

This configuration ensures:

- ✅ **Project Portability**: Works across different environments
- ✅ **Developer Experience**: Consistent import patterns
- ✅ **Build Reliability**: Proper module resolution
- ✅ **Test Integration**: Aligned test and build configurations
- ✅ **IDE Support**: Full IntelliSense and navigation

## Updates

When adding new major directories:

1. Update `tsconfig.json` paths
2. Update `vitest.config.ts` alias
3. Update this documentation
4. Test import resolution
5. Update STRUCTURE.md if needed
