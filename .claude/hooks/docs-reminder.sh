#!/usr/bin/env bash
set -euo pipefail

YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}===========================================${NC}"
echo -e "${YELLOW}Documentation Reminder${NC}"
echo -e "${BLUE}===========================================${NC}"
echo ""
echo "Consider updating:"
echo "  - README.md (roadmap checkboxes)"
echo "  - CHANGELOG.md (new features/fixes)"
echo "  - docs/API_DOCUMENTATION.md (if API changed)"
echo "  - agents/context/current-state.md (project status)"
echo ""
echo "Run: Use the docs-maintenance agent to update documentation"
echo ""
echo -e "${BLUE}===========================================${NC}"
