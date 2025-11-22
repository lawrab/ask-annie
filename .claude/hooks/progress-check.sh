#!/usr/bin/env bash
# Progress check - Shows current milestone completion status

set -e

cd "$(dirname "$0")/../.." || exit 1

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Project Progress Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Get backend coverage (if available)
if [ -f "backend/package.json" ]; then
    echo "🔧 Backend Status:"
    if command -v jq &> /dev/null && [ -f "backend/coverage/coverage-summary.json" ]; then
        COVERAGE=$(jq -r '.total.statements.pct' backend/coverage/coverage-summary.json 2>/dev/null || echo "N/A")
        echo "  • Test Coverage: ${COVERAGE}%"
    else
        echo "  • Test Coverage: Run 'npm run test:backend' for latest"
    fi
fi

# Get frontend test count (if available)
if [ -f "frontend/package.json" ]; then
    echo ""
    echo "🎨 Frontend Status:"
    COMPONENT_COUNT=$(find frontend/src/components -name "*.tsx" -not -name "*.test.tsx" -not -name "*.stories.tsx" 2>/dev/null | wc -l || echo "0")
    echo "  • UI Components: ${COMPONENT_COUNT}"
    echo "  • Tests: Run 'npm run test:frontend' for latest count"
fi

# Show recent activity
echo ""
echo "📝 Recent Activity (last 5 commits):"
git log --oneline -5 --pretty=format:"  • %s" 2>/dev/null || echo "  No git history available"

# Show open issues count
echo ""
echo ""
if command -v gh &> /dev/null; then
    OPEN_ISSUES=$(gh issue list --limit 100 --json state --jq '[.[] | select(.state=="OPEN")] | length' 2>/dev/null || echo "N/A")
    echo "🎯 Open Issues: ${OPEN_ISSUES}"
else
    echo "🎯 Open Issues: Install 'gh' CLI for issue tracking"
fi

echo ""
echo "Run /weekly-sync for detailed progress update"
echo ""

exit 0
