#!/usr/bin/env bash
# Post-write hook - Reminds about test coverage after file changes

set -e

# Get the file that was written from the first argument
WRITTEN_FILE="$1"

# Only check for source files
if [[ "$WRITTEN_FILE" =~ \.(ts|tsx|js|jsx)$ ]] && [[ ! "$WRITTEN_FILE" =~ \.test\. ]] && [[ ! "$WRITTEN_FILE" =~ \.stories\. ]]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📝 File Updated: $WRITTEN_FILE"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "🧪 Test Coverage Reminder:"
    echo "  • Maintain 95%+ coverage requirement"
    echo "  • Update or add tests for changes"
    echo "  • Run: npm run test:backend (99.08% coverage)"
    echo "  • Run: npm run test:frontend (270 tests)"
    echo ""
    echo "📚 If adding new features, consider updating:"
    echo "  • CHANGELOG.md (Unreleased section)"
    echo "  • API documentation if endpoints changed"
    echo "  • Storybook stories for UI components"
    echo ""
fi

exit 0
