# KitchenSync - Design System

## Design Direction

### Visual Identity

**Brand Personality:**  
Cozy, clever, lightweight magic. Playful but refined. Not corporate, not chaos.

**Design Principles:**
1. **Vibrant, not sterile** - Use bold colors, not muted grays
2. **Personal, not generic** - Person-based layouts with individual colors
3. **Delightful, not overwhelming** - Strategic playfulness, not chaos
4. **Clear, not cluttered** - Clean card layouts, generous whitespace
5. **Smooth, not janky** - 60fps animations or nothing

---

## Color System

### Primary Colors

```css
--yellow: #F7EA31;     /* Sunshine - energetic, optimistic */
--red: #F7313F;        /* Vibrant - passionate, important */
--blue: #0A95FF;       /* Clear - calm, trustworthy */
--purple: #3C0E4D;     /* Rich - sophisticated, special */
```

**Usage:** Assign to family members. Use for person cards, calendar events, kudos badges.

### Neutrals

```css
--cream: #FAF8F3;      /* Background - warm, not stark white */
--charcoal: #2D3748;   /* Primary text - readable, not harsh black */
--gray-light: #E0E0E0; /* Borders, dividers */
--gray-medium: #9CA3AF; /* Secondary text, placeholders */
```

### Semantic Colors

```css
--success: #10B981;    /* Checkmarks, streak milestones */
--warning: #F59E0B;    /* Busy week alerts */
--error: #EF4444;      /* Error states, overdue tasks */
```

### Contrast Requirements

Each person color must have accessible text color:
- Yellow (#F7EA31) → Charcoal text (#2D3748)
- Red (#F7313F) → Cream text (#FAF8F3)
- Blue (#0A95FF) → Cream text (#FAF8F3)
- Purple (#3C0E4D) → Cream text (#FAF8F3)

**Accessibility:** All text must meet WCAG AA contrast (4.5:1 for normal text).

---

## Typography

### Font Families

```css
--font-primary: 'Work Sans', sans-serif;
--font-handwritten: 'Permanent Marker', cursive;
```

**Work Sans:**
- Primary UI font
- Weights: 600 (semibold), 700 (bold), 900 (black)
- Used for: body text, buttons, labels, names

**Permanent Marker:**
- Handwritten accent font
- Weight: 400 (only weight available)
- Used for: celebration messages, kudos badges, personality moments
- Use sparingly (3-5% of text maximum)

### Type Scale

```css
--text-xs: 12px;       /* Timestamps, metadata */
--text-sm: 14px;       /* Secondary text, captions */
--text-base: 16px;     /* Body text, task names */
--text-lg: 18px;       /* Section headers */
--text-xl: 24px;       /* Person names */
--text-2xl: 32px;      /* Page titles */
--text-3xl: 48px;      /* Celebration headlines */
```

### Font Weights

```css
--weight-semibold: 600;  /* UI elements, labels */
--weight-bold: 700;      /* Person names, buttons */
--weight-black: 900;     /* Headlines, emphasis */
```

### Text Styles

**Person Names:**
```css
font-family: var(--font-primary);
font-weight: 900;
font-size: 24px;
text-transform: lowercase;
letter-spacing: -0.02em;
```

**Task Items:**
```css
font-family: var(--font-primary);
font-weight: 600;
font-size: 16px;
line-height: 1.5;
```

**Celebration Text:**
```css
font-family: var(--font-handwritten);
font-weight: 400;
font-size: 32px;
line-height: 1.2;
transform: rotate(-2deg); /* Slight tilt for personality */
```

---

## Spacing System

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

**Usage Guidelines:**
- Card padding: `var(--space-6)` (24px)
- Section gaps: `var(--space-8)` (32px)
- Inline elements: `var(--space-3)` (12px)
- Page margins: `var(--space-6)` to `var(--space-8)`

---

## Layout System

### Card Design

**Person Card:**
```css
background: white;
border-radius: 16px;
padding: 24px;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
border-top: 4px solid [person-color];
```

**No heavy shadows** - Keep it flat and clean. Subtle elevation only.

### Grid System

**Dashboard Layout (Tablet):**
```
[Header - full width]
[Person Cards - 2x2 grid]
[Shared Todos - full width]
```

**Responsive:**
- Tablet (1024px+): 2-column grid
- Mobile (< 1024px): 1-column stack

### Touch Targets

**Minimum sizes:**
- Buttons: 44px × 44px
- Checkboxes: 48px × 48px (including padding)
- Tap areas: 44px minimum in all directions

**Spacing between interactive elements:** 8px minimum

---

## Interaction Design

### Animation Principles

1. **Smooth, not slow** - 200-300ms for most transitions
2. **Spring physics, not linear** - Natural, bouncy feel
3. **Purposeful, not decorative** - Every animation communicates state
4. **60fps or nothing** - Must be buttery smooth on target tablet

### Page Transitions

**Slide between views:**
```javascript
<motion.div
  initial={{ x: 300, opacity: 0 }}
  animate={{ x: 0, opacity: 1 }}
  exit={{ x: -300, opacity: 0 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
/>
```

**Direction based on hierarchy:**
- Main Dashboard → Calendar: slide left
- Calendar → Main Dashboard: slide right
- Any view → Profile: slide up
- Profile → Any view: slide down

### Modal Animations

**Bottom sheet (Kudos picker, Quick actions):**
```javascript
<motion.div
  initial={{ y: '100%' }}
  animate={{ y: 0 }}
  exit={{ y: '100%' }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
/>
```

**Center modal (Settings, Confirmations):**
```javascript
<motion.div
  initial={{ scale: 0.9, opacity: 0, y: 20 }}
  animate={{ scale: 1, opacity: 1, y: 0 }}
  exit={{ scale: 0.9, opacity: 0, y: 20 }}
  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
/>
```

**Background overlay:**
```javascript
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.2 }}
  style={{ 
    background: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(8px)' 
  }}
/>
```

### Menu Animations

**Side panel (Settings):**
```javascript
<motion.div
  initial={{ x: '100%' }}
  animate={{ x: 0 }}
  exit={{ x: '100%' }}
  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
/>
```

### Micro-interactions

**Checkbox completion:**
```javascript
// Checkmark draws in with stroke animation
<motion.svg>
  <motion.path
    initial={{ pathLength: 0 }}
    animate={{ pathLength: 1 }}
    transition={{ duration: 0.3, ease: 'easeInOut' }}
  />
</motion.svg>

// Scale bounce
<motion.div
  whileTap={{ scale: 0.95 }}
  animate={{ scale: [1, 1.1, 1] }}
  transition={{ duration: 0.2 }}
/>
```

**Button press:**
```javascript
<motion.button
  whileTap={{ scale: 0.95 }}
  transition={{ duration: 0.1 }}
/>
```

### Celebration Animations

**Background state during celebration:**
```javascript
// Main content blurs and scales back
<motion.div
  animate={{ 
    filter: 'blur(8px)',
    scale: 0.95,
    opacity: 0.5
  }}
  transition={{ duration: 0.3 }}
/>

// Celebration modal
<motion.div
  initial={{ scale: 0, rotate: -10 }}
  animate={{ scale: 1, rotate: 0 }}
  exit={{ scale: 0, rotate: 10 }}
  transition={{ 
    type: 'spring', 
    stiffness: 400, 
    damping: 10 
  }}
/>
```

**Physics-based effects:**
- Ripple: Expanding circle from tap point
- Morph: Shape transformation with spring physics
- Bloom: Radiating particles
- Confetti: Falling particles with gravity

**Duration:** 2-3 seconds total. Auto-dismiss.

---

## Component Patterns

### Person Card

**Visual Structure:**
```
┌─────────────────────────┐
│ [4px colored top border]│
│                         │
│ emma                    │ ← lowercase, 900 weight
│                         │
│ ☐ Feed the cat         │ ← 48px tap target
│ ☑ Homework             │ ← checked state
│ ☐ Practice piano       │
│                         │
│ 🔥 5 day streak        │ ← streak badge
│ ❤️ 3 kudos this week   │ ← kudos count
│                         │
└─────────────────────────┘
```

### Kudos Badge

**Styles:**
```css
display: inline-flex;
align-items: center;
gap: 8px;
padding: 6px 12px;
border-radius: 20px;
background: [person-color with 20% opacity];
border: 2px solid [person-color];
font-family: var(--font-handwritten);
font-size: 14px;
```

### Buttons

**Primary Button:**
```css
background: var(--blue);
color: white;
padding: 12px 24px;
border-radius: 12px;
font-weight: 700;
font-size: 16px;
transition: all 0.15s ease;

&:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(10, 149, 255, 0.3);
}

&:active {
  transform: translateY(0);
}
```

**Secondary Button:**
```css
background: transparent;
color: var(--charcoal);
border: 2px solid var(--gray-light);
padding: 12px 24px;
border-radius: 12px;
font-weight: 600;
```

---

## Accessibility

### Touch Optimization

- Minimum 44px × 44px touch targets
- 8px spacing between adjacent interactive elements
- Large, easy-to-read text (16px minimum)
- High contrast color combinations

### Visual Feedback

- Hover states for all interactive elements
- Active/pressed states with scale transforms
- Loading states with spinners or skeleton screens
- Success/error feedback with color + icon + text

### Haptic Feedback (Capacitor)

- Light tap: checkbox toggle
- Medium tap: kudos given
- Heavy tap: streak milestone, celebration

### Sound Effects

- Checkbox: soft "click"
- Kudos: gentle chime
- Streak milestone: triumphant fanfare
- Celebration: joyful sound
- Volume: 0-1 adjustable in settings

---

## Visual Personality Elements

### Hand-drawn Doodles

**Usage:** Subtle line art accents, not heavy illustrations

**Where:**
- Celebration modals (stars, sparkles)
- Empty states (friendly illustrations)
- Kudos badges (hand-drawn emoji style)

**Style:**
- 2-3px stroke weight
- Imperfect, slightly wobbly lines
- Charcoal color, 30-50% opacity
- SVG format for crisp rendering

### Photography Style

**Screensaver photos:**
- Real family moments (not stock photos)
- Faces visible and in focus
- Bright, well-lit
- Positive emotions (smiling, laughing, engaged)
- No screenshots, receipts, or clutter

**Ken Burns effect:**
```javascript
// Slow zoom + pan
animate={{
  scale: [1, 1.1],
  x: [0, -20],
  y: [0, -10]
}}
transition={{ duration: 10, ease: 'linear' }}
```

---

## Dark Mode (Future)

**Not in v1, but architecture supports:**
```css
/* Light mode (default) */
--bg-primary: #FAF8F3;
--text-primary: #2D3748;

/* Dark mode */
@media (prefers-color-scheme: dark) {
  --bg-primary: #1A202C;
  --text-primary: #F7FAFC;
}
```

---

## Performance Considerations

### Animation Performance

**Do:**
- Use `transform` and `opacity` (GPU-accelerated)
- Keep animations under 300ms
- Use `will-change` sparingly and remove after animation
- Test on target tablet, not just desktop

**Don't:**
- Animate `width`, `height`, `top`, `left` (causes layout thrashing)
- Use heavy `filter` effects during scrolling
- Run multiple complex animations simultaneously
- Trust desktop performance as indicator

### Optimization Checklist

- [ ] All animations tested on Samsung Galaxy Tab A9+
- [ ] Frame rate monitored (must be 60fps)
- [ ] Framer Motion only used where necessary
- [ ] CSS transitions preferred for simple animations
- [ ] Image assets optimized (WebP format, lazy loading)
- [ ] Font files subset to used characters only

---

**Document Version:** 1.0  
**Last Updated:** October 15, 2025  
**Owner:** Will

