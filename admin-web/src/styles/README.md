# Global Color System

Centralized color management that automatically adapts to light/dark theme.

## How It Works

- **CSS Variables**: All colors are defined as CSS custom properties in `colors.css`
- **Theme-Aware**: Colors automatically switch between light and dark mode via the `.dark` class
- **Tailwind Integration**: Extended Tailwind config to use these variables seamlessly

## Usage Examples

### 1. Using Semantic Tailwind Classes (Recommended)

```jsx
// Backgrounds
<div className="bg-primary">Primary background</div>
<div className="bg-secondary">Secondary background</div>
<div className="bg-card">Card background</div>

// Text
<h1 className="text-primary">Primary text</h1>
<p className="text-secondary">Secondary text</p>
<span className="text-tertiary">Tertiary text</span>

// Borders
<div className="border border-primary">Primary border</div>
<input className="border-2 border-focus">Focus border</input>
```

### 2. Using CSS Variables Directly

```jsx
// With Tailwind arbitrary values
<div className="bg-[rgb(var(--color-bg-primary))]">Background</div>
<p className="text-[rgb(var(--color-text-secondary))]">Text</p>

// In custom CSS or inline styles
<div style={{ backgroundColor: 'rgb(var(--color-bg-secondary))' }}>
  Custom styled div
</div>
```

### 3. Using Utility Classes from colors.css

```jsx
<div className="bg-primary text-primary">
  Uses predefined utility classes
</div>

<button className="btn-brand">
  Brand button with hover effect
</button>
```

### 4. Replacing Old Dark Mode Classes

**Before:**

```jsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
  Content
</div>
```

**After:**

```jsx
<div className="bg-primary text-primary">Content</div>
```

## Available Colors

### Background Colors

- `bg-primary` - Main background
- `bg-secondary` - Secondary background (cards, headers)
- `bg-tertiary` - Tertiary background
- `bg-hover` - Hover states
- `bg-card` - Card backgrounds

### Text Colors

- `text-primary` - Main text
- `text-secondary` - Secondary text
- `text-tertiary` - Muted text
- `text-inverse` - Inverse text (for colored backgrounds)

### Border Colors

- `border-primary` - Default borders
- `border-secondary` - Secondary borders
- `border-focus` - Focus states

### Brand Colors

- `bg-brand` / `text-brand` - Primary brand color
- Use existing `text-dukaan-green-600` for specific shades

### Status Colors

Available as CSS variables:

- `--color-success` / `--color-success-bg`
- `--color-warning` / `--color-warning-bg`
- `--color-danger` / `--color-danger-bg`
- `--color-info` / `--color-info-bg`

## Benefits

✅ **Single Source of Truth**: All colors defined in one place
✅ **Automatic Theme Switching**: No need for `dark:` prefixes everywhere
✅ **Easier Maintenance**: Change colors once, affects entire app
✅ **Consistent Design**: Enforces color system across components
✅ **Better Performance**: Fewer CSS classes generated
✅ **Type Safety**: Can create TypeScript types for color variables

## Migration Guide

To migrate existing components:

1. Replace common patterns:
   - `bg-white dark:bg-gray-900` → `bg-primary`
   - `bg-gray-50 dark:bg-gray-800` → `bg-secondary`
   - `text-gray-900 dark:text-gray-100` → `text-primary`
   - `text-gray-600 dark:text-gray-400` → `text-secondary`
   - `border-gray-200 dark:border-gray-700` → `border-primary`

2. Keep component-specific colors as-is (buttons, badges, etc.)

3. Test theme switching after migration

## Customization

To modify colors, edit `/admin-web/src/styles/colors.css`:

```css
:root {
  --color-bg-primary: 249 250 251; /* Light mode value */
}

.dark {
  --color-bg-primary: 17 24 39; /* Dark mode value */
}
```

**Note**: Colors use RGB format without `rgb()` wrapper to support Tailwind's opacity modifiers:
`bg-primary/50` for 50% opacity works automatically!
