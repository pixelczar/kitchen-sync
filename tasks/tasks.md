# KitchenSync - Implementation Tasks

## Week 1-2: MVP Foundation

### Project Setup
- [ ] **Initialize Vite + React + TypeScript project**
  - Acceptance: `npm run dev` starts dev server
  - Acceptance: TypeScript strict mode enabled
  
- [ ] **Install and configure dependencies**
  - Dependencies: Tailwind CSS, Framer Motion, Zustand, React Query, Firebase SDK
  - Acceptance: All imports work, no version conflicts
  
- [ ] **Set up Firebase project**
  - Create Firebase project
  - Enable Firestore, Authentication, Cloud Storage
  - Configure security rules (based on technical.md)
  - Acceptance: Can read/write to Firestore from app

- [ ] **Configure environment variables**
  - Copy `.env.example` to `.env.local`
  - Add Firebase config values
  - Add Google API keys (placeholders initially)
  - Acceptance: App connects to Firebase without errors

### Design System

- [ ] **Implement Tailwind design tokens**
  - Add custom colors to `tailwind.config.js`
  - Add custom fonts (Work Sans, Permanent Marker)
  - Add spacing scale
  - Acceptance: Can use `bg-yellow`, `text-charcoal`, etc. in components

- [ ] **Create base component library**
  - Button component (primary, secondary variants)
  - Card component
  - Checkbox component (48px touch target)
  - Acceptance: Storybook or example page showing all variants

### State Management

- [ ] **Set up Zustand store**
  - Create `uiStore.ts` with initial state
  - Implement task toggle action
  - Implement navigation actions
  - Acceptance: Can toggle UI state and see immediate updates

- [ ] **Implement batched Firestore writes**
  - Create `queueFirestoreWrite` utility
  - 500ms batching logic
  - Acceptance: Multiple rapid writes batch into one Firestore call

- [ ] **Set up React Query**
  - Configure QueryClient with polling settings
  - Create `useTasks` hook
  - Create `useUsers` hook
  - Acceptance: Can fetch and cache Firestore data

### Core UI - Dashboard

- [ ] **Build page transition system**
  - Router setup with Framer Motion AnimatePresence
  - Slide transitions (left/right/up/down)
  - Test on tablet for 60fps
  - Acceptance: Smooth page transitions, no jank
  - **Dependency:** Tablet ordered and received

- [ ] **Create Header component**
  - Logo
  - Current date display
  - Family avatars (placeholders)
  - Acceptance: Header renders, responsive

- [ ] **Build PersonCard component**
  - Person name (lowercase, bold)
  - Colored top border
  - Task list placeholder
  - Streak badge placeholder
  - Acceptance: 4 person cards render in 2x2 grid on tablet

- [ ] **Implement task checkboxes**
  - 48px touch target
  - Optimistic Zustand update
  - Queued Firestore write
  - Checkmark stroke animation
  - Acceptance: Tap feels instant, smooth animation, Firestore updates within 500ms
  - **Critical:** Test on tablet hardware

- [ ] **Build shared todos section**
  - Todo list display
  - Checkboxes (same as chores)
  - Add todo button (placeholder)
  - Acceptance: Todos render below person cards

### Calendar Integration

- [ ] **Set up Google Calendar OAuth**
  - OAuth flow implementation
  - Token storage in Firestore
  - Acceptance: User can connect Google Calendar account

- [ ] **Sync Google Calendar events**
  - Fetch events from Google Calendar API
  - Store in Firestore CalendarEvents collection
  - Poll every 15 minutes
  - Acceptance: Events appear in Firestore after sync

- [ ] **Build basic calendar widget (month view)**
  - Month grid display
  - Event dots on days with events
  - Color-coded by person
  - Acceptance: Current month shows with event indicators

### Photo Screensaver

- [ ] **Set up Google Photos OAuth**
  - OAuth flow implementation
  - Album selection in settings
  - Acceptance: User can connect Google Photos account

- [ ] **Build screensaver component**
  - Fullscreen photo slideshow
  - Crossfade transitions (10s per photo)
  - Ken Burns effect (zoom + pan)
  - Touch to wake
  - Acceptance: Activates after 5min idle, shows photos, touch returns to app

- [ ] **Implement idle detection**
  - Monitor user activity (touch, mouse, keyboard)
  - Trigger screensaver after 5min
  - Reset timer on activity
  - Acceptance: Screensaver activates automatically

---

## Week 3: Recognition & Polish

### Kudos System

- [ ] **Build Kudos picker modal**
  - Bottom sheet slide-up animation
  - Person selector
  - Category selector (effort, kindness, smart, helpful, funny)
  - Optional message input
  - Confirm button
  - Acceptance: Modal slides up smoothly, can select options

- [ ] **Implement kudos data flow**
  - Create kudos in Firestore
  - Update user's kudos count
  - Trigger celebration animation
  - Acceptance: Kudos saved, count increments, celebration triggers

- [ ] **Display kudos badges on person cards**
  - Show recent kudos count
  - Kudos icon + count
  - Acceptance: Badges appear on person cards after kudos given

- [ ] **Build profile view with kudos history**
  - Navigate to profile from person card
  - Display all kudos received
  - Group by date
  - Acceptance: Can view full kudos history for a person

### Streak Tracking

- [ ] **Implement streak logic**
  - Track consecutive task completions
  - Increment on completion
  - Reset on missed day
  - Cloud Function for daily reset (midnight)
  - Acceptance: Streak counts accurately across multiple days

- [ ] **Create streak badges**
  - 3 days: "Heating up! 🔥"
  - 5 days: "On a roll! ⚡"
  - 7 days: "Unstoppable! 🌟"
  - 10 days: "Champion! 👑"
  - Acceptance: Badges appear at correct milestones

- [ ] **Implement auto-kudos for streak milestones**
  - Generate auto-kudos at 3, 5, 7, 10 days
  - Type: 'streak-auto'
  - Trigger celebration
  - Acceptance: Auto-kudos created and celebrated at milestones

### Celebration Animations

- [ ] **Build celebration overlay component**
  - Fullscreen overlay
  - Background blur + scale main content
  - Modal with spring animation
  - Auto-dismiss after 2-3 seconds
  - Acceptance: Celebration appears, looks great, dismisses automatically

- [ ] **Implement celebration physics effects**
  - Choose 1-2 effects: ripple, morph, or bloom
  - Test performance on tablet
  - Fallback to minimal mode if FPS drops
  - Acceptance: Effects run at 60fps on target tablet
  - **Critical:** Must test on hardware

- [ ] **Add celebration sounds**
  - Joyful sound effect on celebration
  - Respect volume setting
  - Acceptance: Sound plays when celebration triggers, can be muted in settings

### Menu Animations

- [ ] **Implement bottom sheet animation**
  - Slide up from bottom
  - Spring physics
  - Backdrop blur
  - Touch outside to dismiss
  - Acceptance: Smooth slide-up/down, feels responsive

- [ ] **Implement side panel animation (settings)**
  - Slide in from right
  - Ease curve (not spring)
  - Backdrop dim
  - Acceptance: Settings panel slides in smoothly

---

## Week 4: Settings & Mobile

### Settings Panel

- [ ] **Build settings panel structure**
  - Slide-in panel component
  - Section headers
  - Navigation within settings
  - Acceptance: Settings panel renders all sections

- [ ] **Implement Family Settings**
  - Add/edit family members
  - Assign colors
  - Set roles (parent/child)
  - Acceptance: Can manage family members

- [ ] **Implement Display Settings**
  - Theme toggle (light/dark/auto)
  - Timezone selector
  - Calendar view preference
  - Acceptance: Settings persist, app respects choices

- [ ] **Implement Screensaver Settings**
  - Enable/disable toggle
  - Idle time slider (1-30 minutes)
  - Transition speed slider (5-30 seconds)
  - Google Photos album selector
  - Face detection toggle
  - Acceptance: All settings work, screensaver respects them

- [ ] **Implement Celebration Settings**
  - Enable/disable toggle
  - Volume slider (0-1)
  - Style selector (full/minimal)
  - Acceptance: Celebrations respect settings

- [ ] **Implement Notification Settings**
  - Push notifications toggle
  - Kudos notification toggle
  - Streak notification toggle
  - Event reminder toggle
  - Acceptance: Settings saved (notifications in Phase 2)

- [ ] **Implement Calendar Settings**
  - Default view (month/week/day)
  - Start of week (Sunday/Monday)
  - Show week numbers toggle
  - Acceptance: Calendar respects settings

- [ ] **Implement Privacy Settings**
  - Face detection toggle
  - AI features toggle
  - Data sharing preferences
  - Acceptance: Settings saved, app respects privacy choices

- [ ] **Implement Parent Controls**
  - PIN code setup (4-6 digits)
  - PIN entry for settings access
  - Allow children to give kudos toggle
  - Acceptance: PIN required to access settings (if set)

### Mobile Companion

- [ ] **Make dashboard responsive**
  - 1-column layout on mobile (< 1024px)
  - Touch-optimized spacing
  - Larger tap targets if needed
  - Acceptance: Dashboard works well on phone screen

- [ ] **Make calendar responsive**
  - Adjust month view for mobile
  - Swipe between months
  - Acceptance: Calendar usable on phone

- [ ] **Create mobile quick actions**
  - Floating action button
  - Quick add task
  - Quick add event
  - Quick give kudos
  - Acceptance: Can perform common actions quickly on mobile

### Sound & Polish

- [ ] **Add sound effects**
  - Checkbox click sound
  - Kudos chime
  - Celebration fanfare
  - Respect volume setting
  - Acceptance: Sounds play at appropriate times, can be muted

- [ ] **PWA configuration**
  - Web app manifest
  - Service worker for offline
  - Install prompt
  - Icons (192x192, 512x512)
  - Acceptance: Can install to home screen, works offline

---

## Week 5+: Smart Features

### Email-to-Calendar (Phase 2)

- [ ] **Set up email forwarding**
  - Configure email webhook (SendGrid, Mailgun, or Gmail API)
  - Endpoint: family@kitchensync.app
  - Forward to Cloud Function
  - Acceptance: Emails received by Cloud Function

- [ ] **Implement GPT-4 email parsing**
  - Cloud Function triggered by email
  - Send email body to OpenAI API
  - Prompt: Extract event details (title, date, time, recurrence)
  - Parse JSON response
  - Acceptance: Events extracted accurately from sample emails

- [ ] **Create draft event workflow**
  - Store parsed event as draft in Firestore
  - Show notification on dashboard
  - One-tap confirm to add to calendar
  - One-tap reject to dismiss
  - Acceptance: User can confirm/reject drafted events

### Smart Photo Curation

- [ ] **Implement AI photo filtering**
  - Cloud Function runs on new photos
  - Use ML Kit for face detection
  - Filter out: screenshots, receipts, low quality
  - Set `aiCurated: true` on passing photos
  - Acceptance: Screensaver only shows curated photos

- [ ] **Optimize photo curation performance**
  - Run curation in batches (not per-photo)
  - Use Cloud Vision API for quality detection
  - Cache results
  - Acceptance: Curation runs efficiently, doesn't slow down app

### Busy Week Alert

- [ ] **Implement schedule density analysis**
  - Cloud Function runs daily
  - Count events per day for next 7 days
  - Threshold: > 3 events/day = busy
  - Create alert if 3+ busy days in next week
  - Acceptance: Alert appears when schedule is packed

- [ ] **Display busy week banner**
  - Gentle banner on dashboard
  - "Next 3 days are packed 📅"
  - Link to calendar view
  - Dismiss button
  - Acceptance: Banner shows, links to calendar, can be dismissed

### Performance Optimization

- [ ] **Run performance audit**
  - Lighthouse PWA score
  - Test on tablet hardware
  - Measure: first render, page transitions, animations
  - Acceptance: All metrics meet performance budget (see technical.md)

- [ ] **Optimize bundle size**
  - Code splitting (lazy load routes)
  - Tree shaking
  - Remove unused dependencies
  - Font subsetting
  - Acceptance: < 500KB initial bundle (gzipped)

- [ ] **Optimize images**
  - Convert to WebP format
  - Generate thumbnails
  - Lazy load below fold
  - Acceptance: Images load quickly, don't block rendering

### Capacitor Wrapper

- [ ] **Add Capacitor to project**
  - Install Capacitor CLI
  - Initialize Android platform
  - Configure app name, icons
  - Acceptance: Can build APK

- [ ] **Implement haptic feedback**
  - Light haptic on checkbox toggle
  - Medium haptic on kudos given
  - Heavy haptic on celebration
  - Acceptance: Haptics work on Android device

- [ ] **Enable full-screen launcher mode**
  - Configure Capacitor for kiosk mode
  - Hide status bar
  - Prevent exit (optional, configurable)
  - Acceptance: App runs in full-screen mode

- [ ] **Deploy to tablet**
  - Build release APK
  - Sign APK
  - Install on Samsung Galaxy Tab A9+
  - Test all features
  - Acceptance: App runs smoothly on target tablet

---

## Ongoing Tasks

### Testing
- [ ] Write unit tests for streak calculation logic
- [ ] Write unit tests for batched write queue
- [ ] Write integration tests for Firestore security rules
- [ ] Manual testing on tablet after each feature

### Documentation
- [ ] Update `components.md` as components are built
- [ ] Update `status.md` weekly
- [ ] Document complex fixes in `fixes/` directory
- [ ] Update `decisions.md` when architectural decisions are made

### Performance Monitoring
- [ ] Monitor animation FPS on tablet (use DevTools)
- [ ] Check Firestore write counts (stay under budget)
- [ ] Monitor bundle size (warn if > 500KB)

---

**Document Version:** 1.0  
**Last Updated:** October 15, 2025  
**Owner:** Will

