#!/usr/bin/env bash
set -uo pipefail

# Change to project root (works regardless of where Claude Code runs from)
cd "$(dirname "$0")/../.." || exit 0

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Wave Progress Tracker${NC}"

# Count completed and total tasks (grep -c returns 1 on no match, so we handle it)
COMPLETED=$(grep -A 20 "Wave 2B" README.md 2>/dev/null | grep -c "done" 2>/dev/null) || COMPLETED=0
TOTAL=$(grep -A 20 "Wave 2B" README.md 2>/dev/null | grep -cE "done|todo" 2>/dev/null) || TOTAL=0

if [ "$TOTAL" -gt 0 ]; then
    PERCENTAGE=$((COMPLETED * 100 / TOTAL))
    echo "Current Wave: Wave 2B"
    echo "Progress: $COMPLETED/$TOTAL tasks ($PERCENTAGE%)"

    if [ "$PERCENTAGE" -eq 100 ]; then
        echo -e "${GREEN}Wave complete! Run: /wave-complete${NC}"
    fi
else
    echo "No Wave 2B tasks found in README.md"
fi
