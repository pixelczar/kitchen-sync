# KitchenSync - System Architecture

## Overview

KitchenSync is a web-first PWA built with React + TypeScript + Firebase. The architecture prioritizes **performance on low-end tablets** through careful state management and batched database writes.

**Core architectural principle:** Separate UI state (fast, local) from server state (slow, source of truth).

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     Client (Tablet/Mobile)                   │
│                                                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │              React Components                       │    │
│  │  (PersonCard, KudosPicker, Calendar, etc.)         │    │
│  └────────────────────────────────────────────────────┘    │
│                           │                                 │
│           ┌───────────────┴───────────────┐                │
│           │                               │                │
│  ┌────────▼────────┐           ┌─────────▼────────┐       │
│  │   Zustand       │           │   React Query     │       │
│  │  (UI State)     │           │ (Server State)    │       │
│  │                 │           │                   │       │
│  │ • Optimistic    │           │ • Polling (10s)   │       │
│  │   updates       │           │ • Caching         │       │
│  │ • Transitions   │           │ • Invalidation    │       │
│  │ • Celebrations  │           │                   │       │
│  └─────────────────┘           └──────────┬────────┘       │
│                                            │                │
└────────────────────────────────────────────┼────────────────┘
                                             │
                              ┌──────────────▼──────────────┐
                              │       Firebase              │
                              │                             │
                              │  ┌──────────────────────┐  │
                              │  │    Firestore         │  │
                              │  │  (Source of Truth)   │  │
                              │  │  • Batched writes    │  │
                              │  │  • 500ms buffer      │  │
                              │  └──────────────────────┘  │
                              │                             │
                              │  ┌──────────────────────┐  │
                              │  │   Cloud Functions    │  │
                              │  │  • Email parsing     │  │
                              │  │  • Photo curation    │  │
                              │  │  • Daily reset       │  │
                              │  └──────────────────────┘  │
                              │                             │
                              │  ┌──────────────────────┐  │
                              │  │  Cloud Storage       │  │
                              │  │  • Photos            │  │
                              │  └──────────────────────┘  │
                              │                             │
                              └─────────────┬───────────────┘
                                            │
                        ┌───────────────────┼───────────────────┐
                        │                   │                   │
              ┌─────────▼────────┐ ┌───────▼────────┐ ┌───────▼────────┐
              │  Google Calendar │ │ Google Photos  │ │   OpenAI       │
              │       API        │ │      API       │ │   GPT-4 API    │
              └──────────────────┘ └────────────────┘ └────────────────┘
```

---

## State Management Architecture

### Why This Matters

**The Problem:**  
Real-time Firestore listeners trigger React re-renders. On low-end tablets, this causes frame drops during animations. A smooth celebration animation becomes stuttery when Firestore updates fire mid-animation.

**The Solution:**  
Two-layer state management with batched writes and polling reads.

### Layer 1: Zustand (UI State)

**Purpose:** Immediate, optimistic updates for buttery-smooth UI

**Responsibilities:**
- Task completion state (before Firestore confirms)
- Active view/modal/panel state
- Page transition direction
- Celebration queue
- Background blur state

**Example:**
```typescript
// User taps checkbox
const handleTaskToggle = (taskId: string) => {
  // 1. Update Zustand IMMEDIATELY (no network delay)
  useUIStore.getState().toggleTask(taskId);
  
  // 2. Trigger celebration if appropriate
  if (shouldCelebrate) {
    useUIStore.getState().queueCelebration({
      type: 'task-complete',
      userId: task.assignedTo,
      taskName: task.title
    });
  }
  
  // 3. Queue Firestore write (batched, 500ms delay)
  queueFirestoreWrite(() => updateTaskInFirestore(taskId));
};
```

**UI renders from Zustand** → 60fps smooth, no network jank.

### Layer 2: React Query (Server State)

**Purpose:** Fetch, cache, and sync Firestore data

**Responsibilities:**
- Fetching tasks, users, kudos, calendar events
- Caching with smart invalidation
- Polling (not real-time listeners!)
- Background refetch on window focus
- Optimistic updates with rollback

**Why polling instead of real-time?**  
Real-time Firestore listeners (`onSnapshot`) trigger re-renders unpredictably. Polling gives us control over when updates happen—outside of animations.

**Example:**
```typescript
const { data: tasks } = useQuery({
  queryKey: ['tasks', householdId],
  queryFn: () => fetchTasksFromFirestore(householdId),
  refetchInterval: 10000, // Poll every 10s
  staleTime: 5000,         // Fresh for 5s
});

// Merge React Query data with Zustand optimistic updates
const displayTasks = useMemo(() => {
  const optimisticCompletions = useUIStore(state => state.localCompletedTasks);
  
  return tasks?.map(task => ({
    ...task,
    completed: optimisticCompletions.has(task.id) 
      ? !task.completed  // Flip if optimistically toggled
      : task.completed
  }));
}, [tasks, useUIStore(state => state.localCompletedTasks)]);
```

### Layer 3: Firestore (Source of Truth)

**Purpose:** Persistent storage, multi-device sync

**Responsibilities:**
- All data persistence
- Security rules enforcement
- Multi-device synchronization
- Historical data

**Batched Writes:**
```typescript
let writeQueue: (() => Promise<void>)[] = [];
let writeTimeout: NodeJS.Timeout | null = null;

const queueFirestoreWrite = (writeFn: () => Promise<void>) => {
  writeQueue.push(writeFn);
  
  if (writeTimeout) clearTimeout(writeTimeout);
  
  // Execute all queued writes after 500ms of inactivity
  writeTimeout = setTimeout(async () => {
    const batch = writeBatch(firestore);
    await Promise.all(writeQueue.map(fn => fn()));
    writeQueue = [];
    writeTimeout = null;
  }, 500);
};
```

**Why 500ms?**  
- User taps multiple checkboxes quickly → single batched write
- Reduces Firestore write costs
- Avoids animation interruption
- 500ms is imperceptible to users for background sync

---

## Data Flow

### Task Completion Flow

```
User taps checkbox
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  1. Zustand: toggleTask(taskId)                          │
│     • Immediate UI update                                │
│     • Checkbox shows checked                             │
│     • 0ms delay                                          │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  2. Check if celebration needed                          │
│     • Is this a streak milestone?                        │
│     • Queue celebration animation                        │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  3. Queue Firestore write (batched)                      │
│     • Added to write queue                               │
│     • Will execute in next 500ms                         │
└──────────────────────────────────────────────────────────┘
       │
       ▼ (500ms later)
┌──────────────────────────────────────────────────────────┐
│  4. Firestore batch write executes                       │
│     • Task updated in database                           │
│     • Available to other devices                         │
└──────────────────────────────────────────────────────────┘
       │
       ▼ (within 10s)
┌──────────────────────────────────────────────────────────┐
│  5. React Query polls, fetches updated tasks             │
│     • Merges with Zustand optimistic state               │
│     • Validates optimistic update was correct            │
└──────────────────────────────────────────────────────────┘
```

### Page Navigation Flow

```
User taps "Calendar"
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  1. Zustand: navigateTo('calendar', 'left')              │
│     • Set activeView = 'calendar'                        │
│     • Set transitionDirection = 'left'                   │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  2. Router updates, triggers Framer Motion               │
│     • Dashboard slides left (exit)                       │
│     • Calendar slides in from right (enter)              │
│     • 300ms animation, spring physics                    │
└──────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────┐
│  3. Calendar mounts, React Query fetches events          │
│     • Check cache first (if fresh, use cached)           │
│     • If stale, fetch from Firestore                     │
│     • Render calendar with events                        │
└──────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
App
├── AuthProvider (Firebase Auth context)
├── QueryProvider (React Query client)
└── Router
    ├── Dashboard (/)
    │   ├── Header
    │   │   ├── Logo
    │   │   ├── DateDisplay
    │   │   └── FamilyAvatars
    │   ├── PersonCardsGrid
    │   │   └── PersonCard (x4)
    │   │       ├── PersonName
    │   │       ├── TaskList
    │   │       │   └── TaskItem (checkbox + label)
    │   │       └── StreakBadge
    │   └── SharedTodos
    │       └── TodoItem (x many)
    │
    ├── Calendar (/calendar)
    │   ├── CalendarHeader
    │   │   └── ViewToggle (month/week/day)
    │   ├── MonthView
    │   │   └── DayCell (x ~30)
    │   │       └── EventDot
    │   ├── WeekView
    │   │   └── EventBlock
    │   └── DayView
    │       └── EventItem
    │
    ├── Profile (/profile/:userId)
    │   ├── ProfileHeader
    │   ├── StatsCards
    │   │   ├── CurrentStreak
    │   │   ├── LongestStreak
    │   │   └── TotalKudos
    │   ├── KudosHistory
    │   │   └── KudosItem (x many)
    │   └── CompletedTasksHistory
    │       └── TaskHistoryItem (x many)
    │
    └── Settings (/settings)
        ├── SettingsPanel (slide-in from right)
        ├── FamilySettings
        ├── DisplaySettings
        ├── ScreensaverSettings
        ├── CelebrationSettings
        ├── NotificationSettings
        ├── CalendarSettings
        ├── PrivacySettings
        └── ParentControls

Overlays (Portals)
├── KudosPicker (bottom sheet modal)
├── CelebrationAnimation (full-screen overlay)
├── Screensaver (full-screen, auto-activates)
└── QuickActionsMenu (bottom sheet)
```

---

## Module Boundaries

### `/src/components/` - Presentational Components
- Pure UI components
- No direct Firestore access
- Receive data via props
- Emit events via callbacks
- Examples: `PersonCard`, `Button`, `TaskItem`

### `/src/features/` - Feature Modules
- Business logic + components
- Can use Zustand and React Query
- Examples: `tasks/`, `kudos/`, `calendar/`

```
/src/features/tasks/
  ├── components/
  │   ├── TaskList.tsx
  │   └── TaskItem.tsx
  ├── hooks/
  │   ├── useTasks.ts (React Query)
  │   └── useTaskMutations.ts
  ├── store/
  │   └── taskUIStore.ts (Zustand slice)
  └── types.ts
```

### `/src/lib/` - Utilities & Integrations
- Firebase setup
- API clients (Google Calendar, Photos, OpenAI)
- Utility functions
- No React components

### `/src/stores/` - Global Zustand Stores
- `uiStore.ts` - UI state (modals, views, transitions)
- `celebrationStore.ts` - Celebration queue
- Combined into single root store

### `/src/hooks/` - Shared React Hooks
- Custom hooks used across features
- Examples: `useHousehold`, `useAuth`, `useToast`

---

## Information Architecture

```
KitchenSync App
│
├── Main Dashboard (/)
│   │
│   ├── View: Family overview
│   ├── Data: Tasks (assigned), Shared todos
│   ├── Actions: Toggle task, Give kudos, Quick add
│   └── Navigation: → Calendar, → Profile, → Settings
│
├── Calendar (/calendar)
│   │
│   ├── View: Month/Week/Day toggle
│   ├── Data: CalendarEvents (all family members)
│   ├── Actions: Add event, Edit event, Change view
│   └── Navigation: ← Dashboard, → Event detail
│
├── Profile (/profile/:userId)
│   │
│   ├── View: Individual stats & history
│   ├── Data: User, Kudos received, Task history
│   ├── Actions: (Read-only, mostly)
│   └── Navigation: ← Dashboard
│
├── Settings (/settings)
│   │
│   ├── View: All household settings
│   ├── Data: HouseholdSettings
│   ├── Actions: Update settings, Connect APIs
│   └── Navigation: ← Back to previous view
│
└── Overlays (React Portals)
    │
    ├── Kudos Picker (triggered from person card)
    ├── Celebration (triggered by milestone)
    ├── Screensaver (auto-trigger on idle)
    └── Quick Actions (triggered by FAB)
```

---

## Critical Architectural Decisions

### ADR-001: Batched Firestore Writes

**Decision:** Buffer Firestore writes for 500ms instead of writing immediately

**Context:**  
Real-time Firestore updates cause React re-renders during animations, leading to frame drops on budget Android tablets (Samsung Galaxy Tab A9+). Competitors (Skylight, Hearth) are buttery smooth because they control the entire stack.

**Consequences:**
- ✅ Maintains 60fps animations
- ✅ Reduces Firestore write costs (batch multiple updates)
- ✅ Better user experience (smooth interactions)
- ❌ 500ms delay before cross-device sync
- ❌ Potential data loss if app crashes before write executes (acceptable trade-off)

**Mitigation:**
- Zustand provides immediate UI feedback
- React Query invalidates cache after writes
- 500ms is imperceptible for background sync

### ADR-002: Polling Instead of Real-Time Listeners

**Decision:** Use React Query polling (10s interval) instead of Firestore `onSnapshot`

**Context:**  
Real-time listeners are the "Firebase way," but they trigger unpredictable re-renders that conflict with animations.

**Consequences:**
- ✅ Predictable update timing (outside animations)
- ✅ Simpler mental model (query-based, not event-based)
- ✅ Better performance on low-end hardware
- ❌ 10s delay for cross-device updates (vs instant with real-time)
- ❌ Slightly higher read costs (polling vs. listeners)

**Mitigation:**
- 10s is acceptable for family coordination use case
- Optimistic updates make local interactions instant
- Can reduce polling interval to 5s if needed

### ADR-003: Zustand Over Redux

**Decision:** Use Zustand for local state management instead of Redux

**Context:**  
Need lightweight, performant state for UI. Redux is overkill and adds boilerplate. Tablet can't afford heavy state libraries.

**Consequences:**
- ✅ Smaller bundle size (~1KB vs ~15KB)
- ✅ Simpler API (less boilerplate)
- ✅ Better TypeScript support out of the box
- ✅ Faster performance
- ❌ Less ecosystem tooling (fewer middleware options)
- ❌ Team may be less familiar with Zustand

**Mitigation:**
- Zustand API is simple, easy to learn
- Don't need Redux DevTools for this scale
- Can always migrate to Redux later if needed (unlikely)

### ADR-004: Web-First PWA, Capacitor Later

**Decision:** Build as PWA first, add Capacitor wrapper in Phase 2

**Context:**  
Fastest path to tablet deployment. PWA works immediately, Capacitor adds native features (haptics, launcher mode) when needed.

**Consequences:**
- ✅ Faster development (no native build complexity)
- ✅ Works on any device with a browser
- ✅ Easy testing (just open in browser)
- ✅ Can deploy to tablet Week 1
- ❌ No haptic feedback in Phase 1
- ❌ No full-screen launcher mode in Phase 1
- ❌ Relies on browser PWA support

**Mitigation:**
- Architecture supports Capacitor from day 1
- Adding Capacitor later is straightforward
- PWA features (offline, install prompt) work well on Android

---

## Performance Architecture

### Lazy Loading Strategy

```typescript
// Router with code splitting
const Calendar = lazy(() => import('./features/calendar/Calendar'));
const Profile = lazy(() => import('./features/profile/Profile'));
const Settings = lazy(() => import('./features/settings/Settings'));

// Main dashboard loaded immediately, others lazy
<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Dashboard />} />
    <Route path="/calendar" element={<Calendar />} />
    <Route path="/profile/:id" element={<Profile />} />
    <Route path="/settings" element={<Settings />} />
  </Routes>
</Suspense>
```

### Image Loading Strategy

```typescript
// Progressive image loading
<img
  src={thumbnailUrl}          // Low-res loads first
  data-src={fullResUrl}        // High-res lazy loaded
  loading="lazy"
  onLoad={() => swapToFullRes()}
/>
```

### Animation Performance

```typescript
// Prefer CSS transforms (GPU-accelerated)
.card-enter {
  transform: translateX(300px);  /* ✅ Good */
  opacity: 0;                    /* ✅ Good */
}

/* ❌ Avoid these during animations */
.card-enter-bad {
  left: 300px;      /* ❌ Triggers layout */
  width: 200px;     /* ❌ Triggers layout */
  filter: blur(5px); /* ❌ Heavy on low-end */
}
```

---

## Security Architecture

### Authentication Flow

```
1. User lands on app
   ↓
2. Check Firebase Auth state
   ↓
   ┌─ Not authenticated → Show login
   └─ Authenticated → Load household data
      ↓
3. Fetch user document from Firestore
   ↓
4. Get householdId from user doc
   ↓
5. Fetch household + members + tasks
   ↓
6. Render dashboard
```

### Authorization

**Firestore Security Rules enforce:**
- Users can only access their own household's data
- Parents can modify settings, children cannot
- All writes validated server-side

**Client-side checks:**
- Parent PIN for settings (convenience, not security)
- Role-based UI (hide admin features from children)

**Trust boundary:** Firestore Security Rules are the security boundary, not client code.

---

**Document Version:** 1.0  
**Last Updated:** October 15, 2025  
**Owner:** Will

