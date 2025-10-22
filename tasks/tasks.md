# KitchenSync - Implementation Tasks

## Week 1-2: MVP Foundation ✅ COMPLETE

### Project Setup ✅
- [x] **Initialize Vite + React + TypeScript project**
  - Acceptance: `npm run dev` starts dev server ✅
  - Acceptance: TypeScript strict mode enabled ✅
  
- [x] **Install and configure dependencies**
  - Dependencies: Tailwind CSS, Framer Motion, Zustand, React Query, Firebase SDK ✅
  - Acceptance: All imports work, no version conflicts ✅
  
- [x] **Set up Firebase project**
  - Create Firebase project ✅
  - Enable Firestore, Authentication, Cloud Storage ✅
  - Configure security rules (based on technical.md) ✅
  - Acceptance: Can read/write to Firestore from app ✅

- [x] **Configure environment variables**
  - Copy `.env.example` to `.env.local` ✅
  - Add Firebase config values ✅
  - Add Google API keys (placeholders initially) ✅
  - Acceptance: App connects to Firebase without errors ✅

### Design System ✅

- [x] **Implement Tailwind design tokens**
  - Add custom colors to `tailwind.config.js` ✅
  - Add custom fonts (Work Sans, Permanent Marker) ✅
  - Add spacing scale ✅
  - Acceptance: Can use `bg-yellow`, `text-charcoal`, etc. in components ✅

- [x] **Create base component library**
  - Button component (primary, secondary variants) ✅
  - Card component ✅
  - Checkbox component (48px touch target) ✅
  - Acceptance: Storybook or example page showing all variants ✅

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

### Calendar Integration ✅

- [x] **Set up Google Calendar OAuth**
  - OAuth flow implementation ✅
  - Token storage in Firestore ✅
  - Acceptance: User can connect Google Calendar account ✅

- [x] **Sync Google Calendar events**
  - Fetch events from Google Calendar API ✅
  - Store in Firestore CalendarEvents collection ✅
  - Poll every 30 minutes (optimized from 15 minutes) ✅
  - Acceptance: Events appear in Firestore after sync ✅

- [x] **Build basic calendar widget (month view)**
  - Month grid display ✅
  - Event dots on days with events ✅
  - Color-coded by person ✅
  - Acceptance: Current month shows with event indicators ✅

### Photo Screensaver ✅

- [x] **Set up Google Photos OAuth**
  - OAuth flow implementation ✅
  - Album selection in settings ✅
  - Acceptance: User can connect Google Photos account ✅

- [x] **Build screensaver component**
  - Fullscreen photo slideshow ✅
  - Crossfade transitions (10s per photo) ✅
  - Ken Burns effect (zoom + pan) ✅
  - Touch to wake ✅
  - Acceptance: Activates after 5min idle, shows photos, touch returns to app ✅

- [x] **Implement idle detection**
  - Monitor user activity (touch, mouse, keyboard) ✅
  - Trigger screensaver after 5min ✅
  - Reset timer on activity ✅
  - Acceptance: Screensaver activates automatically ✅

---

## Week 3: Recognition & Polish ✅ COMPLETE

### Kudos System ✅
- [x] **Build Kudos picker modal**
- [x] **Implement kudos data flow**
- [x] **Display kudos badges on person cards**
- [x] **Build profile view with kudos history**

### Streak Tracking ✅
- [x] **Implement streak logic**
- [x] **Create streak badges**
- [x] **Implement auto-kudos for streak milestones**

### Celebration Animations ✅
- [x] **Build celebration overlay component**
- [x] **Implement celebration physics effects**
- [x] **Add celebration sounds**

### Menu Animations ✅
- [x] **Implement bottom sheet animation**
- [x] **Implement side panel animation (settings)**

---

## Week 4: Google Integration & Calendar Optimization ✅ COMPLETE

### Google Calendar Integration ✅
- [x] **Google Calendar OAuth flow**
- [x] **Calendar selection with checkbox paradigm**
- [x] **Event sync from Google Calendar to Firestore**
- [x] **Color coding by calendar source**
- [x] **Event details modal with click-to-view**
- [x] **Timezone picker in settings**
- [x] **Current time line on today's column**
- [x] **Firebase sync optimization (95% reduction in operations)**
- [x] **Event deduplication and alignment fixes**
- [x] **Calendar time grid optimization (6am start, fixed all-day events)**

### Google Photos Integration ✅
- [x] **Google Photos OAuth flow**
- [x] **Photo fetching and screensaver integration**
- [x] **Ken Burns effect and transitions**

---

## Week 5: Final Polish & Branding

### Authentication & Login System

- [ ] **Create login page with authentication flow**
  - Design login page with KitchenSync branding
  - Implement Firebase Authentication
  - Handle login/logout states
  - Acceptance: Users can log in and access the app

- [ ] **Add KitchenSync branding to loaders**
  - Replace generic loading spinners with branded ones
  - Add KitchenSync logo to loading states
  - Consistent branding across all loading experiences
  - Acceptance: All loaders show KitchenSync branding

- [ ] **Add KitchenSync branding to login pages**
  - Brand OAuth callback pages
  - Brand Google Calendar/Photos connection flows
  - Consistent visual identity throughout auth flow
  - Acceptance: All auth-related pages show KitchenSync branding

- [ ] **Add KitchenSync branding to handoff pages**
  - Brand transition pages between features
  - Brand settings and configuration pages
  - Consistent navigation and branding
  - Acceptance: All handoff/transition pages show KitchenSync branding

### Todo & Kudos Rewards System

- [ ] **Design and implement rewards system for todo completion**
  - Define point values for different todo types
  - Implement points tracking in database
  - Display points on person cards
  - Acceptance: Users earn points for completing todos

- [ ] **Enhance kudos system with rewards integration**
  - Add point values to kudos giving
  - Integrate kudos with overall points system
  - Show points earned from kudos
  - Acceptance: Kudos give points to recipients

- [ ] **Implement points system for todo completion and kudos giving**
  - Create points calculation logic
  - Store points in user profiles
  - Display points history
  - Acceptance: Points are calculated and stored correctly

- [ ] **Create rewards catalog or achievement system**
  - Design achievement badges
  - Create rewards catalog UI
  - Implement achievement unlocking logic
  - Acceptance: Users can view and earn achievements

#### Rewards System Design Considerations

**Point Values (Suggested):**
- Daily chores: 5 points each
- Weekly chores: 10 points each
- Shared todos: 3 points each
- Kudos received: 2 points each
- Kudos given: 1 point each
- Streak milestones: 10-50 points

**Achievement Categories:**
- 🏆 Streak Master (7+ day streaks)
- 💪 Task Champion (100+ tasks completed)
- ❤️ Kindness King/Queen (50+ kudos given)
- 🌟 Team Player (100+ kudos received)
- 🎯 Consistency Pro (30+ day streak)
- 🚀 Speed Demon (10 tasks in one day)

**Rewards Ideas:**
- Choose family movie night
- Pick dinner menu
- Extra screen time
- Special family outing
- Choose weekend activity

### Two-Way Google Calendar Sync

- [ ] **Create events in app → Google Calendar**
  - Implement Google Calendar API create event endpoint
  - Handle OAuth token refresh
  - Acceptance: Can create events in app that appear in Google Calendar

- [ ] **Update events in app → Google Calendar**
  - Implement Google Calendar API update event endpoint
  - Handle sync conflicts
  - Acceptance: Can update events in app that sync to Google Calendar

- [ ] **Delete events in app → Google Calendar**
  - Implement Google Calendar API delete event endpoint
  - Handle cascade deletions
  - Acceptance: Can delete events in app that remove from Google Calendar

- [ ] **Handle sync conflicts and merge strategies**
  - Detect conflicts between app and Google Calendar
  - Implement merge resolution UI
  - Acceptance: Conflicts are detected and resolved gracefully

### Performance Optimization

- [ ] **Code-splitting for routes**
  - Implement dynamic imports for routes
  - Lazy load heavy components
  - Acceptance: Bundle size reduced by 30%+

- [ ] **Image optimization**
  - Convert to WebP format
  - Generate thumbnails
  - Lazy load below fold
  - Acceptance: Images load quickly, don't block rendering

- [ ] **Bundle size reduction**
  - Tree shaking unused code
  - Remove unused dependencies
  - Font subsetting
  - Acceptance: < 500KB initial bundle (gzipped)

### Tablet Deployment

- [ ] **Order Samsung Galaxy Tab A9+**
  - Critical for performance testing
  - Test all features on tablet hardware
  - Acceptance: Tablet ordered and received

- [ ] **Test all features on tablet**
  - Performance testing (60fps animations)
  - Touch optimization
  - Screen size optimization
  - Acceptance: All features work smoothly on tablet

- [ ] **Deploy to production**
  - Build release version
  - Deploy to tablet
  - Final testing
  - Acceptance: App running in production on tablet

---

## Summary

**Weeks 1-4 Complete!** ✅

- **Week 1-2:** MVP Foundation (Project setup, design system, state management, core UI)
- **Week 3:** Recognition & Polish (Kudos system, streak tracking, celebration animations)
- **Week 4:** Google Integration & Calendar Optimization (Google Calendar OAuth, Google Photos OAuth, calendar optimization, Firebase performance)

**Week 5 Focus:** Two-way sync, performance optimization, and tablet deployment

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

