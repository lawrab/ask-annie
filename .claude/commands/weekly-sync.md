---
description: Weekly sync - Update context files, CHANGELOG, and README
---

Perform a comprehensive weekly synchronization of project documentation:

1. **Update Context Files** (agents/context/):
   - current-state.md: Update progress, active issues, and metrics
   - Review architecture-decisions.md for any new ADRs needed
   - Update common-patterns.md if new patterns emerged

2. **Update CHANGELOG.md**:
   - Review recent commits (last 7 days)
   - Add any completed features or bug fixes to Unreleased section
   - Ensure format follows Keep a Changelog standard

3. **Update README.md**:
   - Sync project status with current progress
   - Update test coverage metrics
   - Update feature list if new capabilities were added
   - Verify all progress markers are accurate

4. **Check Active Issues**:
   - Review open issues and pull requests
   - Calculate completion percentage for current milestone
   - Update roadmap section

5. **Verify Current Metrics**:
   - Run `npm run test:backend` to get latest coverage
   - Run `npm run test:frontend` to get test count
   - Count UI components in frontend/src/components

After updates, provide a summary of:
- What changed in the past week
- Current milestone status
- Any action items or blockers
