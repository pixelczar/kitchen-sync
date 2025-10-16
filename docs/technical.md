# KitchenSync - Technical Specifications

## Tech Stack

### Frontend

**React 18 + TypeScript**
- Why: Type safety, component reusability, large ecosystem
- Version: React 18.2+ (concurrent features for performance)
- TypeScript: Strict mode enabled

**Vite**
- Why: Fast dev server, optimized builds, better than CRA
- Version: 5.x
- Plugins: React, PWA

**Tailwind CSS**
- Why: Utility-first, fast styling, small bundle with purge
- Version: 3.x
- Custom config for design system tokens

**Framer Motion**
- Why: Physics-based animations, declarative API
- Version: 11.x
- **Critical:** Use carefully - expensive on low-end tablets
- Test every animation on target hardware

**Zustand**
- Why: Lightweight state management, simple API, performant
- Version: 4.x
- Used for: UI state, optimistic updates, local state
- Not used for: Server data (that's React Query)

**React Query (TanStack Query)**
- Why: Server state management, caching, polling
- Version: 5.x
- Used for: Firestore data fetching, Google API data
- Polling interval: 10s (instead of real-time to avoid jank)

### Backend

**Firebase**
- Authentication: Email/password, Google OAuth
- Firestore: NoSQL database (batched writes for performance)
- Cloud Storage: Photo storage
- Cloud Functions: Email-to-calendar parsing, AI curation
- Hosting: PWA deployment

**APIs**

**Google Calendar API:**
- OAuth 2.0 authentication
- Read/write calendar events
- Sync multiple calendars per household

**Google Photos API:**
- OAuth 2.0 authentication
- Read-only access to selected albums
- Fetch photos for screensaver

**OpenAI GPT-4:**
- Email parsing for calendar events
- Photo curation (quality filtering)
- Smart features (busy week detection)

### Deployment

**PWA (Phase 1):**
- Service worker for offline support
- Web app manifest
- Install prompt for tablet home screen

**Capacitor (Phase 2):**
- Native wrapper for Android
- Access to: haptic feedback, full-screen mode, launcher mode
- Published to: Direct APK download, Google Play (maybe)

---

## Data Models

### Key Architectural Decisions

1. **`householdId` everywhere** - Multi-family support from day 1 (even if UI doesn't expose it yet)
2. **ISO 8601 date strings** - Firestore queryable, timezone-safe
3. **Zustand = UI state, Firestore = source of truth** - Critical for performance
4. **Batched writes** - Avoid real-time sync jank during animations

### User

```typescript
interface User {
  id: string;                    // Firebase Auth UID
  householdId: string;           // Which family this user belongs to
  name: string;                  // "Emma", "Jake", "Mom", "Dad"
  role: 'parent' | 'child';      // Determines permissions
  color: string;                 // #F7EA31, #F7313F, #0A95FF, #3C0E4D
  textColor: string;             // For contrast on colored backgrounds
  currentStreak: number;         // Current consecutive days
  longestStreak: number;         // Personal record
  kudosReceived: number;         // Total kudos count
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

**Firestore path:** `/users/{userId}`

**Indexes needed:**
- `householdId` (for querying all family members)

### Task

```typescript
interface Task {
  id: string;                    // Auto-generated
  householdId: string;           // Which family
  title: string;                 // "Feed the cat", "Take out trash"
  type: 'chore' | 'todo';        // Chore = person-specific, todo = shared
  assignedTo?: string;           // User ID (optional for todos)
  completed: boolean;            // Current state
  completedAt?: string;          // ISO 8601 when completed
  streak?: number;               // For chores only
  recurring?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    days?: number[];             // [0-6] for weekly (0 = Sunday)
    interval?: number;           // Every N days/weeks/months
  };
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

**Firestore path:** `/tasks/{taskId}`

**Indexes needed:**
- `householdId` + `assignedTo` + `completed`
- `householdId` + `type` + `completed`

**Business logic:**
- Daily reset at midnight (Cloud Function)
- Streak increments on consecutive completions
- Streak resets on missed day

### Kudos

```typescript
interface Kudos {
  id: string;                    // Auto-generated
  householdId: string;           // Which family
  from: string;                  // User ID who gave kudos
  to: string;                    // User ID who received kudos
  type: 'effort' | 'kindness' | 'smart' | 'helpful' | 'funny' | 'streak-auto';
  message: string;               // "Great job on homework!" or auto-generated
  emoji: string;                 // 💪, ❤️, 🧠, 🤝, 😂, 🔥
  timestamp: string;             // ISO 8601
  streakValue?: number;          // If type = 'streak-auto', what streak triggered it
}
```

**Firestore path:** `/kudos/{kudosId}`

**Indexes needed:**
- `householdId` + `to` + `timestamp` (descending)
- `householdId` + `timestamp` (descending)

### CalendarEvent

```typescript
interface CalendarEvent {
  id: string;                    // Auto-generated or Google Calendar event ID
  householdId: string;           // Which family
  title: string;                 // "Soccer practice", "Parent-teacher conference"
  startTime: string;             // ISO 8601
  endTime: string;               // ISO 8601
  assignedTo: string;            // User ID (whose calendar color to use)
  color: string;                 // Person's color
  cluster?: string;              // "school mornings", "soccer nights" (AI-generated)
  source: 'google' | 'manual';   // Where it came from
  externalId?: string;           // Google Calendar event ID
  createdAt: string;             // ISO 8601
  updatedAt: string;             // ISO 8601
}
```

**Firestore path:** `/calendar-events/{eventId}`

**Indexes needed:**
- `householdId` + `startTime` (ascending)
- `householdId` + `assignedTo` + `startTime` (ascending)

**Sync strategy:**
- Poll Google Calendar API every 15 minutes
- Update Firestore with changes
- Conflict resolution: Google Calendar is source of truth

### Photo

```typescript
interface Photo {
  id: string;                    // Auto-generated
  householdId: string;           // Which family
  url: string;                   // Firebase Storage URL or Google Photos URL
  thumbnailUrl?: string;         // Optimized for screensaver
  source: 'google-photos' | 'upload';
  takenAt?: string;              // ISO 8601 (from EXIF or Google Photos)
  uploadedAt: string;            // ISO 8601
  faces?: string[];              // User IDs detected in photo (for smart curation)
  tags?: string[];               // AI-generated tags
  aiCurated: boolean;            // Passed quality filters?
}
```

**Firestore path:** `/photos/{photoId}`

**Indexes needed:**
- `householdId` + `aiCurated` + `takenAt` (descending)

**Curation logic (Cloud Function):**
- Run ML Kit face detection
- Filter out: screenshots, receipts, low quality
- Only include: photos with faces, good lighting, positive moments

### Household

```typescript
interface Household {
  id: string;                    // Auto-generated
  name: string;                  // "The Smith Family"
  members: string[];             // Array of user IDs
  createdAt: string;             // ISO 8601
  settings: HouseholdSettings;   // Nested object
}
```

**Firestore path:** `/households/{householdId}`

### HouseholdSettings

```typescript
interface HouseholdSettings {
  // Display
  timezone: string;              // 'America/New_York'
  theme: 'light' | 'dark' | 'auto';
  
  // Screensaver
  screensaverEnabled: boolean;
  screensaverIdleMinutes: number;         // default: 5
  screensaverTransitionSeconds: number;   // default: 10
  photoAlbumIds: string[];                // Google Photos album IDs
  
  // Celebrations
  celebrationsEnabled: boolean;
  celebrationVolume: number;              // 0-1
  celebrationStyle: 'full' | 'minimal';   // full animations or simple
  
  // Notifications
  pushNotificationsEnabled: boolean;
  notifyOnKudos: boolean;
  notifyOnStreaks: boolean;
  notifyOnEventReminders: boolean;
  
  // Calendar
  calendarView: 'month' | 'week' | 'day'; // default view
  startOfWeek: 0 | 1;                     // Sunday or Monday
  showWeekNumbers: boolean;
  
  // Family
  parentPinCode?: string;                 // SHA-256 hashed
  allowChildrenToGiveKudos: boolean;
  
  // Privacy
  photoFaceDetection: boolean;
  shareDataWithAI: boolean;               // for smart features
}
```

---

## State Management Architecture

**Critical for performance.** This is the most important architectural decision.

### The Problem

Real-time Firestore listeners trigger React re-renders during animations, causing frame drops on low-end Android tablets. We need 60fps animations, but Firestore updates during a celebration animation would cause stutter.

### The Solution

**Two-layer state management:**

1. **Zustand (UI State)** - Immediate, optimistic updates for UI
2. **Firestore (Source of Truth)** - Batched writes, polling reads

### Zustand Store

```typescript
interface UIStore {
  // Local optimistic updates
  localCompletedTasks: Set<string>;      // Task IDs completed locally
  celebrationQueue: Celebration[];       // Queued celebrations
  
  // UI-only state
  isBlurred: boolean;                    // Background blur during celebration
  activeModal: string | null;            // Which modal is open
  activeView: 'dashboard' | 'calendar' | 'profile' | 'settings';
  
  // Transitions
  transitionDirection: 'left' | 'right' | 'up' | 'down';
  
  // Actions
  toggleTask: (taskId: string) => void;
  queueCelebration: (celebration: Celebration) => void;
  navigateTo: (view: string, direction: string) => void;
  syncWithFirestore: (firestoreData: any) => void;
}
```

**Created with:**
```typescript
import { create } from 'zustand';

const useUIStore = create<UIStore>((set) => ({
  localCompletedTasks: new Set(),
  celebrationQueue: [],
  isBlurred: false,
  activeModal: null,
  activeView: 'dashboard',
  transitionDirection: 'left',
  
  toggleTask: (taskId) => set((state) => {
    const newSet = new Set(state.localCompletedTasks);
    if (newSet.has(taskId)) {
      newSet.delete(taskId);
    } else {
      newSet.add(taskId);
    }
    return { localCompletedTasks: newSet };
  }),
  
  queueCelebration: (celebration) => set((state) => ({
    celebrationQueue: [...state.celebrationQueue, celebration]
  })),
  
  navigateTo: (view, direction) => set({
    activeView: view,
    transitionDirection: direction
  }),
  
  syncWithFirestore: (firestoreData) => set({
    // Merge Firestore data with local state
    // Local optimistic updates take precedence
  })
}));
```

### Firestore Batched Writes

```typescript
// Queue for batching writes
let writeQueue: (() => Promise<void>)[] = [];
let writeTimeout: NodeJS.Timeout | null = null;

const queueFirestoreWrite = (writeFn: () => Promise<void>) => {
  writeQueue.push(writeFn);
  
  // Clear existing timeout
  if (writeTimeout) {
    clearTimeout(writeTimeout);
  }
  
  // Batch writes every 500ms
  writeTimeout = setTimeout(async () => {
    const batch = writeBatch(firestore);
    const writes = [...writeQueue];
    writeQueue = [];
    
    // Execute all writes in batch
    for (const write of writes) {
      await write();
    }
    
    writeTimeout = null;
  }, 500);
};

// Usage
const updateTask = async (taskId: string, updates: Partial<Task>) => {
  // 1. Update Zustand immediately (optimistic)
  useUIStore.getState().toggleTask(taskId);
  
  // 2. Queue Firestore write (batched)
  queueFirestoreWrite(async () => {
    const taskRef = doc(firestore, 'tasks', taskId);
    await updateDoc(taskRef, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  });
};
```

### React Query (Server State)

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Poll instead of real-time to avoid animation jank
const useTasks = (householdId: string) => {
  return useQuery({
    queryKey: ['tasks', householdId],
    queryFn: async () => {
      const q = query(
        collection(firestore, 'tasks'),
        where('householdId', '==', householdId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Task[];
    },
    refetchInterval: 10000, // Poll every 10s
    staleTime: 5000,         // Consider fresh for 5s
  });
};

// Mutations update Zustand + queue Firestore write
const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ taskId, updates }: { taskId: string; updates: Partial<Task> }) => {
      // Optimistic update
      useUIStore.getState().toggleTask(taskId);
      
      // Queue Firestore write
      await updateTask(taskId, updates);
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });
};
```

---

## Performance Requirements

### Performance Budget

**Critical metrics:**
- First render: < 1 second
- Page transition: < 300ms at 60fps
- Checkbox response: < 100ms
- Celebration animation: 60fps (2-3 second duration)
- Firestore writes: < 50/minute

**Target device:**
- Samsung Galaxy Tab A9+ (11")
- Android 13
- Budget hardware (must optimize aggressively)

### Optimization Strategies

1. **Lazy load routes** - Code splitting for calendar, settings
2. **Image optimization** - WebP format, lazy loading, thumbnails
3. **Font subsetting** - Only include used characters
4. **Framer Motion sparingly** - CSS transitions where possible
5. **Virtualization** - For long lists (calendar events, kudos history)
6. **Memoization** - React.memo, useMemo for expensive calculations
7. **Debouncing** - Search inputs, resize handlers

### Monitoring

**Development:**
- React DevTools Profiler
- Chrome Performance tab
- Lighthouse (PWA score)

**Production:**
- Firebase Performance Monitoring
- Error tracking (Sentry or Firebase Crashlytics)
- Custom metrics: animation frame rate, interaction latency

---

## API Integration

### Google Calendar API

**OAuth Flow:**
1. User clicks "Connect Google Calendar"
2. Redirect to Google OAuth consent screen
3. Request scopes: `calendar.readonly`, `calendar.events`
4. Receive access token + refresh token
5. Store tokens in Firestore (encrypted)

**Sync Strategy:**
- Poll every 15 minutes
- Use `syncToken` for incremental updates
- Update Firestore with changes
- Display in UI via React Query

**Rate Limits:**
- 1,000,000 queries/day (way more than needed)
- 10 queries/second/user

### Google Photos API

**OAuth Flow:**
1. User clicks "Connect Google Photos"
2. Redirect to Google OAuth consent screen
3. Request scopes: `photoslibrary.readonly`
4. Receive access token + refresh token

**Sync Strategy:**
- User selects albums in settings
- Fetch photos from selected albums
- Store metadata in Firestore
- Display URLs directly from Google Photos
- Refresh daily (Cloud Function)

**Rate Limits:**
- 10,000 requests/day (generous)
- Batch requests where possible

### OpenAI API

**Email-to-Calendar:**
- Cloud Function triggered by email webhook
- Send email body to GPT-4
- Prompt: Extract event details (title, date, time, recurrence)
- Return structured JSON
- Create draft event in Firestore

**Cost:**
- ~$0.01 per email parsed
- Estimated: $5/month for active family

---

## Security

### Firebase Security Rules

**Firestore:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own household data
    match /tasks/{taskId} {
      allow read, write: if request.auth != null && 
        resource.data.householdId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.householdId;
    }
    
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /households/{householdId} {
      allow read, write: if request.auth != null && 
        householdId == get(/databases/$(database)/documents/users/$(request.auth.uid)).data.householdId;
    }
  }
}
```

**Cloud Storage:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /households/{householdId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### Authentication

- Email/password with strong password requirements
- Google OAuth as alternative
- Parent PIN for settings access (client-side only, not security boundary)
- Session timeout: 30 days

### Data Privacy

- No analytics without user consent
- Google Photos access: read-only, user-selected albums only
- AI features: opt-in via settings
- Data export: JSON download of all household data

---

## Build & Deployment

### Development

```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run lint         # ESLint
npm run test         # Vitest unit tests
```

### Environment Variables

See `.env.example` for required variables.

**Development:** `.env.local`  
**Production:** Firebase environment config

### CI/CD

**GitHub Actions (future):**
1. Lint on every PR
2. Test on every PR
3. Deploy to Firebase Hosting on merge to `main`
4. Deploy Cloud Functions on merge to `main`

### PWA Configuration

**Vite PWA Plugin:**
```typescript
import { VitePWA } from 'vite-plugin-pwa';

VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
  manifest: {
    name: 'KitchenSync',
    short_name: 'KitchenSync',
    description: 'Family dashboard for coordination and connection',
    theme_color: '#F7EA31',
    background_color: '#FAF8F3',
    display: 'standalone',
    orientation: 'landscape',
    icons: [
      {
        src: 'pwa-192x192.png',
        sizes: '192x192',
        type: 'image/png'
      },
      {
        src: 'pwa-512x512.png',
        sizes: '512x512',
        type: 'image/png'
      }
    ]
  }
});
```

---

**Document Version:** 1.0  
**Last Updated:** October 15, 2025  
**Owner:** Will

