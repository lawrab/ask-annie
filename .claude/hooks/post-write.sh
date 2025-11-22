#!/usr/bin/env bash
set -euo pipefail

YELLOW='\033[1;33m'
GREEN='\033[0;32m'
NC='\033[0m'

FILE_PATH="${1:-unknown}"

echo -e "${YELLOW}File written: $FILE_PATH${NC}"

if [[ "$FILE_PATH" == *"backend/src"* ]]; then
    echo -e "${GREEN}Backend file modified${NC}"
    echo "  -> Remember to update tests and check coverage"
fi

if [[ "$FILE_PATH" == *"frontend/src/components"* ]]; then
    echo -e "${GREEN}Component modified${NC}"
    echo "  -> Remember to add/update Storybook story and tests"
fi

if [[ "$FILE_PATH" == *"docs/API"* ]]; then
    echo -e "${GREEN}API docs modified${NC}"
    echo "  -> Remember to update CHANGELOG.md"
fi
