# Ask Annie Agent Quick Reference

## Available Agents

### Project Agents (.claude/agents/)
- **backend-dev**: Express/MongoDB/Whisper development
- **frontend-dev**: React/Tailwind/Storybook development  
- **testing-specialist**: Test coverage maintenance
- **docs-maintenance**: Documentation sync

## Custom Commands

- `/weekly-sync` - Update all context and docs files
- `/wave-complete` - Mark wave done, prep for next

## Agent Invocation

**Automatic:** Agents auto-invoke based on context
```
Add a new symptom trends endpoint
```

**Explicit:** Force specific agent
```
Use the docs-maintenance agent to update CHANGELOG
```

## Workflow Pattern

### Feature Development
1. Backend: backend-dev implements API
2. Test: testing-specialist ensures coverage
3. Frontend: frontend-dev builds UI
4. Test Again: testing-specialist verifies
5. Document: docs-maintenance updates docs

### Weekly Maintenance
```
/weekly-sync
```

### Wave Completion
```
/wave-complete
```

## Memory Files Location

- **Current State**: agents/context/current-state.md
- **Architecture Decisions**: agents/context/architecture-decisions.md
- **Common Patterns**: agents/context/common-patterns.md

## Tips

- Agents maintain separate context
- Use specific descriptions for better routing
- Review agent outputs before applying
- Keep agents focused (single responsibility)
- Update memory files weekly
