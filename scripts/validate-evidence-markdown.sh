#!/bin/bash

# Evidence Collection Markdown Quality Validator
# Ensures all evidence documentation meets A.V.A.R.I.C.E. Protocol standards

set -euo pipefail

EVIDENCE_DIR="docs/evidence"

if [ ! -d "$EVIDENCE_DIR" ]; then
    echo "✅ No evidence directory found - validation passed"
    exit 0
fi

echo "🔍 Validating evidence collection markdown quality..."

# Find all markdown files in evidence directory
evidence_files=$(find "$EVIDENCE_DIR" -name "*.md" -type f)

if [ -z "$evidence_files" ]; then
    echo "✅ No evidence markdown files found - validation passed"
    exit 0
fi

violations=0

# Validate each evidence file
for file in $evidence_files; do
    echo "Checking: $file"
    
    # Run markdownlint
    if ! npx markdownlint "$file" --config .markdownlint.json; then
        echo "❌ Markdown violations in: $file"
        violations=$((violations + 1))
    fi
    
    # Run spell check
    if ! npx cspell "$file" --config .cspell.json --no-progress; then
        echo "❌ Spelling violations in: $file"
        violations=$((violations + 1))
    fi
done

if [ $violations -eq 0 ]; then
    echo "✅ All evidence documentation meets markdown quality standards"
    exit 0
else
    echo "❌ Found $violations violations in evidence documentation"
    echo "💡 Run 'npm run lint:md:fix' to auto-fix issues"
    exit 1
fi
