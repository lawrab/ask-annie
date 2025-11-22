#!/usr/bin/env bash
set -euo pipefail

GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Wave Progress Tracker${NC}"

COMPLETED=$(grep -A 20 "Wave 2B" README.md 2>/dev/null | grep -c "done" || echo 0)
TOTAL=$(grep -A 20 "Wave 2B" README.md 2>/dev/null | grep -cE "done|todo" || echo 1)

if [ "$TOTAL" -gt 0 ]; then
    PERCENTAGE=$((COMPLETED * 100 / TOTAL))
    echo "Current Wave: Wave 2B"
    echo "Progress: $COMPLETED/$TOTAL tasks ($PERCENTAGE%)"
    
    if [ "$PERCENTAGE" -eq 100 ]; then
        echo -e "${GREEN}Wave complete! Run: /wave-complete${NC}"
    fi
fi
