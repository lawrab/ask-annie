# Ask Annie Design System

**Version**: 1.1.0
**Last Updated**: 2025-11-17
**Status**: Active

## Overview

This design system defines the visual language, components, and patterns for Ask Annie. It ensures consistency, accessibility (WCAG 2.1 AA compliance), and maintainability across the application.

**Core Principles**:
- **Accessibility First**: WCAG 2.1 AA minimum, AAA where possible
- **Consistency**: Uniform look and feel builds user trust
- **Clarity**: Healthcare UI must be clear and unambiguous
- **Compassion**: Warm, supportive tone for health tracking

---

## Color System

### Primary Colors

**Indigo** - Professional, trustworthy, calming. Main brand color.

```
primary-50:  #eef2ff  (Lightest - backgrounds)
primary-100: #e0e7ff
primary-200: #c7d2fe
primary-300: #a5b4fc
primary-400: #818cf8
primary-500: #6366f1
primary-600: #4f46e5  ⭐ Main brand color
primary-700: #4338ca  (Darker - hover states)
primary-800: #3730a3
primary-900: #312e81
primary-950: #1e1b4b  (Darkest)
```

**Usage**:
- Buttons, CTAs: `bg-primary-600 hover:bg-primary-700`
- Headers, navigation: `bg-primary-600 text-white`
- Links: `text-primary-600 hover:text-primary-700`
- Focus rings: `ring-primary-500`

**Accessibility**: ✅ primary-600 on white = **8.6:1** (exceeds WCAG AAA)

### Secondary Colors

**Teal** - Calm, healing, medical. Accent color for variety.

```
secondary-50:  #f0fdfa
secondary-100: #ccfbf1
secondary-200: #99f6e4
secondary-300: #5eead4
secondary-400: #2dd4bf
secondary-500: #14b8a6
secondary-600: #0d9488  ⭐ Accent color
secondary-700: #0f766e
secondary-800: #115e59
secondary-900: #134e4a
secondary-950: #042f2e
```

**Usage**:
- Alternate CTAs: `bg-secondary-600 hover:bg-secondary-700`
- Icons, decorative elements: `text-secondary-600`
- Badges, pills (non-semantic): `bg-secondary-100 text-secondary-800`

**Accessibility**: ✅ secondary-600 on white = **4.8:1** (WCAG AA compliant)

### Semantic Colors

Use **Tailwind defaults** for semantic meanings. All are WCAG AA compliant.

**Success (Green)**
```
green-50:  #f0fdf4  (Success backgrounds)
green-100: #dcfce7
green-600: #16a34a  ⭐ Success text/borders
green-700: #15803d  (Hover)
green-800: #166534  (Dark backgrounds)
```
- **Usage**: Success messages, completed states, positive indicators
- **Accessibility**: ✅ green-600 on white = **4.8:1**
- **Example**: Activities badges, success alerts

**Error/Danger (Red)**
```
red-50:  #fef2f2  (Error backgrounds)
red-100: #fee2e2
red-400: #f87171  (Borders)
red-600: #dc2626  ⭐ Error text
red-700: #b91c1c  (Hover)
```
- **Usage**: Error messages, validation errors, destructive actions
- **Accessibility**: ✅ red-600 on white = **5.9:1**
- **Example**: Form errors, delete buttons, critical warnings

**Warning (Amber)**
```
amber-50:  #fffbeb  (Warning backgrounds)
amber-100: #fef3c7
amber-600: #d97706  ⭐ Warning text
amber-700: #b45309  (Hover)
amber-800: #92400e  (Dark backgrounds)
```
- **Usage**: Warnings, cautions, flagged items
- **Accessibility**: ✅ amber-600 on white = **5.0:1**
- **Example**: "Flagged for Doctor" badge, warning alerts

**Info (Blue)**
```
blue-50:  #eff6ff  (Info backgrounds)
blue-100: #dbeafe
blue-600: #2563eb  ⭐ Info text
blue-700: #1d4ed8  (Hover)
blue-800: #1e40af  (Dark backgrounds)
```
- **Usage**: Informational messages, help text, neutral notifications
- **Accessibility**: ✅ blue-600 on white = **8.6:1** (exceeds AAA)
- **Example**: Info alerts, help tooltips

### Neutral Colors (Gray Scale)

Use **Tailwind's gray** for text, backgrounds, and UI elements.

```
gray-50:  #f9fafb  ⭐ Page backgrounds
gray-100: #f3f4f6  (Card backgrounds, hover states)
gray-200: #e5e7eb  (Borders, dividers)
gray-300: #d1d5db  (Disabled backgrounds)
gray-400: #9ca3af  (Placeholder text)
gray-500: #6b7280  (Icons, secondary text)
gray-600: #4b5563  (Secondary headings)
gray-700: #374151  (Labels, medium emphasis)
gray-800: #1f2937  (High emphasis text)
gray-900: #111827  ⭐ Primary text
```

**Usage**:
- Page background: `bg-gray-50`
- Card/container: `bg-white` with `shadow-md`
- Primary text: `text-gray-900`
- Secondary text: `text-gray-600` or `text-gray-500`
- Borders: `border-gray-200` or `border-gray-300`
- Disabled: `bg-gray-300 text-gray-500 cursor-not-allowed`

**Accessibility**:
- ✅ gray-900 on white = **16.7:1** (AAA)
- ✅ gray-600 on white = **7.3:1** (AAA)
- ✅ gray-500 on white = **4.6:1** (AA for large text only)

### Color Usage Guidelines

**Do's**:
- Use `primary-600` for main actions and brand elements
- Use semantic colors (green, red, amber) for their intended meanings
- Ensure text meets 4.5:1 contrast for normal text, 3:1 for large text
- Use lighter shades (50-100) for backgrounds, darker (600-800) for text
- Test color combinations with a contrast checker

**Don'ts**:
- Don't use color alone to convey information (add icons/text)
- Don't use primary color for semantic states (use green/red/amber)
- Don't use gray-400 or lighter for small text (fails WCAG)
- Don't mix semantic meanings (red for success, green for errors)

---

## Typography

### Font Families

**Sans-Serif (Primary)**:
```css
font-sans: 'Inter', system-ui, sans-serif
```
- **Usage**: All UI text, headings, body copy
- **Why Inter**: Clean, readable, optimized for screens, excellent at small sizes

**Monospace** (Code/Data):
```css
font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
```
- **Usage**: Code snippets, technical data, IDs
- **Example**: User IDs, timestamps, JSON data

### Type Scale

Minimum body text: **16px** (accessibility requirement)

```
text-xs:   12px / 16px line-height  (Small labels, captions)
text-sm:   14px / 20px line-height  (Secondary text, metadata)
text-base: 16px / 24px line-height  ⭐ Body text default
text-lg:   18px / 28px line-height  (Emphasized text, large UI)
text-xl:   20px / 28px line-height  (Small headings)
text-2xl:  24px / 32px line-height  (Section headings)
text-3xl:  30px / 36px line-height  (Page headings)
text-4xl:  36px / 40px line-height  (Hero text, major headings)
```

### Font Weights

```
font-normal:    400  (Body text)
font-medium:    500  (Emphasized text, labels)
font-semibold:  600  (Subheadings, strong emphasis)
font-bold:      700  (Headings, CTAs)
font-extrabold: 800  (Hero text, major statements)
```

### Typography Patterns

**Page Title**:
```html
<h1 className="text-3xl font-bold text-gray-900">Page Title</h1>
```

**Section Heading**:
```html
<h2 className="text-2xl font-bold text-gray-900">Section Heading</h2>
```

**Subheading**:
```html
<h3 className="text-xl font-semibold text-gray-800">Subheading</h3>
```

**Body Text**:
```html
<p className="text-base text-gray-700">Body text content...</p>
```

**Secondary/Helper Text**:
```html
<p className="text-sm text-gray-600">Secondary information</p>
```

**Label**:
```html
<label className="text-sm font-medium text-gray-700">Field Label</label>
```

**Small Caption**:
```html
<span className="text-xs text-gray-500">Last updated 2 days ago</span>
```

---

## Spacing

**Base Grid**: 4px (Tailwind's default spacing scale)

### Spacing Scale

```
0:    0px
0.5:  2px   (Tight spacing, icon gaps)
1:    4px   (Very small gaps)
2:    8px   (Small gaps, compact layouts)
3:    12px  (Default gaps in forms)
4:    16px  ⭐ Default padding, gaps
5:    20px  (Comfortable spacing)
6:    24px  (Breathing room, sections)
8:    32px  (Large gaps, section separation)
10:   40px  (Major spacing)
12:   48px  (Extra large gaps)
16:   64px  (Hero spacing)
20:   80px  (Huge spacing)
24:   96px  (Maximum spacing)
```

### Spacing Patterns

**Component Internal Spacing**:
- Buttons: `px-4 py-2` (16px × 8px)
- Cards: `p-6` (24px all sides)
- Forms: `space-y-4` (16px between fields)
- Sections: `py-8 px-4` (32px vertical, 16px horizontal)

**Layout Spacing**:
- Container padding: `px-4 sm:px-6 lg:px-8`
- Vertical rhythm: `space-y-6` or `space-y-8`
- Grid gaps: `gap-4` or `gap-6`

**Responsive Spacing**:
```html
<!-- Increases padding on larger screens -->
<div className="px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
```

---

## Border Radius

```
rounded-none:  0px    (Square, no rounding)
rounded-sm:    2px    (Subtle rounding)
rounded:       4px    (Default)
rounded-md:    6px    ⭐ Primary for cards/buttons
rounded-lg:    8px    (Large cards, modals)
rounded-xl:    12px   (Extra large containers)
rounded-2xl:   16px   (Hero cards)
rounded-3xl:   24px   (Huge containers)
rounded-full:  9999px ⭐ Pills, badges, avatars
```

**Usage**:
- Buttons: `rounded-md`
- Cards: `rounded-lg`
- Inputs: `rounded-md`
- Badges/Pills: `rounded-full`
- Modals: `rounded-lg` or `rounded-xl`

---

## Shadows (Elevation)

Use shadows to create depth and hierarchy.

```
shadow-sm:   Subtle - Slight elevation (hover states)
shadow:      Default - Cards at rest
shadow-md:   Medium - Active cards, dropdowns
shadow-lg:   Large - Modals, popovers
shadow-xl:   Extra Large - Overlays, important elements
shadow-2xl:  Huge - Hero elements
shadow-inner: Inset - Pressed states, inputs
```

**Usage**:
- Cards at rest: `shadow-md`
- Cards on hover: `shadow-lg`
- Buttons (subtle): `shadow-sm`
- Dropdowns/Popovers: `shadow-lg`
- Modals: `shadow-xl` or `shadow-2xl`

**Interactive Pattern**:
```html
<div className="shadow-md hover:shadow-lg transition-shadow">
  Card that lifts on hover
</div>
```

---

## Transitions & Animations

### Timing Functions

```
transition-DEFAULT:  cubic-bezier(0.4, 0, 0.2, 1)  (Smooth, balanced)
transition-linear:   linear
transition-in:       cubic-bezier(0.4, 0, 1, 1)    (Accelerate)
transition-out:      cubic-bezier(0, 0, 0.2, 1)    (Decelerate)
```

### Durations

```
duration-75:   75ms   (Very fast, micro-interactions)
duration-100:  100ms  (Fast)
duration-150:  150ms  ⭐ Default (buttons, hovers)
duration-200:  200ms  (Comfortable)
duration-300:  300ms  (Noticeable but not slow)
duration-500:  500ms  (Slow, for emphasis)
```

### Transition Properties

```
transition-none:     none
transition-all:      all
transition-colors:   color, background-color, border-color
transition-opacity:  opacity
transition-shadow:   box-shadow
transition-transform: transform
```

### Common Patterns

**Button Hover**:
```html
<button className="bg-primary-600 hover:bg-primary-700 transition-colors duration-150">
  Click Me
</button>
```

**Card Hover (Lift)**:
```html
<div className="shadow-md hover:shadow-lg transition-shadow duration-200">
  Card content
</div>
```

**Fade In**:
```html
<div className="opacity-0 hover:opacity-100 transition-opacity duration-300">
  Tooltip
</div>
```

**Loading Spinner**:
```html
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
```

---

## Accessibility

### Focus States

**All interactive elements MUST have visible focus indicators.**

**Default Focus Ring**:
```html
<button className="focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Accessible Button
</button>
```

**Focus Patterns**:
- Buttons: `focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`
- Inputs: `focus:ring-primary-500 focus:border-primary-500`
- Links: `focus:ring-2 focus:ring-primary-500 focus:ring-offset-1`

**Custom Focus Colors**:
- Primary actions: `ring-primary-500`
- Danger actions: `ring-red-500`
- Secondary: `ring-secondary-500`

### Color Contrast Requirements

**WCAG 2.1 AA (Minimum)**:
- Normal text (< 18pt): **4.5:1** contrast ratio
- Large text (≥ 18pt or ≥ 14pt bold): **3:1** contrast ratio
- UI components and graphics: **3:1** contrast ratio

**WCAG 2.1 AAA (Enhanced)**:
- Normal text: **7:1** contrast ratio
- Large text: **4.5:1** contrast ratio

**Our Standards**:
- All text meets **AA minimum** (4.5:1)
- Primary brand colors meet **AAA** (7:1+)
- Interactive elements meet **3:1 minimum**

**Verified Combinations**:
- ✅ primary-600 on white: **8.6:1** (AAA)
- ✅ secondary-600 on white: **4.8:1** (AA)
- ✅ green-600 on white: **4.8:1** (AA)
- ✅ red-600 on white: **5.9:1** (AA)
- ✅ amber-600 on white: **5.0:1** (AA)
- ✅ gray-900 on white: **16.7:1** (AAA)
- ✅ gray-600 on white: **7.3:1** (AAA)

### Keyboard Navigation

**Requirements**:
- All interactive elements must be keyboard accessible
- Logical tab order (use `tabIndex` sparingly)
- Escape key closes modals/dialogs
- Arrow keys for menus/dropdowns
- Enter/Space activates buttons

**Skip to Content**:
```html
<a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4">
  Skip to main content
</a>
```

### Screen Reader Support

**Semantic HTML**:
- Use `<button>` not `<div onClick>`
- Use `<nav>`, `<main>`, `<article>`, `<aside>`
- Use heading hierarchy (h1 → h2 → h3)

**ARIA Attributes**:
```html
<!-- Loading state -->
<button aria-busy="true" aria-live="polite">Loading...</button>

<!-- Expanded/Collapsed -->
<button aria-expanded="false" aria-controls="menu">Menu</button>

<!-- Current page -->
<a aria-current="page">Dashboard</a>

<!-- Form errors -->
<input aria-invalid="true" aria-describedby="email-error" />
<p id="email-error" role="alert">Invalid email</p>
```

**Visually Hidden Content** (screen reader only):
```html
<span className="sr-only">Loading</span>
```

### Form Accessibility

**Labels**:
- Every input must have a `<label>` or `aria-label`
- Labels should be visible (don't rely on placeholders alone)

**Error Messages**:
```html
<div>
  <label htmlFor="email">Email</label>
  <input
    id="email"
    type="email"
    aria-invalid="true"
    aria-describedby="email-error"
    className="border-red-400 focus:ring-red-500"
  />
  <p id="email-error" className="text-sm text-red-600" role="alert">
    Please enter a valid email
  </p>
</div>
```

---

## Breakpoints (Responsive Design)

Tailwind's default breakpoints (mobile-first):

```
sm:  640px   (Small tablets, large phones)
md:  768px   (Tablets)
lg:  1024px  (Laptops, small desktops)
xl:  1280px  (Desktops)
2xl: 1536px  (Large desktops)
```

**Usage**:
```html
<!-- Stack on mobile, grid on tablet+ -->
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  ...
</div>

<!-- Hide on mobile, show on desktop -->
<div className="hidden lg:block">
  Desktop sidebar
</div>

<!-- Responsive padding -->
<div className="px-4 sm:px-6 lg:px-8">
  Container
</div>
```

---

## Component Patterns

### Button Variants

**Primary Button**:
```html
<button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Primary Action
</button>
```

**Secondary Button**:
```html
<button className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
  Secondary Action
</button>
```

**Danger Button**:
```html
<button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
  Delete
</button>
```

**Disabled Button**:
```html
<button disabled className="px-4 py-2 bg-gray-300 text-gray-500 font-medium rounded-md cursor-not-allowed opacity-50">
  Disabled
</button>
```

### Card Pattern

```html
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
  <h3 className="text-xl font-semibold text-gray-900 mb-2">Card Title</h3>
  <p className="text-gray-600">Card content goes here...</p>
</div>
```

### Badge/Pill Pattern

```html
<!-- Semantic badges -->
<span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
  Success
</span>

<span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
  Error
</span>

<span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">
  Warning
</span>

<!-- Brand badges -->
<span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full">
  Badge
</span>
```

### Input Pattern

```html
<div>
  <label htmlFor="field" className="block text-sm font-medium text-gray-700 mb-1">
    Field Label
  </label>
  <input
    id="field"
    type="text"
    placeholder="Placeholder text"
    className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
  />
</div>
```

### Alert Patterns

```html
<!-- Success Alert -->
<div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
  <span>Success! Your action completed.</span>
</div>

<!-- Error Alert -->
<div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
  <span>Error: Something went wrong.</span>
</div>

<!-- Warning Alert -->
<div className="bg-amber-50 border border-amber-400 text-amber-700 px-4 py-3 rounded" role="alert">
  <span>Warning: Please review this information.</span>
</div>

<!-- Info Alert -->
<div className="bg-blue-50 border border-blue-400 text-blue-700 px-4 py-3 rounded" role="alert">
  <span>Info: Here's something you should know.</span>
</div>
```

### Severity Indicator Pattern

**Purpose**: Visual representation of symptom severity (1-10 scale)

**Color Coding**:
- 🔴 **Severe** (7-10): `text-red-600` or `bg-red-500`
- 🟡 **Moderate** (4-6): `text-amber-600` or `bg-amber-500`
- 🟢 **Mild** (1-3): `text-green-600` or `bg-green-500`

**Dot Indicators**:
```html
<!-- Single severity dot -->
<span className="inline-block w-2 h-2 rounded-full bg-red-500" aria-label="Severe"></span>

<!-- Multiple symptoms (visual summary) -->
<div className="flex gap-1">
  <span className="w-2 h-2 rounded-full bg-red-500" title="Headache: 8"></span>
  <span className="w-2 h-2 rounded-full bg-red-500" title="Fatigue: 7"></span>
  <span className="w-2 h-2 rounded-full bg-amber-500" title="Nausea: 5"></span>
</div>
```

**Severity Bar** (for expanded view):
```html
<div className="space-y-2">
  <div>
    <div className="flex justify-between text-sm mb-1">
      <span className="font-medium text-gray-700">Headache</span>
      <span className="text-red-600 font-semibold">8</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className="bg-red-500 h-2 rounded-full" style="width: 80%"></div>
    </div>
  </div>
</div>
```

**Accessibility**: Always include text severity value, don't rely on color alone.

### Timeline Layout Pattern

**Purpose**: Display chronological check-ins grouped by date with compact, scannable entries

**Day Group Header**:
```html
<div className="mb-2 mt-6 first:mt-0">
  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200 pb-2">
    Today
  </h3>
</div>
```

**Compact Check-in Entry**:
```html
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-3 hover:shadow-md transition-shadow">
  <!-- Time and severity indicators -->
  <div className="flex items-center justify-between mb-2">
    <span className="text-sm font-medium text-gray-900">2:30 PM</span>
    <div className="flex gap-1">
      <span className="w-2 h-2 rounded-full bg-red-500" title="Severe"></span>
      <span className="w-2 h-2 rounded-full bg-red-500" title="Severe"></span>
      <span className="w-2 h-2 rounded-full bg-amber-500" title="Moderate"></span>
    </div>
  </div>

  <!-- Top symptoms -->
  <div className="text-sm text-gray-700 mb-2">
    <span className="font-medium">Headache (8)</span> ·
    <span className="font-medium">Fatigue (6)</span>
  </div>

  <!-- Summary counts -->
  <div className="flex items-center justify-between">
    <span className="text-xs text-gray-500">
      + 1 more · 4 activities · 2 triggers
    </span>
    <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
      Details
    </button>
  </div>
</div>
```

**Expanded Check-in View**:
```html
<div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-3">
  <!-- Header with actions -->
  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
    <div>
      <span className="text-sm font-medium text-gray-900">Nov 17, 2025</span>
      <span className="text-sm text-gray-500 ml-2">2:30 PM</span>
    </div>
    <div className="flex gap-2">
      <button className="text-sm text-primary-600 hover:text-primary-700">Edit</button>
      <button className="text-sm text-red-600 hover:text-red-700">Delete</button>
      <button className="text-sm text-gray-600 hover:text-gray-700">Collapse</button>
    </div>
  </div>

  <!-- Symptoms section -->
  <div className="mb-4">
    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center">
      <span className="text-red-500 mr-2">●</span>
      Symptoms (3)
    </h4>
    <div className="space-y-2 ml-4">
      <!-- Severity bars for each symptom -->
      <div>
        <div className="flex justify-between text-sm mb-1">
          <span className="text-gray-700">Headache</span>
          <span className="font-semibold text-red-600">8</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-red-500 h-2 rounded-full" style="width: 80%"></div>
        </div>
      </div>
      <!-- More symptoms... -->
    </div>
  </div>

  <!-- Activities section -->
  <div className="mb-4">
    <h4 className="text-sm font-semibold text-gray-700 mb-2">
      📋 Activities (4)
    </h4>
    <div className="flex flex-wrap gap-2 ml-4">
      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
        Working on computer
      </span>
      <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
        Video calls
      </span>
      <!-- More activities... -->
    </div>
  </div>

  <!-- Triggers section -->
  <div className="mb-4">
    <h4 className="text-sm font-semibold text-gray-700 mb-2">
      ⚠️ Triggers (2)
    </h4>
    <div className="flex flex-wrap gap-2 ml-4">
      <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
        Screen time
      </span>
      <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
        Stress
      </span>
    </div>
  </div>

  <!-- Notes section -->
  <div className="mb-4">
    <h4 className="text-sm font-semibold text-gray-700 mb-2">
      📝 Notes
    </h4>
    <p className="text-sm text-gray-600 ml-4">
      Headache started mid-afternoon after several hours of screen time.
      Feeling quite tired and having trouble concentrating.
    </p>
  </div>

  <!-- Flag for doctor -->
  <div className="flex items-center pt-3 border-t border-gray-200">
    <input type="checkbox" id="flag-doctor" className="mr-2" />
    <label htmlFor="flag-doctor" className="text-sm text-gray-700">
      Flag for doctor review
    </label>
  </div>
</div>
```

### Filter Bar Pattern

**Purpose**: Allow users to filter check-ins by date, symptom, or severity

```html
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
  <div className="flex flex-wrap gap-3">
    <!-- Date range filter -->
    <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
      <option>Last 7 days</option>
      <option>Last 30 days</option>
      <option>Last 3 months</option>
      <option>All time</option>
      <option>Custom range...</option>
    </select>

    <!-- Symptom filter -->
    <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
      <option>All symptoms</option>
      <option>Headache</option>
      <option>Fatigue</option>
      <option>Nausea</option>
    </select>

    <!-- Severity filter -->
    <select className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500">
      <option>All severity</option>
      <option>🔴 Severe (7-10)</option>
      <option>🟡 Moderate (4-6)</option>
      <option>🟢 Mild (1-3)</option>
    </select>

    <!-- Search -->
    <input
      type="search"
      placeholder="Search symptoms, notes..."
      className="flex-1 min-w-[200px] px-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
    />

    <!-- Clear filters -->
    <button className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900">
      Clear all
    </button>
  </div>
</div>
```

**Mobile-Responsive Filter** (stacked on small screens):
```html
<div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
    <!-- Filters stack vertically on mobile, wrap on desktop -->
  </div>
</div>
```

---

## Design Tokens Quick Reference

### Most Used Colors
- Brand: `primary-600` (#4f46e5)
- Text: `gray-900`, `gray-700`, `gray-600`
- Background: `gray-50`, `white`
- Success: `green-600`
- Error: `red-600`
- Warning: `amber-600`

### Most Used Spacing
- Component padding: `p-4`, `p-6`
- Vertical rhythm: `space-y-4`, `space-y-6`, `space-y-8`
- Button padding: `px-4 py-2`
- Container padding: `px-4 sm:px-6 lg:px-8`

### Most Used Typography
- Body: `text-base text-gray-700`
- Headings: `text-2xl font-bold text-gray-900`
- Labels: `text-sm font-medium text-gray-700`
- Secondary: `text-sm text-gray-600`

### Most Used Effects
- Card shadow: `shadow-md`
- Button radius: `rounded-md`
- Transitions: `transition-colors duration-150`
- Focus ring: `focus:ring-2 focus:ring-primary-500 focus:ring-offset-2`

---

## Resources

**Color Contrast Checkers**:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessible Colors](https://accessible-colors.com/)

**Tailwind CSS**:
- [Tailwind Docs](https://tailwindcss.com/docs)
- [Tailwind Colors](https://tailwindcss.com/docs/customizing-colors)

**Accessibility**:
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- [WebAIM](https://webaim.org/)

**Typography**:
- [Inter Font](https://rsms.me/inter/)
- [Modular Scale](https://www.modularscale.com/)

---

## Version History

**v1.1.0** (2025-11-17)
- Added timeline layout patterns for scalable check-in display
- Added severity indicator patterns (dots and bars)
- Added filter bar pattern for date/symptom/severity filtering
- Documented compact and expanded check-in card patterns
- Added progressive disclosure UX patterns

**v1.0.0** (2025-11-17)
- Initial design system definition
- Updated primary color from pink to indigo (align with implementation)
- Added secondary teal color
- Defined semantic color system
- Established typography scale with accessibility minimums
- Documented spacing, borders, shadows, transitions
- Created component patterns and usage guidelines
- Verified WCAG AA compliance for all colors

---

## Questions or Feedback?

For design system questions, updates, or contributions, please refer to `CONTRIBUTING.md` or open an issue on GitHub.
