#!/bin/bash

# Markdown Quality Validation Script
# This script validates markdown files for quality standards and prevents commits with violations

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
MAX_LINE_LENGTH=120
REQUIRED_EXTENSIONS=("markdownlint" "cspell")

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

# Function to check if required tools are available
check_dependencies() {
    print_status "$BLUE" "Checking dependencies..."
    
    local missing_tools=()
    
    # Check for Node.js and npm
    if ! command -v node &> /dev/null; then
        missing_tools+=("node")
    fi
    
    if ! command -v npm &> /dev/null; then
        missing_tools+=("npm")
    fi
    
    # Check for markdownlint-cli
    if ! npm list -g markdownlint-cli &> /dev/null && ! npm list markdownlint-cli &> /dev/null; then
        missing_tools+=("markdownlint-cli")
    fi
    
    # Check for cspell
    if ! npm list -g cspell &> /dev/null && ! npm list cspell &> /dev/null; then
        missing_tools+=("cspell")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_status "$RED" "Missing required tools: ${missing_tools[*]}"
        print_status "$YELLOW" "Please install missing tools and try again."
        exit 1
    fi
    
    print_status "$GREEN" "All dependencies available ✓"
}

# Function to run markdown linting
run_markdown_lint() {
    print_status "$BLUE" "Running markdown linting..."
    
    local violations=0
    
    # Run markdownlint and capture output
    if ! npm run lint:md > /tmp/markdownlint_output.txt 2>&1; then
        violations=1
        print_status "$RED" "Markdown linting violations found:"
        cat /tmp/markdownlint_output.txt
        echo ""
    else
        print_status "$GREEN" "Markdown linting passed ✓"
    fi
    
    return $violations
}

# Function to run spell checking
run_spell_check() {
    print_status "$BLUE" "Running spell checking..."
    
    local violations=0
    
    # Run cspell and capture output
    if ! npx cspell "**/*.md" --no-progress > /tmp/cspell_output.txt 2>&1; then
        violations=1
        print_status "$YELLOW" "Spell check violations found:"
        cat /tmp/cspell_output.txt
        echo ""
        print_status "$YELLOW" "Note: Add legitimate technical terms to .cspell.json"
    else
        print_status "$GREEN" "Spell checking passed ✓"
    fi
    
    return $violations
}

# Function to validate specific quality gates
validate_quality_gates() {
    print_status "$BLUE" "Validating quality gates..."
    
    local violations=0
    local total_files=0
    local processed_files=0
    
    # Find all markdown files
    while IFS= read -r -d '' file; do
        ((total_files++))
    done < <(find . -name "*.md" -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" -print0)
    
    print_status "$BLUE" "Processing $total_files markdown files..."
    
    while IFS= read -r -d '' file; do
        ((processed_files++))
        
        # Check line length
        local long_lines=$(awk -v max=$MAX_LINE_LENGTH 'length > max {print NR ": " $0}' "$file")
        if [ -n "$long_lines" ]; then
            violations=1
            print_status "$RED" "Line length violations in $file:"
            echo "$long_lines" | head -10
            if [ $(echo "$long_lines" | wc -l) -gt 10 ]; then
                echo "... and $(( $(echo "$long_lines" | wc -l) - 10 )) more"
            fi
            echo ""
        fi
        
        # Show progress for large numbers of files
        if [ $total_files -gt 50 ] && [ $((processed_files % 20)) -eq 0 ]; then
            print_status "$BLUE" "Progress: $processed_files/$total_files files processed"
        fi
        
    done < <(find . -name "*.md" -not -path "./node_modules/*" -not -path "./.next/*" -not -path "./.git/*" -print0)
    
    if [ $violations -eq 0 ]; then
        print_status "$GREEN" "Quality gates validation passed ✓"
    fi
    
    return $violations
}

# Function to provide helpful suggestions
provide_suggestions() {
    print_status "$PURPLE" "📚 Helpful Commands:"
    echo "  • Fix auto-fixable issues: npm run lint:md:fix"
    echo "  • Add spell-check terms: Edit .cspell.json"
    echo "  • View markdown template: cat .templates/markdown-template.md"
    echo "  • Manual line wrapping: Use editor auto-wrap at 120 characters"
    echo ""
    print_status "$PURPLE" "📖 Documentation:"
    echo "  • Markdown standards: docs/MARKDOWN_LINTING.md"
    echo "  • Quality prevention: docs/markdown-quality-prevention-system.md"
}

# Function to generate summary report
generate_summary() {
    local lint_result=$1
    local spell_result=$2
    local quality_result=$3
    
    print_status "$BLUE" "=== VALIDATION SUMMARY ==="
    
    local total_violations=$((lint_result + spell_result + quality_result))
    
    if [ $lint_result -eq 0 ]; then
        print_status "$GREEN" "✓ Markdown Linting: PASSED"
    else
        print_status "$RED" "✗ Markdown Linting: FAILED"
    fi
    
    if [ $spell_result -eq 0 ]; then
        print_status "$GREEN" "✓ Spell Checking: PASSED"
    else
        print_status "$YELLOW" "⚠ Spell Checking: WARNINGS"
    fi
    
    if [ $quality_result -eq 0 ]; then
        print_status "$GREEN" "✓ Quality Gates: PASSED"
    else
        print_status "$RED" "✗ Quality Gates: FAILED"
    fi
    
    echo ""
    
    if [ $total_violations -eq 0 ]; then
        print_status "$GREEN" "🎉 ALL VALIDATIONS PASSED!"
        print_status "$GREEN" "Markdown quality standards met. Ready to commit."
        return 0
    else
        print_status "$RED" "❌ VALIDATION FAILURES DETECTED"
        print_status "$RED" "Please fix violations before committing."
        provide_suggestions
        return 1
    fi
}

# Main execution
main() {
    print_status "$PURPLE" "🔍 Markdown Quality Validation Starting..."
    echo ""
    
    # Check dependencies
    check_dependencies
    echo ""
    
    # Initialize results
    local lint_violations=0
    local spell_violations=0
    local quality_violations=0
    
    # Run validations
    run_markdown_lint || lint_violations=1
    echo ""
    
    run_spell_check || spell_violations=1
    echo ""
    
    validate_quality_gates || quality_violations=1
    echo ""
    
    # Generate summary and exit with appropriate code
    generate_summary $lint_violations $spell_violations $quality_violations
}

# Cleanup function
cleanup() {
    rm -f /tmp/markdownlint_output.txt /tmp/cspell_output.txt
}

# Set up cleanup on exit
trap cleanup EXIT

# Run main function
main "$@"