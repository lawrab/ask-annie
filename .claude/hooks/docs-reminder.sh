#!/usr/bin/env bash
# Docs reminder - Shows documentation update checklist

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📚 Documentation Update Checklist"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Before ending your session, verify:"
echo ""
echo "  ☐ CHANGELOG.md - Added to Unreleased section"
echo "  ☐ README.md - Updated if features/status changed"
echo "  ☐ API docs - Updated if endpoints/schemas changed"
echo "  ☐ Context files - Updated current-state.md if needed"
echo "  ☐ Tests - Maintained 95%+ coverage"
echo "  ☐ Storybook - Added stories for new UI components"
echo ""
echo "Run /weekly-sync for comprehensive documentation update"
echo ""

exit 0
