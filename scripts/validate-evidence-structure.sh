#!/bin/bash

# A.V.A.R.I.C.E. Protocol Evidence Structure Validation Script
# This script validates evidence storage compliance and enforces zero tolerance policy

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${BLUE}🔍 A.V.A.R.I.C.E. Protocol Evidence Structure Validation${NC}"
echo -e "${BLUE}=================================================${NC}"
echo ""

# Check if TypeScript validation script exists
VALIDATION_SCRIPT="$SCRIPT_DIR/validate-evidence-structure.ts"
if [ ! -f "$VALIDATION_SCRIPT" ]; then
    echo -e "${RED}❌ Validation script not found: $VALIDATION_SCRIPT${NC}"
    exit 1
fi

# Check if evidence directory exists
EVIDENCE_DIR="$PROJECT_ROOT/docs/evidence"
if [ ! -d "$EVIDENCE_DIR" ]; then
    echo -e "${YELLOW}⚠️  Evidence directory does not exist: $EVIDENCE_DIR${NC}"
    echo -e "${BLUE}Creating evidence directory structure...${NC}"
    mkdir -p "$EVIDENCE_DIR"
fi

# Check if template exists
TEMPLATE_DIR="$EVIDENCE_DIR/TEMPLATE-quest-structure"
if [ ! -d "$TEMPLATE_DIR" ]; then
    echo -e "${YELLOW}⚠️  Template directory not found: $TEMPLATE_DIR${NC}"
    echo -e "${BLUE}Template should be created by A.V.A.R.I.C.E. Protocol setup${NC}"
fi

# Run TypeScript validation
echo -e "${BLUE}Running evidence structure validation...${NC}"
echo ""

# Execute the TypeScript validation script
if npx tsx "$VALIDATION_SCRIPT"; then
    echo ""
    echo -e "${GREEN}✅ Evidence structure validation PASSED${NC}"
    echo -e "${GREEN}All evidence is properly organized in quest-specific directories${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ Evidence structure validation FAILED${NC}"
    echo -e "${RED}IMMEDIATE ACTION REQUIRED:${NC}"
    echo -e "${RED}• Fix all validation errors before proceeding${NC}"
    echo -e "${RED}• Evidence structure violations trigger stop-work order${NC}"
    echo -e "${RED}• Refer to docs/evidence/TEMPLATE-quest-structure/ for correct structure${NC}"
    echo ""
    echo -e "${YELLOW}📋 Quick Fix Commands:${NC}"
    echo -e "${YELLOW}• Create quest directory: mkdir -p docs/evidence/quest-X.Y/{phase-evidence,agent-reports,quality-gates,memorization}${NC}"
    echo -e "${YELLOW}• Move misplaced evidence to correct quest-specific directories${NC}"
    echo -e "${YELLOW}• Remove evidence from non-quest directories${NC}"
    echo ""
    exit 1
fi
