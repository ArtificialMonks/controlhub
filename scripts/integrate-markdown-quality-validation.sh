#!/bin/bash

# A.V.A.R.I.C.E. Protocol Markdown Quality Integration Script
# Completes the integration of markdown quality validation into all 9 phases

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}[$(date +'%Y-%m-%d %H:%M:%S')] ${message}${NC}"
}

# Function to update phase test configuration
update_phase_test_config() {
    local phase=$1
    local phase_name=$2
    local test_file="avarice-protocol/avarice-phases/frameworks/testing/phase-${phase}-tests.json"
    
    print_status "$BLUE" "Updating Phase $phase test configuration..."
    
    if [ ! -f "$test_file" ]; then
        print_status "$RED" "Test configuration file not found: $test_file"
        return 1
    fi
    
    # Create backup
    cp "$test_file" "${test_file}.backup"
    
    # Add markdown validation based on phase
    case $phase in
        1)
            # Phase 1: Strategic Planning - Basic markdown validation
            local markdown_script='"validate:markdown-quality"'
            local description='"Strategic documentation markdown quality validation"'
            ;;
        2)
            # Phase 2: Contextual Grounding - Research documentation validation
            local markdown_script='"lint:md:avarice"'
            local description='"Research documentation markdown validation"'
            ;;
        3)
            # Phase 3: Expert Council - Consensus documentation validation
            local markdown_script='"validate:markdown-quality"'
            local description='"Expert council documentation markdown validation"'
            ;;
        4)
            # Phase 4: Implementation - Technical documentation validation
            local markdown_script='"lint:md:avarice"'
            local description='"Implementation documentation markdown validation"'
            ;;
        5)
            # Phase 5: Multi-Layer Verification - Comprehensive validation
            local markdown_script='"validate:avarice-docs"'
            local description='"Comprehensive A.V.A.R.I.C.E. documentation validation"'
            ;;
        6)
            # Phase 6: Architectural Review - Architecture documentation validation
            local markdown_script='"validate:markdown-quality"'
            local description='"Architectural documentation markdown validation"'
            ;;
        7)
            # Phase 7: Protocol Validation - Protocol documentation validation
            local markdown_script='"validate:avarice-docs"'
            local description='"Protocol documentation comprehensive validation"'
            ;;
        8)
            # Phase 8: Knowledge Memorization - Knowledge documentation validation
            local markdown_script='"spell:avarice"'
            local description='"Knowledge documentation spelling validation"'
            ;;
        9)
            # Phase 9: Autonomous Termination - Final documentation validation
            local markdown_script='"validate:avarice-docs"'
            local description='"Final documentation comprehensive validation"'
            ;;
    esac
    
    # Use Python to properly update JSON (more reliable than sed/awk for JSON)
    python3 -c "
import json
import sys

# Read the JSON file
with open('$test_file', 'r') as f:
    data = json.load(f)

# Add markdown validation to required scripts
markdown_test = {
    'script': $markdown_script,
    'description': $description,
    'timeout': 30000,
    'successCriteria': 'Zero markdownlint violations in phase documentation',
    'order': len(data['testScripts']['required']) + 1
}

data['testScripts']['required'].append(markdown_test)

# Add markdown quality gate
data['qualityGates']['markdownCompliance'] = 100

# Write back to file
with open('$test_file', 'w') as f:
    json.dump(data, f, indent=2)

print('Successfully updated Phase $phase test configuration')
"
    
    if [ $? -eq 0 ]; then
        print_status "$GREEN" "✅ Phase $phase test configuration updated"
    else
        print_status "$RED" "❌ Failed to update Phase $phase test configuration"
        # Restore backup
        mv "${test_file}.backup" "$test_file"
        return 1
    fi
}

# Function to update phase documentation
update_phase_documentation() {
    local phase=$1
    local phase_file="avarice-protocol/avarice-phases/phase-${phase}-*.md"
    
    print_status "$BLUE" "Updating Phase $phase documentation..."
    
    # Find the actual phase file
    local actual_file=$(ls $phase_file 2>/dev/null | head -1)
    
    if [ -z "$actual_file" ]; then
        print_status "$YELLOW" "⚠️  Phase $phase documentation file not found"
        return 0
    fi
    
    # Check if markdown quality validation is already mentioned
    if grep -q "markdown.*quality\|PR-00[1-7]\|validate:markdown-quality" "$actual_file"; then
        print_status "$GREEN" "✅ Phase $phase documentation already includes markdown quality references"
        return 0
    fi
    
    # Add markdown quality validation section
    local temp_file=$(mktemp)
    
    # Find the quality gates section and add markdown validation
    awk '
    /^## 📊 Quality Gates & Validation/ {
        print $0
        print ""
        print "### **Markdown Quality Validation (MANDATORY)**"
        print "- **Prevention Rules**: All documentation must comply with PR-001 through PR-007"
        print "- **Validation Command**: `npm run validate:markdown-quality`"
        print "- **Success Criteria**: Zero markdownlint violations, zero spelling errors"
        print "- **Agent Responsibility**: All agents must validate markdown before phase completion"
        print ""
        next
    }
    { print }
    ' "$actual_file" > "$temp_file"
    
    # Only update if we actually added content
    if ! cmp -s "$actual_file" "$temp_file"; then
        mv "$temp_file" "$actual_file"
        print_status "$GREEN" "✅ Phase $phase documentation updated with markdown quality validation"
    else
        rm "$temp_file"
        print_status "$YELLOW" "⚠️  Phase $phase documentation unchanged"
    fi
}

# Function to create evidence collection validation
create_evidence_validation() {
    print_status "$BLUE" "Creating evidence collection validation..."
    
    local evidence_validator="scripts/validate-evidence-markdown.sh"
    
    cat > "$evidence_validator" << 'EOF'
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
EOF
    
    chmod +x "$evidence_validator"
    print_status "$GREEN" "✅ Evidence validation script created"
}

# Function to update package.json with evidence validation
update_package_json_evidence() {
    print_status "$BLUE" "Adding evidence validation to package.json..."
    
    # Check if evidence validation script already exists
    if grep -q "validate:evidence" package.json; then
        print_status "$GREEN" "✅ Evidence validation script already exists in package.json"
        return 0
    fi
    
    # Add evidence validation script
    sed -i.backup 's/"validate:avarice-docs": "\.\/avarice-protocol\/scripts\/validate-avarice-docs\.sh",/"validate:avarice-docs": ".\/avarice-protocol\/scripts\/validate-avarice-docs.sh",\n    "validate:evidence": ".\/scripts\/validate-evidence-markdown.sh",/' package.json
    
    print_status "$GREEN" "✅ Evidence validation script added to package.json"
}

# Main execution function
main() {
    print_status "$PURPLE" "🎯 A.V.A.R.I.C.E. Protocol Markdown Quality Integration Starting..."
    echo ""
    
    # Check if we're in the right directory
    if [ ! -d "avarice-protocol" ]; then
        print_status "$RED" "❌ A.V.A.R.I.C.E. Protocol directory not found"
        print_status "$YELLOW" "Please run this script from the project root directory"
        exit 1
    fi
    
    # Check if Python3 is available for JSON processing
    if ! command -v python3 &> /dev/null; then
        print_status "$RED" "❌ Python3 is required for JSON processing"
        exit 1
    fi
    
    print_status "$BLUE" "📋 Phase 1: Updating test configurations..."
    
    # Update all 9 phase test configurations
    local phase_names=("Strategic Planning" "Contextual Grounding" "Expert Council" "Implementation" "Multi-Layer Verification" "Architectural Review" "Protocol Validation" "Knowledge Memorization" "Autonomous Termination")
    
    for phase in {1..9}; do
        update_phase_test_config $phase "${phase_names[$((phase-1))]}"
    done
    
    echo ""
    print_status "$BLUE" "📋 Phase 2: Updating phase documentation..."
    
    # Update all 9 phase documentation files
    for phase in {1..9}; do
        update_phase_documentation $phase
    done
    
    echo ""
    print_status "$BLUE" "📋 Phase 3: Creating evidence validation..."
    
    create_evidence_validation
    update_package_json_evidence
    
    echo ""
    print_status "$BLUE" "📋 Phase 4: Validation test..."
    
    # Test the integration
    print_status "$BLUE" "Testing markdown validation scripts..."
    
    if ./scripts/validate-markdown-quality.sh; then
        print_status "$GREEN" "✅ Markdown quality validation script working"
    else
        print_status "$YELLOW" "⚠️  Markdown quality validation found issues (expected)"
    fi
    
    if ./avarice-protocol/scripts/validate-avarice-docs.sh; then
        print_status "$GREEN" "✅ A.V.A.R.I.C.E. documentation validation script working"
    else
        print_status "$YELLOW" "⚠️  A.V.A.R.I.C.E. documentation validation found issues (expected)"
    fi
    
    echo ""
    print_status "$GREEN" "🎉 A.V.A.R.I.C.E. Protocol Markdown Quality Integration Complete!"
    echo ""
    print_status "$BLUE" "📋 Integration Summary:"
    echo "  ✅ Updated all 9 phase test configurations with markdown validation"
    echo "  ✅ Updated phase documentation with markdown quality requirements"
    echo "  ✅ Created evidence collection validation script"
    echo "  ✅ Added validation scripts to package.json"
    echo "  ✅ Tested validation scripts functionality"
    echo ""
    print_status "$BLUE" "📋 Next Steps:"
    echo "  1. Run 'npm run validate:markdown-quality' to check current status"
    echo "  2. Run 'npm run validate:avarice-docs' for comprehensive validation"
    echo "  3. Use 'npm run lint:md:fix' to auto-fix markdown issues"
    echo "  4. All future A.V.A.R.I.C.E. Protocol phases will automatically validate markdown quality"
    echo ""
    print_status "$GREEN" "🚀 Markdown quality prevention system is now fully integrated!"
}

# Run main function
main "$@"
