

# 1. Design System Overview

## Visual Identity

A **modern, friendly, and healthcare-focused consumer mobile experience**.

### Visual Vibe
- Soft minimalism
- Bright and optimistic
- Rounded and approachable UI
- Clean medical aesthetic
- High readability

### Tone
- Trustworthy
- Professional but warm
- Consumer healthcare
- Confidence-driven

### Core UI Principles

1. Generous white space
2. Clear visual hierarchy
3. Large, readable typography
4. Strong primary CTA emphasis
5. Rounded surfaces
6. Card-based layout structure
7. Soft elevation
8. Human-centric visuals

---

# 2. Foundations

---

## 2.1 Color System (Light Mode)

### Core Palette

| Token | HEX | Usage |
|--------|------|--------|
| color.primary.500 | #3D90FD | Primary CTA, active tabs |
| color.primary.600 | #2F7AE5 | Button pressed state (Assumption) |
| color.accent.500 | #A0EEF1 | Soft highlight backgrounds |
| color.neutral.0 | #FFFFFF | App background |
| color.neutral.50 | #F2F3F5 | Secondary surfaces |
| color.neutral.100 | #E5E7EB | Dividers |
| color.neutral.700 | #4A5568 | Secondary text |
| color.neutral.900 | #021121 | Primary text |

---

### Status Colors (Industry Standard Assumption)

| Token | HEX | Usage |
|--------|------|--------|
| color.success.500 | #22C55E | Success states |
| color.warning.500 | #F59E0B | Warning |
| color.error.500 | #EF4444 | Error |
| color.info.500 | #3B82F6 | Informational |

---

## 2.2 Typography System

### Font Family

Primary: **Lexend Deca**  
Fallback: Inter, SF Pro Display, System UI

---

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|--------|------|--------|-------------|--------|
| font.h1 | 32px | 600 | 40px | Main headline |
| font.h2 | 24px | 600 | 32px | Section headers |
| font.h3 | 20px | 600 | 28px | Card titles |
| font.body.lg | 16px | 400 | 24px | Primary body |
| font.body.md | 14px | 400 | 20px | Secondary text |
| font.caption | 12px | 400 | 16px | Metadata |
| font.button | 16px | 600 | 24px | Buttons |

Letter Spacing:
- Headlines: -0.5px
- Body: 0px

---

## 2.3 Spacing System

8pt grid system.

| Token | Value | Usage |
|--------|--------|--------|
| spacing.1 | 4px | Micro spacing |
| spacing.2 | 8px | Tight spacing |
| spacing.3 | 12px | Compact spacing |
| spacing.4 | 16px | Default padding |
| spacing.5 | 20px | Card padding |
| spacing.6 | 24px | Section spacing |
| spacing.8 | 32px | Large spacing |
| spacing.10 | 40px | Hero spacing |

---

## 2.4 Grid & Layout

### Mobile Grid

- 4-column layout
- 16px horizontal margin
- 8px gutters
- Full-width card components

### Breakpoints (Standard)

| Device | Width |
|--------|--------|
| Mobile | 0–767px |
| Tablet | 768–1023px |
| Desktop | 1024px+ |

---

## 2.5 Radius System

Rounded design language.

| Token | Value | Usage |
|--------|--------|--------|
| radius.sm | 8px | Chips |
| radius.md | 12px | Inputs |
| radius.lg | 16px | Cards |
| radius.xl | 20px | Buttons |
| radius.full | 999px | Pills / Tabs |

---

## 2.6 Elevation / Shadow System

Soft depth only.

| Token | Shadow Value | Usage |
|--------|--------------|--------|
| shadow.card | 0 4px 12px rgba(0,0,0,0.08) | Cards |
| shadow.modal | 0 12px 24px rgba(0,0,0,0.12) | Dialogs |
| shadow.sticky | 0 -4px 12px rgba(0,0,0,0.08) | Bottom nav |

---

## 2.7 Iconography

- Rounded outline style
- 24px base grid
- ~1.5px stroke weight
- Filled variant for active state
- Consistent padding inside containers

---

## 2.8 Motion System

Subtle and smooth.

### Duration Tokens

| Token | Value |
|--------|--------|
| motion.fast | 150ms |
| motion.normal | 250ms |
| motion.slow | 350ms |

### Easing

```css
ease.standard: cubic-bezier(0.4, 0, 0.2, 1);
ease.emphasized: cubic-bezier(0.2, 0.8, 0.2, 1);
````

---

# 3. Components Library

---

## Component: Button

### Description

Primary interaction trigger.

### Variants

* Primary
* Secondary (outline/ghost)
* Text

### Sizes

| Size   | Height | Padding |
| ------ | ------ | ------- |
| Medium | 48px   | 16px    |
| Large  | 56px   | 20px    |

### States

* Default
* Pressed
* Disabled

### Tokens Used

* color.primary.500
* radius.xl
* font.button
* spacing.4

---

## Component: Card

### Description

Container for dentist profile and service information.

### Anatomy

* Image
* Title
* Subtitle
* Metadata chips
* CTA

### Style

* radius.lg
* shadow.card
* spacing.5 internal padding

---

## Component: Tabs (Service Selector)

### Variants

* Active (primary filled)
* Inactive (neutral background)

Height: 36px
Radius: radius.full

---

## Component: Search Bar

### Anatomy

* Left icon
* Placeholder text
* Rounded container

Height: 44px
Radius: radius.full
Background: color.neutral.50

---

## Component: Bottom Navigation

### Items

* Home
* Chat
* Booking
* Profile

### Behavior

* Active: color.primary.500
* Inactive: color.neutral.700

Height: 72px
Shadow: shadow.sticky

---

## Component: Chip / Badge

Used for:

* Location
* Reviews
* Category tags

Height: 28px
Radius: radius.full

---

# 4. Token Naming Convention

Structure:

```
category.role.scale.state
```

Examples:

* color.primary.500
* spacing.4
* radius.lg
* font.h1
* shadow.card
* button.primary.bg.default

---

# 5. Accessibility Standards

## Contrast

* Minimum WCAG AA (4.5:1 for body text)
* Large text minimum 3:1

## Focus Ring

```css
outline: 2px solid #3D90FD;
outline-offset: 2px;
```

## Tap Target

Minimum: 44x44px

## Error Pattern

* Red border
* Helper text below input
* Clear actionable message

---

# 6. UX Writing Guidelines

### Tone

* Clear
* Friendly
* Direct
* Encouraging

### Button Labels

✔ Get Started
✔ Book Now
✔ Continue

Avoid vague labels like "Submit".

### Error Messages

Short and helpful:
"Please enter a valid phone number."

### Empty States

Friendly + actionable:
"No appointments yet. Book your first visit."

### Confirmation Dialogs

Primary action clearly highlighted.
Destructive actions use error color.

---

# 7. Implementation Examples

---

## CSS Variables

```css
:root {
  --color-primary: #3D90FD;
  --color-accent: #A0EEF1;
  --color-text-primary: #021121;
  --radius-lg: 16px;
  --spacing-4: 16px;
}
```

---

## JSON Tokens

```json
{
  "color": {
    "primary": { "500": "#3D90FD" },
    "accent": { "500": "#A0EEF1" },
    "neutral": {
      "0": "#FFFFFF",
      "900": "#021121"
    }
  },
  "radius": {
    "lg": "16px",
    "xl": "20px"
  },
  "spacing": {
    "4": "16px",
    "6": "24px"
  }
}
```

---

