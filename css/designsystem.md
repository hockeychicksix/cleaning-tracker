# 🎨 Cadence Design System

> A futuristic, warm glassmorphism design system for household operations management

---

## 📋 Table of Contents

1. [Design Philosophy](#design-philosophy)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing System](#spacing-system)
5. [Components](#components)
6. [Usage Guidelines](#usage-guidelines)
7. [Code Examples](#code-examples)
8. [Accessibility](#accessibility)

---

## 🎯 Design Philosophy

Cadence combines futuristic aesthetics with human warmth. Our design principles:

### 🌌 Dark, Not Depressing
Deep space blacks create focus and reduce eye strain, but gradients and glows keep it alive. Think sci-fi command center, not dungeon.

### 💎 Glassmorphism Everywhere
Frosted glass effects with backdrop-blur create depth and premium feel. Layers float above each other with subtle transparency.

### ✨ Glow & Gradients
Gold-to-purple gradients for premium touches. Colored shadows and glows add dimension. Neon status indicators that feel alive.

### 🎯 Clear Hierarchy
Even in darkness, content organization is obvious. Size, weight, color, and luminosity create clear visual flow.

### 🎬 Smooth Animations
Every interaction feels premium. Cubic-bezier easing, ripple effects, hover glows — nothing snaps or jolts. Fluid motion everywhere.

### 💬 Still Human
Futuristic doesn't mean cold. Warm gradients, encouraging copy, no harsh alerts. Technology in service of humanity.

---

## 🎨 Color Palette

### Primary Colors

```css
--primary-gold: #E6B74E
--primary-gold-dark: #D4A574
--primary-purple: #B48CFF
```

**Gold** (#E6B74E): Primary brand color, warm and inviting
**Purple** (#B48CFF): Secondary accent, futuristic and premium

### Backgrounds

```css
--bg-space: #0F0F14        /* Deep space black */
--bg-elevated: #1A1A24     /* Elevated surfaces */
--bg-glass: rgba(255, 255, 255, 0.03)  /* Glass effect */
```

### Text Colors

```css
--text-primary: #FFFFFF     /* Brightest text */
--text-secondary: #C8C8CE   /* Body text */
--text-tertiary: #8B8B94    /* Subtle text */
--text-muted: #6B6B75       /* De-emphasized text */
```

### Status Colors

```css
--success-green: #86EFAC    /* Completion, success */
--warning-amber: #FCD34D    /* Attention, due soon */
--danger-coral: #FCA5A5     /* Overdue, error */
```

### Gradients

```css
--gradient-primary: linear-gradient(135deg, #E6B74E 0%, #B48CFF 100%)
--gradient-gold: linear-gradient(135deg, #E6B74E 0%, #D4A574 100%)
```

---

## 📝 Typography

### Font Families

- **Sans-serif**: Inter (400, 500, 600, 700, 800)
- **Display**: Plus Jakarta Sans (700, 800)

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@700;800&display=swap" rel="stylesheet">
```

### Type Scale

| Element | Size | Weight | Use Case |
|---------|------|--------|----------|
| Display | 3.5rem | 800 | Hero sections |
| H1 | 2.5rem | 800 | Page titles |
| H2 | 2rem | 700 | Section titles |
| H3 | 1.5rem | 700 | Subsections |
| Body | 1rem | 400 | Main content |
| Small | 0.875rem | 400 | Captions |

### Text Styles

```css
/* Gradient Text (for headlines) */
.text-gradient {
    background: var(--gradient-primary);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

/* Text Colors */
.text-primary { color: var(--text-primary); }
.text-secondary { color: var(--text-secondary); }
.text-muted { color: var(--text-muted); }
```

---

## 📏 Spacing System

8-point grid system for consistent spacing:

```css
--space-1: 0.25rem    /* 4px */
--space-2: 0.5rem     /* 8px */
--space-3: 0.75rem    /* 12px */
--space-4: 1rem       /* 16px */
--space-6: 1.5rem     /* 24px */
--space-8: 2rem       /* 32px */
--space-12: 3rem      /* 48px */
```

**Usage:**
- Use multiples of 4px for all spacing
- Small gaps: `space-2` or `space-3`
- Standard gaps: `space-4` or `space-6`
- Large gaps: `space-8` or `space-12`

---

## 🧩 Components

### Glass Cards

The foundation of the UI. All cards use glassmorphism effects.

```html
<!-- Base Glass Card -->
<div class="glass-card">
    <h3>Card Title</h3>
    <p>Card content goes here...</p>
</div>

<!-- Small Card -->
<div class="glass-card glass-card--sm">
    Compact content
</div>

<!-- Interactive Card (Hoverable) -->
<div class="glass-card glass-card--hover">
    Click me!
</div>

<!-- Elevated Card (More depth) -->
<div class="glass-card glass-card--elevated">
    Important content
</div>
```

**Modifiers:**
- `glass-card--sm`: Smaller padding (16px)
- `glass-card--lg`: Larger padding (32px)
- `glass-card--hover`: Adds hover animation
- `glass-card--elevated`: More prominent shadow
- `glass-card--accent`: Gold accent border on hover

---

### Buttons

```html
<!-- Primary Button (Gold Gradient) -->
<button class="btn btn--primary">
    Save Changes
</button>

<!-- Secondary Button (Glass) -->
<button class="btn btn--secondary">
    Cancel
</button>

<!-- Outline Button -->
<button class="btn btn--outline">
    Learn More
</button>

<!-- With Icon -->
<button class="btn btn--primary">
    <span class="btn-icon">→</span>
    Next Step
</button>

<!-- Sizes -->
<button class="btn btn--sm">Small</button>
<button class="btn">Default</button>
<button class="btn btn--lg">Large</button>
```

**Button Variants:**
- `btn--primary`: Gold gradient, for primary actions
- `btn--secondary`: Transparent glass, for secondary actions
- `btn--outline`: Outlined, for tertiary actions
- `btn--danger`: Red, for destructive actions
- `btn--ghost`: Minimal, for subtle actions

---

### Status Badges

```html
<!-- Success (Fresh) -->
<span class="status-badge status-fresh">
    ✓ Fresh
</span>

<!-- Warning (Due Soon) -->
<span class="status-badge status-due-soon">
    ⏰ Due Soon
</span>

<!-- Danger (Needs Attention) -->
<span class="status-badge status-needs-attention">
    🔔 Needs Attention
</span>

<!-- With Dot -->
<span class="status-badge">
    <span class="status-dot status-dot--success"></span>
    Active
</span>
```

---

### Form Inputs

```html
<!-- Text Input -->
<div class="form-group">
    <label class="form-label">Task Name</label>
    <input type="text" class="form-input" placeholder="Enter task name...">
</div>

<!-- Select -->
<div class="form-group">
    <label class="form-label">Category</label>
    <select class="form-select">
        <option>Choose category...</option>
        <option>Kitchen</option>
        <option>Bathroom</option>
    </select>
</div>

<!-- Textarea -->
<div class="form-group">
    <label class="form-label">Notes</label>
    <textarea class="form-textarea" placeholder="Additional notes..."></textarea>
</div>

<!-- Checkbox -->
<div class="checkbox-group">
    <div class="checkbox"></div>
    <label class="checkbox-label">Remember me</label>
</div>
```

---

### Dashboard Cards

Special cards for dashboard metrics:

```html
<div class="dashboard-card">
    <div class="dashboard-card__icon" style="background: #FEF3C7;">
        📋
    </div>
    <div class="dashboard-card__title">Tasks</div>
    <div class="dashboard-card__subtitle">3 due today</div>
    <div class="dashboard-card__stats">12</div>
</div>
```

---

### Navigation

```html
<header class="header">
    <div class="container">
        <div class="header-content">
            <a href="/" class="logo">Cadence</a>
            
            <nav class="nav-menu" id="navMenu">
                <a href="/dashboard" class="nav-link active">Dashboard</a>
                <a href="/tasks" class="nav-link">Tasks</a>
                <a href="/stats" class="nav-link">Stats</a>
            </nav>
            
            <button class="mobile-nav-toggle" id="mobileToggle">
                ☰
            </button>
        </div>
    </div>
</header>
```

---

### Modals

```html
<div class="modal" id="myModal">
    <div class="modal-backdrop"></div>
    <div class="modal-content">
        <div class="modal-header">
            <h3>Modal Title</h3>
            <button class="modal-close">×</button>
        </div>
        <div class="modal-body">
            <p>Modal content goes here...</p>
        </div>
        <div class="modal-actions">
            <button class="btn btn--secondary">Cancel</button>
            <button class="btn btn--primary">Confirm</button>
        </div>
    </div>
</div>
```

---

## 💻 Usage Guidelines

### DO ✅

- Use glass cards for all content containers
- Apply hover effects to interactive elements
- Use the 8pt spacing grid consistently
- Maintain text hierarchy (display → h1 → h2 → body)
- Add transitions to state changes
- Use semantic HTML
- Test with keyboard navigation

### DON'T ❌

- Don't use pure black (#000000) backgrounds
- Don't skip intermediate heading levels
- Don't use more than 2-3 font weights per page
- Don't animate `width`, `height`, or `top/left` properties
- Don't use `transition: all`
- Don't skip focus states
- Don't use color alone to convey information

---

## 📖 Code Examples

### Creating a Dashboard Layout

```html
<div class="container">
    <!-- Welcome Section -->
    <div class="welcome-section">
        <div class="greeting">
            <h2>Good morning, Sarah</h2>
            <p>You have 3 tasks due today</p>
        </div>
    </div>
    
    <!-- Stats Grid -->
    <div class="stats-grid">
        <div class="stat-card">
            <div class="stat-card__label">Completed Today</div>
            <div class="stat-card__value">8</div>
            <div class="stat-card__subtitle">+2 from yesterday</div>
        </div>
        <!-- More stat cards... -->
    </div>
    
    <!-- Dashboard Grid -->
    <div class="dashboard-grid">
        <div class="dashboard-card">
            <!-- Dashboard card content -->
        </div>
        <!-- More dashboard cards... -->
    </div>
</div>
```

### Creating a Form

```html
<form class="glass-card glass-card--lg">
    <h2>Create New Task</h2>
    
    <div class="form-row">
        <div class="form-group">
            <label class="form-label">Task Name *</label>
            <input type="text" class="form-input" required>
        </div>
        
        <div class="form-group">
            <label class="form-label">Category *</label>
            <select class="form-select" required>
                <option>Choose...</option>
            </select>
        </div>
    </div>
    
    <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea"></textarea>
    </div>
    
    <div class="form-actions">
        <button type="button" class="btn btn--secondary">Cancel</button>
        <button type="submit" class="btn btn--primary">Create Task</button>
    </div>
</form>
```

---

## ♿ Accessibility

### Focus States

All interactive elements have visible focus states:

```css
*:focus-visible {
    outline: 2px solid var(--primary-gold);
    outline-offset: 2px;
}
```

### Reduced Motion

Respects `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
    * {
        animation-duration: 0.01ms !important;
        transition-duration: 0.01ms !important;
    }
}
```

### Color Contrast

All text meets WCAG AA standards:
- Large text (18px+): 3:1 minimum
- Normal text: 4.5:1 minimum

### Keyboard Navigation

- All interactive elements are keyboard accessible
- Tab order is logical
- Focus indicators are clearly visible
- Escape key closes modals and menus

---

## 🎯 Design Tokens Reference

### Shadows

```css
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4)
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.5)
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.3)
--shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.5)
```

### Border Radius

```css
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 20px
--radius-2xl: 24px
--radius-3xl: 32px
--radius-full: 9999px
```

### Transitions

```css
--transition-fast: 0.2s cubic-bezier(0.4, 0, 0.2, 1)
--transition-base: 0.3s cubic-bezier(0.4, 0, 0.2, 1)
--transition-slow: 0.4s cubic-bezier(0.4, 0, 0.2, 1)
```

### Blur Effects

```css
--blur-glass: blur(20px)
--blur-strong: blur(40px)
--blur-light: blur(10px)
```

---

## 🚀 Getting Started

### 1. Include the Stylesheet

```html
<link rel="stylesheet" href="css/style.css">
```

### 2. Add Fonts

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@700;800&display=swap" rel="stylesheet">
```

### 3. Basic HTML Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cadence</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="page-wrapper">
        <header class="header">
            <!-- Header content -->
        </header>
        
        <main class="content-wrapper">
            <div class="container">
                <!-- Page content -->
            </div>
        </main>
    </div>
</body>
</html>
```

---

## 📦 File Structure

```
css/
├── 00-tokens.css              # Design tokens (colors, spacing, etc.)
├── 01-reset.css               # CSS reset and base styles
├── 02-typography.css          # Font styles and text utilities
├── 03-layout.css              # Grid, flex, and layout utilities
├── components/
│   ├── buttons.css            # All button styles
│   ├── cards.css              # Glass cards and variants
│   ├── forms.css              # Form inputs and controls
│   ├── navigation.css         # Header, nav, and breadcrumbs
│   ├── modals.css             # Modals, dropdowns, tooltips
│   └── status.css             # Badges, alerts, progress bars
└── style.css                  # Main file (imports everything)
```

---

## 🔄 Version History

### v1.0.0 (Current)
- Initial design system
- Glassmorphism theme
- All core components
- Full accessibility support
- Optimized performance

---

## 📞 Support

Questions or suggestions? Contact the development team.

---

**Built with ❤️ for better household management**