# Annie's Journal Redesign Brief

## Design Concept: "Soft Dawn"

The metaphor is the quiet moment of a new morning — gentle, hopeful, unhurried. Every check-in is a small act of self-care, not a clinical task. The design should feel like opening a well-loved journal with a cup of tea, not walking into a doctor's waiting room.

---

## Colour Palette (WCAG AA Compliant)

All colour combinations below meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text/UI components).

### Primary Colours

| Role | Hex Code | Usage |
|------|----------|-------|
| **Warm Cream** | `#FDF8F3` | Main background — warm paper feel, not sterile white |
| **Blush Rose** | `#E8C4B8` | Primary accent, button backgrounds, highlights — warmth and care |
| **Deep Sage** | `#4A6741` | Links, interactive text — accessible green that maintains calm feel |

### Supporting Colours

| Role | Hex Code | Usage |
|------|----------|-------|
| **Deep Walnut** | `#3D3631` | Body text — 11.2:1 contrast on cream |
| **Muted Walnut** | `#6B635C` | Secondary text — 5.6:1 contrast on cream |
| **Deep Terracotta** | `#A65D45` | CTA buttons (with white text) — 4.9:1 contrast |
| **Morning Mist** | `#E5E1EC` | Card backgrounds, dividers, subtle depth |
| **Deep Honey** | `#8B6914` | Warning states, pattern insights — accessible amber |

### Decorative Colours (Non-Text Use Only)

These colours are for decorative elements, icons with labels, or large UI components only — never for essential text:

| Role | Hex Code | Usage |
|------|----------|-------|
| **Soft Sage** | `#B5C4B1` | Decorative accents, backgrounds, borders only |
| **Light Terracotta** | `#C4836A` | Decorative elements, hover states on dark text buttons |
| **Living Coral** | `#E07A5F` | Recording pulse animation (decorative, paired with text label) |
| **Honey** | `#D4A574` | Decorative highlights only |

### Verified Contrast Ratios

| Combination | Ratio | Status |
|-------------|-------|--------|
| Deep Walnut `#3D3631` on Warm Cream `#FDF8F3` | 11.2:1 | ✅ AAA |
| Muted Walnut `#6B635C` on Warm Cream `#FDF8F3` | 5.6:1 | ✅ AA |
| Deep Sage `#4A6741` on Warm Cream `#FDF8F3` | 6.0:1 | ✅ AA |
| Deep Walnut `#3D3631` on Blush Rose `#E8C4B8` | 7.4:1 | ✅ AA |
| White `#FFFFFF` on Deep Terracotta `#A65D45` | 4.9:1 | ✅ AA |
| Deep Walnut `#3D3631` on Morning Mist `#E5E1EC` | 9.2:1 | ✅ AAA |
| Deep Honey `#8B6914` on Warm Cream `#FDF8F3` | 5.2:1 | ✅ AA |

---

## Typography

### Headlines
Use a serif with warmth and personality. Recommended options:
- **Literata** (preferred)
- **Lora**
- **Source Serif Pro**

This gives a journal/book feel rather than tech-startup feel.

### Body Text
Use a humanist sans-serif that's highly readable but not cold:
- **Inter** (preferred)
- **DM Sans**
- **Plus Jakarta Sans**

Avoid geometric fonts like Poppins — too startup-y.

### Optional Accent Font
For small flourishes (taglines, quotes), consider a gentle handwritten style:
- **Caveat**
- **Kalam**

Use very sparingly.

---

## Visual Language & Motifs

### Texture
- Add subtle paper grain or soft noise texture to backgrounds
- Not overwhelming — just enough to feel tactile rather than digital

### Organic Shapes
- Replace sharp rectangles with soft, slightly irregular rounded corners
- Cards and containers should feel hand-drawn, not mechanical
- Rounded corners at **16-24px** instead of sharp 4px
- Subtle blob shapes as decorative elements
- Soft shadows that feel like natural light, not harsh drop shadows

### Illustration Style (if used)
- Soft, muted watercolour or gouache aesthetic
- Gentle line drawings with imperfect strokes
- Avoid generic "flat illustration with blob people"
- Subject ideas: morning light through curtains, journal with pen, cup of tea, gentle botanicals (eucalyptus, lavender), soft clouds

---

## Component Specifications

### Buttons

**Primary Button (Blush Rose)**
- Background: `#E8C4B8`
- Text: `#3D3631` (Deep Walnut) — 7.4:1 contrast ✅
- Padding: generous (feels clickable, not cramped)
- Border radius: 12-16px
- Shadow: soft, subtle underneath
- Hover: slightly warmer tone, gentle lift effect

**CTA Button (Deep Terracotta)**
- Background: `#A65D45`
- Text: `#FFFFFF` (White) — 4.9:1 contrast ✅
- Use for main conversion actions
- Hover: darken slightly to `#954F3A`

### Cards
- Background: `#FFFFFF` or `#E5E1EC` (Morning Mist)
- Border radius: **20-24px** (large, soft)
- Shadow: very subtle (think: paper lifted slightly off desk)
- No harsh borders

### Voice Recording Button
- Should feel inviting, not intimidating
- Soft pulse animation in Living Coral (`#E07A5F`) when ready
- Warm glow rather than harsh ring
- Gentle "breathing" animation (subtle scale pulse) to invite users to speak
- **Accessibility note:** Living Coral is decorative only — always pair with a text label like "Recording" in Deep Walnut for accessibility

---

## Page Structure Recommendations

### Hero Section
- Background: Soft gradient from `#FDF8F3` to `#F5EBE6` (warm cream to gentle blush)
- More conversational, less "marketing copy"
- Suggested opening copy:
  > *"Some days are harder to explain than others."*
  > Annie's Journal listens when you need to talk through how you're feeling — no forms, no fuss. Just your voice.

### Problem Section
- Avoid identical three-card grid layout (too SaaS-y)
- Use flowing, conversational prose instead
- Example approach:
  > *"You know the feeling. You walk into the appointment you've been waiting weeks for, and suddenly your mind goes blank. When did that symptom start? Was it getting better or worse? What were you doing when it happened?"*

### Personal Touch Section
Include the origin story:
> *"Built for Annie, shared with you"*
> This started as a way to help one person track their health journey. Now it's yours too.

---

## Quick Reference (WCAG AA Verified)

| Element | Colour | Hex | Notes |
|---------|--------|-----|-------|
| Page background | Warm Cream | `#FDF8F3` | |
| Card background (light) | White | `#FFFFFF` | |
| Card background (alt) | Morning Mist | `#E5E1EC` | |
| Primary button bg | Blush Rose | `#E8C4B8` | Use Deep Walnut text |
| Primary button text | Deep Walnut | `#3D3631` | 7.4:1 on Blush Rose ✅ |
| CTA button bg | Deep Terracotta | `#A65D45` | Use white text |
| CTA button text | White | `#FFFFFF` | 4.9:1 on Deep Terracotta ✅ |
| Body text | Deep Walnut | `#3D3631` | 11.2:1 on cream ✅ |
| Secondary text | Muted Walnut | `#6B635C` | 5.6:1 on cream ✅ |
| Links | Deep Sage | `#4A6741` | 6.0:1 on cream ✅ |
| Recording active | Living Coral | `#E07A5F` | Decorative only, pair with label |
| Success states | Deep Sage | `#4A6741` | |
| Attention/insights | Deep Honey | `#8B6914` | 5.2:1 on cream ✅ |
| Gradient end | Gentle Blush | `#F5EBE6` | |
| Decorative accents | Soft Sage | `#B5C4B1` | Non-text use only |
| Decorative accents | Honey | `#D4A574` | Non-text use only |

---

## What to Avoid

- **Clinical blues** — feels like NHS, insurance, hospitals
- **Pure white (`#FFFFFF`) backgrounds** — cold, sterile (use warm cream instead)
- **Geometric sans-serif fonts** — too techy
- **Stock photography of happy people** — generic and dishonest
- **Gradient buttons trending to purple** — every AI app looks like this
- **"AI-powered" as a selling point** — people want help, not technology
- **Excessive iconography** — the words are enough
- **Sharp 4px corners** — too corporate
- **Heavy drop shadows** — feels dated

---

## Design Philosophy

This palette and approach should make Annie's Journal feel like what it is: something made with love for someone real, now offered to help others on their own difficult journeys. Warm, honest, and quietly confident.

The goal is to feel like a trusted companion, not a medical tool or a startup product.
