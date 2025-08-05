#!/bin/bash

# Force refresh cspell configuration across all tools
echo "🔄 Refreshing cspell configuration..."

# Clear any cached cspell data
echo "Clearing cspell cache..."
rm -rf ~/.cspell
rm -rf ./.cspell-cache

# Restart VS Code language server (if running)
echo "Reloading VS Code configuration..."
if command -v code &> /dev/null; then
    code --command "developer.reloadWindow" &>/dev/null || true
fi

# Run comprehensive spell check
echo "Running comprehensive spell check..."
npx cspell "**/*.{md,ts,tsx,js,jsx,json,yml,yaml}" --config .cspell.json --no-progress

echo "✅ cspell configuration refreshed"
echo "📝 If you're still seeing errors in your IDE:"
echo "   1. Restart your IDE/editor"
echo "   2. Check that the cSpell extension is using the right config"
echo "   3. Run: 'Command Palette > Developer: Reload Window' in VS Code"