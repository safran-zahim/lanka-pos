# Lanka POS Design System

**Version:** 2.0  
**Last Updated:** March 28, 2026  
**Status:** Foundation Phase - Master Reference

---

## Table of Contents

1. [Color System](#color-system)
2. [Typography](#typography)
3. [Spacing & Layout](#spacing--layout)
4. [Components](#components)
5. [Dark Mode](#dark-mode)
6. [Animations](#animations)
7. [Accessibility](#accessibility)
8. [Usage Examples](#usage-examples)

---

## Color System

### Brand Colors

#### Primary Blue
- **Purpose:** Main actions, links, focus states
- **Light Mode:** `#2563eb` (blue-600)
- **Dark Mode:** `#3b82f6` (blue-500)
- **Variants:**
  - `50`: `#eff6ff` (lightest background)
  - `100`: `#dbeafe`
  - `200`: `#bfdbfe`
  - `300`: `#93c5fd`
  - `400`: `#60a5fa`
  - `500`: `#3b82f6`
  - `600`: `#2563eb` (default)
  - `700`: `#1d4ed8`
  - `800`: `#1e40af`
  - `900`: `#1e3a8a` (darkest)

#### Accent Green
- **Purpose:** Success, positive actions, confirmation
- **Light Mode:** `#16a34a` (green-600)
- **Dark Mode:** `#22c55e` (green-500)
- **Variants:** Full spectrum (green-50 to green-900)

#### Warning Orange
- **Purpose:** Alerts, attention needed, caution
- **Light Mode:** `#ea580c` (orange-600)
- **Dark Mode:** `#fb923c` (orange-400)

#### Danger Red
- **Purpose:** Destructive actions, errors, critical
- **Light Mode:** `#dc2626` (red-600)
- **Dark Mode:** `#ef4444` (red-500)

### Semantic Colors

#### Text Colors
**Light Mode:**
- `text-primary`: `#111827` (gray-900) - Primary text, headings
- `text-secondary`: `#4b5563` (gray-700) - Secondary info
- `text-tertiary`: `#9ca3af` (gray-400) - Placeholder, disabled
- `text-muted`: `#d1d5db` (gray-300) - Very light text

**Dark Mode:**
- `text-primary`: `#f9fafb` (gray-50) - Main text
- `text-secondary`: `#d1d5db` (gray-300) - Secondary
- `text-tertiary`: `#9ca3af` (gray-400) - Muted
- `text-muted`: `#6b7280` (gray-500) - Very muted

#### Background Colors
**Light Mode:**
- `bg-primary`: `#ffffff` (white) - Main background
- `bg-secondary`: `#f9fafb` (gray-50) - Subtle background
- `bg-tertiary`: `#f3f4f6` (gray-100) - Card background
- `bg-overlay`: `rgba(0,0,0,0.5)` - Modal backdrop

**Dark Mode:**
- `bg-primary`: `#111827` (gray-900) - Main background
- `bg-secondary`: `#1f2937` (gray-800) - Elevated background
- `bg-tertiary`: `#374151` (gray-700) - Card background
- `bg-overlay`: `rgba(0,0,0,0.7)` - Modal backdrop

#### Border Colors
**Light Mode:**
- `border-light`: `#f3f4f6` (gray-100)
- `border-default`: `#e5e7eb` (gray-200)
- `border-strong`: `#d1d5db` (gray-300)

**Dark Mode:**
- `border-light`: `#374151` (gray-700)
- `border-default`: `#4b5563` (gray-600)
- `border-strong`: `#6b7280` (gray-500)

### Status Colors

| Status | Light | Dark | Usage |
|--------|-------|------|-------|
| **Success** | `#16a34a` | `#22c55e` | Completed, verified, active |
| **Warning** | `#ea580c` | `#fb923c` | Low stock, attention needed |
| **Error** | `#dc2626` | `#ef4444` | Failures, destructive, subscriptions |
| **Info** | `#0891b2` | `#06b6d4` | Information, tips, notifications |

---

## Typography

### Font Family
- **Primary Font:** `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif`
- **Mono Font:** `'Fira Code', 'Courier New', monospace` (for code/receipts)

### Heading Scale

| Level | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|------------|----------------|-------|
| **H1** | 32px (2rem) | 700 | 1.25 | -0.01em | Page titles |
| **H2** | 28px (1.75rem) | 700 | 1.285 | -0.01em | Section headers |
| **H3** | 24px (1.5rem) | 600 | 1.333 | 0em | Card titles |
| **H4** | 20px (1.25rem) | 600 | 1.4 | 0em | Subsections |
| **H5** | 16px (1rem) | 600 | 1.5 | 0em | Labels |
| **H6** | 14px (0.875rem) | 600 | 1.428 | 0.5px | Small labels |

### Body Text

| Type | Size | Weight | Line Height | Usage |
|------|------|--------|------------|-------|
| **Body Large** | 16px (1rem) | 400/500 | 1.5 | Main content paragraphs |
| **Body Base** | 14px (0.875rem) | 400/500 | 1.428 | Standard text |
| **Body Small** | 12px (0.75rem) | 400 | 1.333 | Secondary info, captions |
| **Body Xsmall** | 11px (0.6875rem) | 400 | 1.25 | Smallest text, metadata |

### Font Weights
- **400:** Regular (body text)
- **500:** Medium (labels, emphasized text)
- **600:** Semibold (subheadings, strong emphasis)
- **700:** Bold (headings, bold text)
- **800:** Extrabold (special emphasis)

---

## Spacing & Layout

### Spacing Scale (8px grid)

```
xs:    2px  (0.125rem)
sm:    4px  (0.25rem)
md:    8px  (0.5rem)
lg:    12px (0.75rem)
xl:    16px (1rem)
2xl:   24px (1.5rem)
3xl:   32px (2rem)
4xl:   40px (2.5rem)
5xl:   48px (3rem)
6xl:   64px (4rem)
7xl:   80px (5rem)
8xl:   96px (6rem)
```

**Usage:**
- Padding: `p-md`, `px-lg`, `py-xl`
- Margin: `m-lg`, `mx-auto`, `my-xl`
- Gap: `gap-md`, `gap-x-lg`

### Breakpoints

| Name | Width | Usage |
|------|-------|-------|
| **xs** | 320px | Mobile phones |
| **sm** | 640px | Large phones |
| **md** | 768px | Tablets |
| **lg** | 1024px | Desktops |
| **xl** | 1280px | Large desktops |
| **2xl** | 1536px | Extra large displays |

### Container Sizes

- **sm:** 24rem (384px)
- **md:** 28rem (448px)
- **lg:** 32rem (512px)
- **xl:** 36rem (576px)
- **2xl:** 42rem (672px)
- **3xl:** 48rem (768px)
- **4xl:** 56rem (896px)
- **5xl:** 64rem (1024px)
- **6xl:** 72rem (1152px)
- **7xl:** 80rem (1280px)

---

## Components

### Buttons

#### Variants

| Variant | Light Background | Dark Background | Border | Text | Use Case |
|---------|-----------------|-----------------|--------|------|----------|
| **Primary** | Blue-600 | Blue-500 | None | White | Main actions |
| **Secondary** | Gray-100 | Gray-700 | Gray-300 | Gray-900 | Alternative actions |
| **Ghost** | Transparent | Transparent | 1px Gray | Gray-700 | Low-priority |
| **Destructive** | Red-50 | Red-900 | Red-200 | Red-600 | Delete/danger |
| **Outline** | Transparent | Transparent | 1px Blue | Blue-600 | Outlined action |
| **Success** | Green-50 | Green-900 | Green-200 | Green-600 | Confirm/save |

#### Sizes

| Size | Padding | Font Size | Icon Size |
|------|---------|-----------|-----------|
| **xs** | 4px 12px | 12px | 14px |
| **sm** | 6px 14px | 13px | 16px |
| **md** | 8px 16px | 14px | 18px |
| **lg** | 12px 24px | 16px | 20px |
| **xl** | 14px 32px | 16px | 20px |

### Cards

```tsx
// Structure
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Subtitle</CardDescription>
  </CardHeader>
  <CardContent>Content here</CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

**Variants:**
- **Elevated:** Shadow on light mode, subtle lighter bg on dark
- **Outlined:** 1px border, no fill
- **Flat:** Minimal, filled background

**Light Mode:** White background, `#e5e7eb` border  
**Dark Mode:** Gray-800 background, `#4b5563` border

### Forms

#### Input Field

```tsx
<FormField
  label="Email"
  placeholder="user@example.com"
  type="email"
  error={errors.email}
  helperText="Enter valid email"
  required
/>
```

**States:**
- **Default:** Border `#e5e7eb` (light) / `#4b5563` (dark)
- **Focus:** Border-blue, shadow-blue
- **Error:** Border-red, text-red
- **Disabled:** Background `#f9fafb`, opacity 0.5
- **Success:** Border-green

#### Labels
- **Font:** 500 weight, 14px
- **Color:** Gray-700 (light) / Gray-300 (dark)
- **Margin Bottom:** 6px

#### Helper Text
- **Font:** 12px, Gray-600 (light) / Gray-400 (dark)
- **Margin Top:** 4px

### Badge/Pill

**Variants:**

| Variant | Light Background | Dark Background | Text |
|---------|-----------------|-----------------|------|
| **Default** | Gray-100 | Gray-700 | Gray-800 |
| **Primary** | Blue-100 | Blue-900 | Blue-700 |
| **Success** | Green-100 | Green-900 | Green-700 |
| **Warning** | Orange-100 | Orange-900 | Orange-700 |
| **Error** | Red-100 | Red-900 | Red-700 |

**Sizes:** `sm` (8px), `md` (10px), `lg` (12px)

### Alerts

```tsx
<Alert variant="destructive">
  <AlertCircle className="h-4 w-4" />
  <AlertTitle>Error</AlertTitle>
  <AlertDescription>
    Something went wrong. Please try again.
  </AlertDescription>
</Alert>
```

**Variants:** Success, Warning, Error, Info

---

## Dark Mode

### Implementation

**Strategy:** Class-based (`'dark'` class on `<html>`)

**Activation:**
```tsx
// ThemeProvider.tsx
document.documentElement.classList.toggle('dark', isDark);
```

**Storage:** Zustand store (`useThemeStore`)

### Color Mapping

```typescript
// Light mode uses Tailwind colors directly
// Dark mode uses 'dark:' prefix

// Example:
className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white"

// Or with CSS variables (recommended):
className="bg-surface text-text-primary dark:bg-surface-dark dark:text-text-primary-dark"
```

### Dark Mode Checklist for Each Component

- [ ] Background colors defined for both modes
- [ ] Text colors have sufficient contrast (4.5:1+)
- [ ] Borders visible in both modes
- [ ] Shadows appropriate (stronger in light, subtle in dark)
- [ ] Icons have proper visibility
- [ ] Forms inputs have clear focus states
- [ ] Modals/overlays look balanced

### Contrast Requirements

| Element | Min Ratio | Preferred |
|---------|-----------|-----------|
| Body text | 4.5:1 | 7:1 |
| Large text (18px+) | 3:1 | 4.5:1 |
| UI components | 3:1 | 4.5:1 |

---

## Shadows (Elevation)

### Shadow Scale

```css
/* Light Mode */
shadow-xs:   0 1px 2px 0 rgba(0,0,0,0.05)
shadow-sm:   0 1px 2px 0 rgba(0,0,0,0.08)
shadow-md:   0 4px 6px -1px rgba(0,0,0,0.1)
shadow-lg:   0 10px 15px -3px rgba(0,0,0,0.1)
shadow-xl:   0 20px 25px -5px rgba(0,0,0,0.1)
shadow-2xl:  0 25px 50px -12px rgba(0,0,0,0.25)

/* Dark Mode (override in dark:) */
dark:shadow-xs:   0 1px 2px 0 rgba(0,0,0,0.3)
dark:shadow-sm:   0 1px 2px 0 rgba(0,0,0,0.4)
dark:shadow-md:   0 4px 6px -1px rgba(0,0,0,0.4)
dark:shadow-lg:   0 10px 15px -3px rgba(0,0,0,0.5)
```

### Elevation Levels

- **Raised (1):** Cards, panels
- **Floating (2):** Modals, popovers
- **Overlay (3):** Tooltips, dropdowns
- **Modal (4):** Main dialogs

---

## Animations & Transitions

### Durations

```
Fast:    150ms
Normal:  300ms
Slow:    500ms
```

### Common Transitions

```css
/* Fade */
transition opacity 300ms ease-in-out

/* Slide */
transition all 300ms cubic-bezier(0.4, 0, 0.2, 1)

/* Scale */
transform scale(1) transition 200ms ease-out

/* Height (collapse) */
transition height 300ms ease-in-out
```

### Keyframes

```tsx
// Fade in
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

// Slide in
@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

// Pulse (loading)
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

---

## Accessibility

### Color Contrast

**WCAG 2.1 AA:**
- Text: 4.5:1 ratio
- Large text (18px+): 3:1 ratio
- UI components: 3:1 ratio

**WCAG 2.1 AAA:**
- Text: 7:1 ratio
- Large text: 4.5:1 ratio

### Focus States

- **Focus ring:** 2px solid blue-600, 2px offset
- **Keyboard navigation:** All interactive elements tab-accessible
- **Skip links:** Added when needed

### ARIA Labels

```tsx
// Buttons without text
<button aria-label="Close dialog">
  <X size={20} />
</button>

// Icons
<Info aria-label="Information" />

// Forms
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

### Semantic HTML

- Use `<button>`, `<a>`, `<form>` elements
- Proper heading hierarchy (h1 → h6)
- `<fieldset>` for grouped inputs
- `<legend>` for fieldset labels

---

## Usage Examples

### Example 1: Login Form

```tsx
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input label="Email" type="email" placeholder="user@example.com" />
          <Input label="Password" type="password" />
          <Button className="w-full">Sign In</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

### Example 2: Data Table with Status

```tsx
<div className="space-y-4">
  <div className="flex justify-between items-center">
    <h2 className="text-xl font-semibold">Products</h2>
    <Button size="sm">Add Product</Button>
  </div>
  
  <div className="overflow-x-auto bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200 dark:border-gray-700">
          <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
          <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
          <th className="px-4 py-3 text-right text-sm font-semibold">Price</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
          <td className="px-4 py-3">Product Name</td>
          <td className="px-4 py-3">
            <Badge variant="success">In Stock</Badge>
          </td>
          <td className="px-4 py-3 text-right">$99.99</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Example 3: Alert System

```tsx
<div className="space-y-2">
  <Alert variant="success">
    <CheckCircle2 className="h-4 w-4" />
    <AlertTitle>Success</AlertTitle>
    <AlertDescription>Product has been saved successfully.</AlertDescription>
  </Alert>
  
  <Alert variant="error">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>Failed to process payment. Please try again.</AlertDescription>
  </Alert>
  
  <Alert variant="warning">
    <AlertTriangle className="h-4 w-4" />
    <AlertTitle>Warning</AlertTitle>
    <AlertDescription>Low stock alert for this product.</AlertDescription>
  </Alert>
</div>
```

---

## Implementation Checklist

- [ ] Update `tailwind.config.js` with semantic color tokens
- [ ] Add all missing components to `/client/src/components/ui/`
- [ ] Apply design system to all pages
- [ ] Audit dark mode contrast ratios
- [ ] Test keyboard navigation
- [ ] Test with screen readers
- [ ] Create Storybook documentation
- [ ] Document patterns in team wiki

---

**Maintenance:**
- Review quarterly for consistency
- Update as new components are added
- Keep dark mode variants in sync
- Monitor accessibility standards

