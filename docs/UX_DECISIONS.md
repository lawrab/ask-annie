# UX Design Decisions

This document records significant UX design decisions made during the Ask Annie project development.

---

## Timeline View with Progressive Disclosure (2025-11-17)

**Status**: Approved
**Related Issues**: #21, #77, #78, #79
**Design System Version**: 1.1.0

### Context

During Issue #72 (Design System definition), we reviewed the current dashboard implementation and projected how it would scale with real-world usage. The analysis revealed that the existing design would create significant UX problems:

**Current Design Issues:**
- Each check-in displays ALL data by default:
  - Full timestamp
  - All symptoms (could be 5-10+) as individual badges
  - All activities (could be 5-10+) as individual badges
  - All triggers (3-5+) as individual badges
  - Complete notes text
- With multiple check-ins per day over weeks/months:
  - **Massive vertical scrolling** (users could scroll through thousands of pixels)
  - **Difficult to scan** - too much visual noise
  - **Hard to find patterns** - can't see overview at a glance
  - **Poor for doctor reviews** - overwhelming amount of information

**Real-World Scenario:**
- User with chronic condition logs 3 check-ins/day
- Each check-in has 5 symptoms, 4 activities, 3 triggers
- After 1 month: 90 check-ins × 12+ badges each = **1000+ badges on one page**
- Result: **Unusable dashboard**

### Decision: Timeline View with Progressive Disclosure

**Core Principle**: "Best UX irrespective of complexity"

We decided to implement a timeline-based dashboard with smart density control:

#### Key Design Elements

**1. Day Grouping**
- Check-ins grouped by date with headers ("Today", "Yesterday", "Nov 15, 2025")
- Natural chronological organization
- Easy to scan by time period

**2. Compact Default View**
Each timeline entry shows:
- Time (not full date, since grouped by day)
- Top 2-3 symptoms with severity
- Visual severity indicators (colored dots: 🔴 severe, 🟡 moderate, 🟢 mild)
- Smart truncation: "+2 more symptoms", "4 activities · 2 triggers"
- [Details] button

**3. Progressive Disclosure**
- Click [Details] to expand full information
- Two expansion options:
  - **In-place expansion** (mobile-friendly)
  - **Side panel** (desktop, preserves timeline context)
- Expanded view shows:
  - All symptoms with severity bars
  - All activities as tags
  - All triggers as tags
  - Complete notes
  - Edit/Delete/Flag buttons

**4. Visual Severity Encoding**
- Severity represented by color-coded dots
- Users can spot severe symptoms at a glance without reading
- **Red** (7-10 severe) / **Amber** (4-6 moderate) / **Green** (1-3 mild)
- Accessible: includes text values, doesn't rely on color alone

**5. Filter & Search**
- Date range filter (last 7/30/90 days, all time, custom)
- Symptom filter (dynamic list from user's check-ins)
- Severity filter (severe/moderate/mild)
- Full-text search across symptoms, activities, triggers, notes
- "Clear all" to reset

#### Comparison: Before vs After

**Before (Current):**
```
┌────────────────────────────────────────┐
│ Nov 17, 2025, 2:30 PM                  │
│                                        │
│ Symptoms:                              │
│ [Headache: 8] [Fatigue: 7] [Nausea: 6]│
│ [Dizziness: 5] [Brain fog: 4]          │
│                                        │
│ Activities:                            │
│ [Working] [Computer] [Calls] [Reading] │
│ [Exercise] [Cooking]                   │
│                                        │
│ Triggers:                              │
│ [Screen time] [Stress] [Lack of sleep] │
│                                        │
│ Notes: Long notes text here that goes  │
│ on for several lines explaining the    │
│ context and details...                 │
└────────────────────────────────────────┘

... 89 more cards just like this ...
```
**Height:** ~300px per check-in × 90 = **27,000px of scrolling** (75 screens!)

**After (Timeline):**
```
┌──── Today ─────────────────────────────┐
│                                        │
│ 2:30 PM              🔴🔴🟡🟡          │
│ Headache (8) · Fatigue (7)             │
│ + 3 more · 6 activities · 3 triggers   │
│                          [Details]     │
│                                        │
│ 9:15 AM                   🟢🟢        │
│ Mild nausea (3)                        │
│ 2 activities                [Details]  │
└────────────────────────────────────────┘
┌──── Yesterday ─────────────────────────┐
│ ...                                    │
```
**Height:** ~80px per entry × 90 = **7,200px** (20 screens)
- **73% reduction in scrolling**
- Much more scannable
- Severity visible at a glance

### Benefits

**For Users:**
1. **Glanceable** - See severity patterns at a glance (colored dots)
2. **Scannable** - Compact entries, less scrolling
3. **Findable** - Filters and search make finding specific check-ins easy
4. **Flexible** - Progressive disclosure: overview by default, details on demand
5. **Scalable** - Works with 10 check-ins or 1000 check-ins

**For Doctors:**
1. **Quick review** - See severity trends without expanding everything
2. **Pattern recognition** - Easier to spot symptom patterns over time
3. **Exportable** - Filter to specific date ranges or symptoms for reports
4. **Efficient** - Less time scrolling, more time analyzing

**For Development:**
1. **Reusable components** - CompactCheckInCard, ExpandedCheckInCard, FilterBar
2. **Maintainable** - Clear separation of concerns
3. **Testable** - Smaller, focused components
4. **Extensible** - Easy to add more filters, views, export options

### Components Required

**New Components:**
1. `CompactCheckInCard` - Collapsed timeline entry
2. `ExpandedCheckInCard` - Full detail view
3. `SeverityIndicator` - Visual dots/bars for severity
4. `TimelineGroup` - Day grouping container
5. `FilterBar` - Date/symptom/severity/search filters

**Updated Components:**
1. `DashboardPage` - Timeline layout instead of flat list
2. CheckInCard (Issue #21) - Split into Compact/Expanded variants

### Implementation Plan

**Phase 1: Components** (Issues #73-74)
- Build Button, Input, Badge components
- Build SeverityIndicator component
- Build CompactCheckInCard component
- Build ExpandedCheckInCard component

**Phase 2: Filters** (Issue #79)
- Build FilterBar component
- Implement filter logic
- Add search functionality

**Phase 3: Dashboard** (Issue #77)
- Refactor DashboardPage to timeline layout
- Integrate filters
- Add expand/collapse logic
- Add day grouping

### Accessibility Considerations

- **Keyboard navigation**: Tab through entries, Enter to expand, Esc to collapse
- **Screen readers**: Proper ARIA labels, semantic headings
- **Color independence**: Severity dots include text values (not color alone)
- **Focus management**: Focus preserved when expanding/collapsing
- **Mobile**: Touch-friendly tap targets, swipe gestures

### Mobile Considerations

- **Responsive filters**: Stack vertically on small screens
- **Touch targets**: Minimum 44×44px tap areas
- **Swipe gestures**: Swipe left for quick actions (edit/delete)
- **In-place expansion**: No side panels on mobile
- **Performance**: Virtual scrolling for very long lists

### Future Enhancements

- **Calendar view**: Monthly calendar with check-in dots
- **Saved filter presets**: "My severe headaches", "Morning check-ins"
- **Export**: Export filtered check-ins to PDF/CSV for doctors
- **Charts**: Symptom severity trends over time (Wave 3)
- **Multi-select**: Select multiple check-ins for batch operations
- **Notifications**: "You haven't logged today" reminders

### Risks & Mitigation

**Risk**: More complex implementation
- **Mitigation**: Build incrementally, test thoroughly, start with simple version

**Risk**: Users might not discover expand/collapse
- **Mitigation**: Clear "Details" button, onboarding tooltips, help text

**Risk**: Performance with many check-ins
- **Mitigation**: Virtual scrolling, pagination, optimized filters

**Risk**: State management complexity (expand/collapse, filters)
- **Mitigation**: Use established patterns (Zustand/Context), clear state ownership

### Success Metrics

**Quantitative:**
- Reduce vertical scroll distance by >60%
- Page load time <2s with 100 check-ins
- Time to find specific check-in <10s (with filters)

**Qualitative:**
- User feedback: "Easy to scan my history"
- Doctor feedback: "Quick to review patient patterns"
- No complaints about excessive scrolling

### Design System Impact

Added to Design System v1.1.0:
- Severity Indicator Pattern
- Timeline Layout Pattern
- Filter Bar Pattern
- Compact and Expanded card patterns
- Progressive disclosure guidelines

### References

- **Design System**: `docs/DESIGN_SYSTEM.md`
- **GitHub Issues**: #21, #77, #78, #79
- **UX Research**: Healthcare app best practices (Apple Health, MyFitnessPal, Headspace)

---

## Future UX Decisions

As the project evolves, additional UX decisions will be documented here following the same format:
- Context
- Decision
- Rationale
- Implementation details
- Impact
- Success metrics
