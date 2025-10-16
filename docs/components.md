# KitchenSync - Component Library

This document will be populated as components are built. Each component entry includes API, usage examples, and implementation notes.

---

## Component Documentation Template

```markdown
### ComponentName

**Purpose:** Brief description of what this component does

**Props:**
- `propName` (type, required/optional) - Description
- `propName` (type, default: value) - Description

**Usage:**
```tsx
<ComponentName
  propName="value"
  propName={value}
/>
```

**Implementation Notes:**
- Any performance considerations
- Accessibility features
- Animation details
- State management approach

**Visual:**
[Screenshot or ASCII diagram]

**Status:** ✅ Complete | 🚧 In Progress | ⏳ Not Started
```

---

## Base Components

### Button

**Status:** ⏳ Not Started

**Purpose:** Primary and secondary button variants with touch-optimized sizing

**Props:**
- `variant` ('primary' | 'secondary', default: 'primary') - Visual style
- `size` ('small' | 'medium' | 'large', default: 'medium') - Size variant
- `onClick` (function, required) - Click handler
- `disabled` (boolean, default: false) - Disabled state
- `children` (ReactNode, required) - Button content

**Usage:**
```tsx
<Button variant="primary" onClick={() => handleClick()}>
  Add Task
</Button>
```

**Implementation Notes:**
- Minimum 44px touch target
- `whileTap={{ scale: 0.95 }}` for tactile feedback
- Framer Motion for press animation (if performance allows)

---

### Card

**Status:** ⏳ Not Started

**Purpose:** Container with rounded corners, subtle shadow, optional colored border

**Props:**
- `borderColor` (string, optional) - Top border color (person color)
- `padding` ('small' | 'medium' | 'large', default: 'medium') - Internal spacing
- `children` (ReactNode, required) - Card content

**Usage:**
```tsx
<Card borderColor="#F7EA31" padding="medium">
  {/* card content */}
</Card>
```

**Implementation Notes:**
- Flat design, no heavy shadows
- `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08)`
- Border-radius: 16px

---

### Checkbox

**Status:** ⏳ Not Started

**Purpose:** Touch-optimized checkbox with checkmark stroke animation

**Props:**
- `checked` (boolean, required) - Checked state
- `onChange` (function, required) - Change handler
- `label` (string, optional) - Checkbox label
- `color` (string, optional) - Person color for checked state

**Usage:**
```tsx
<Checkbox
  checked={task.completed}
  onChange={() => toggleTask(task.id)}
  label="Feed the cat"
  color="#F7EA31"
/>
```

**Implementation Notes:**
- 48px touch target (including padding)
- Checkmark SVG with stroke animation on check
- Optimistic update (Zustand), then queued Firestore write

---

## Layout Components

### Header

**Status:** ⏳ Not Started

**Purpose:** Top bar with logo, date, and family avatars

**Implementation Notes:**
- Sticky at top (during scrolling)
- Responsive: stack on mobile, horizontal on tablet

---

### PersonCardsGrid

**Status:** ⏳ Not Started

**Purpose:** Responsive grid for person cards (2x2 on tablet, 1 column on mobile)

**Implementation Notes:**
- CSS Grid: `grid-template-columns: repeat(auto-fit, minmax(300px, 1fr))`
- Gap: 24px

---

## Feature Components

### PersonCard

**Status:** ⏳ Not Started

**Purpose:** Individual person's chore card with tasks, streak, and kudos

**Props:**
- `user` (User, required) - User data (name, color, streak)
- `tasks` (Task[], required) - Assigned tasks
- `kudosCount` (number, required) - Kudos received this week

**Usage:**
```tsx
<PersonCard
  user={sarahUser}
  tasks={sarahTasks}
  kudosCount={5}
/>
```

**Visual:**
```
┌─────────────────────────────────┐
│ [colored top border]            │
│                                 │
│ sarah                           │
│                                 │
│ ☐ Review budget                 │
│ ☑ Call dentist                  │
│                                 │
│ 🔥 3 day streak                 │
│ ❤️ 5 kudos this week            │
│                                 │
└─────────────────────────────────┘
```

**Implementation Notes:**
- Name: lowercase, Work Sans 900, 24px
- Top border: 4px, person color
- Long-press triggers kudos picker

---

### TaskItem

**Status:** ⏳ Not Started

**Purpose:** Single task with checkbox and label

**Props:**
- `task` (Task, required) - Task data
- `onToggle` (function, required) - Toggle handler

**Implementation Notes:**
- 48px min height for touch target
- Checkmark stroke animation (Framer Motion path)
- Completed tasks: gray text, strikethrough

---

### KudosPicker

**Status:** ⏳ Not Started

**Purpose:** Bottom sheet modal for giving kudos

**Props:**
- `recipientUser` (User, required) - Who to give kudos to
- `onGive` (function, required) - Kudos submission handler
- `onClose` (function, required) - Close handler

**Usage:**
```tsx
<KudosPicker
  recipientUser={emmaUser}
  onGive={(kudos) => handleGiveKudos(kudos)}
  onClose={() => setShowPicker(false)}
/>
```

**Visual:**
```
[Backdrop blur]

┌──────────────────────────────────────┐
│ Give kudos to emma                   │
│                                      │
│ [💪 Great Effort]                    │
│ [❤️ Kind Act]                        │
│ [🧠 Smart Thinking]                  │
│ [🤝 Helpful]                         │
│ [😂 Made Me Laugh]                   │
│                                      │
│ [Optional message input]             │
│                                      │
│ [Cancel] [Give Kudos]                │
└──────────────────────────────────────┘
```

**Implementation Notes:**
- Slide up animation: `y: '100%'` → `y: 0`
- Spring physics: `{ type: 'spring', stiffness: 300, damping: 30 }`
- Backdrop: `rgba(0, 0, 0, 0.5)` with `blur(8px)`
- Dismiss: tap outside, swipe down, or cancel button

---

### CelebrationOverlay

**Status:** ⏳ Not Started

**Purpose:** Full-screen celebration animation for milestones

**Props:**
- `celebration` (Celebration, required) - What to celebrate
- `onComplete` (function, required) - Callback when animation finishes

**Usage:**
```tsx
<CelebrationOverlay
  celebration={{
    type: 'streak',
    userId: 'user-emma',
    streakValue: 5,
    message: 'On a roll! ⚡'
  }}
  onComplete={() => clearCelebration()}
/>
```

**Implementation Notes:**
- Background: blur main content, scale to 0.95
- Modal: spring animation, scale 0 → 1
- Physics effects: ripple/morph/bloom (test performance)
- Auto-dismiss after 2-3s
- Sound effect respects volume setting
- Fallback to minimal mode if FPS drops

---

### Screensaver

**Status:** ⏳ Not Started

**Purpose:** Fullscreen photo slideshow with Ken Burns effect

**Props:**
- `photos` (Photo[], required) - Photos to display
- `onWake` (function, required) - Touch handler to exit screensaver

**Implementation Notes:**
- Crossfade: 10s per photo
- Ken Burns: slow zoom + pan (scale 1 → 1.1, translate -20px)
- Touch anywhere → exit to dashboard
- Preload next 2 photos for smooth transitions

---

## Animation Components

### PageTransition

**Status:** ⏳ Not Started

**Purpose:** Wrapper for page slide animations

**Props:**
- `direction` ('left' | 'right' | 'up' | 'down', required) - Slide direction
- `children` (ReactNode, required) - Page content

**Usage:**
```tsx
<PageTransition direction="left">
  <CalendarView />
</PageTransition>
```

**Implementation Notes:**
- Framer Motion `<motion.div>` with AnimatePresence
- Must run at 60fps on tablet (test early!)

---

### BottomSheet

**Status:** ⏳ Not Started

**Purpose:** Reusable bottom sheet for modals (kudos picker, quick actions)

**Props:**
- `isOpen` (boolean, required) - Open state
- `onClose` (function, required) - Close handler
- `children` (ReactNode, required) - Sheet content

**Implementation Notes:**
- Slide up: `y: '100%'` → `y: 0`
- Drag to dismiss (if performance allows)
- Backdrop tap to close

---

## Settings Components

### SettingsPanel

**Status:** ⏳ Not Started

**Purpose:** Side panel for all settings

**Implementation Notes:**
- Slide in from right
- Scrollable content area
- Parent PIN protection

---

### SettingsSection

**Status:** ⏳ Not Started

**Purpose:** Grouped settings with header

**Usage:**
```tsx
<SettingsSection title="Display">
  <SettingsToggle label="Dark mode" />
  <SettingsSlider label="Brightness" />
</SettingsSection>
```

---

### SettingsToggle

**Status:** ⏳ Not Started

**Purpose:** Toggle switch for boolean settings

**Props:**
- `label` (string, required) - Setting label
- `value` (boolean, required) - Current state
- `onChange` (function, required) - Change handler

---

### SettingsSlider

**Status:** ⏳ Not Started

**Purpose:** Slider for numeric settings (volume, idle time)

**Props:**
- `label` (string, required) - Setting label
- `value` (number, required) - Current value
- `min` (number, required) - Minimum value
- `max` (number, required) - Maximum value
- `step` (number, default: 1) - Step increment
- `onChange` (function, required) - Change handler

---

## Utility Components

### LoadingSpinner

**Status:** ⏳ Not Started

**Purpose:** Loading indicator for async operations

---

### ErrorBoundary

**Status:** ⏳ Not Started

**Purpose:** Catch React errors, show fallback UI

---

### ProtectedRoute

**Status:** ⏳ Not Started

**Purpose:** Auth-gated routes (require login)

---

## Component Patterns

### Animations

**Always test on tablet before committing.**

Use Framer Motion variants for reusability:

```tsx
const slideVariants = {
  enter: { x: 300, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -300, opacity: 0 }
};

<motion.div
  variants={slideVariants}
  initial="enter"
  animate="center"
  exit="exit"
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  {children}
</motion.div>
```

### Touch Targets

**Minimum 44px in all directions.**

```tsx
<button className="min-h-[44px] min-w-[44px] p-3">
  {children}
</button>
```

### Optimistic Updates

```tsx
const handleToggle = (taskId: string) => {
  // 1. Update Zustand immediately
  toggleTask(taskId);
  
  // 2. Queue Firestore write (batched)
  queueFirestoreWrite(() => updateTask(taskId, { completed: !task.completed }));
};
```

---

## To Be Documented

Components will be added here as they're built during Week 1-5 implementation.

**Week 1-2:**
- Header, PersonCard, TaskItem, Button, Card, Checkbox
- PageTransition, CalendarWidget
- Screensaver

**Week 3:**
- KudosPicker, CelebrationOverlay
- StreakBadge, KudosBadge

**Week 4:**
- SettingsPanel, SettingsSection, SettingsToggle, SettingsSlider
- BottomSheet, QuickActionsMenu

---

**Document Version:** 1.0  
**Last Updated:** October 15, 2025  
**Status:** Template created, components to be documented during implementation

