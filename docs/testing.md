# KitchenSync - Testing Strategy

## Testing Philosophy

**Performance is a feature.** Tests must verify not just correctness, but also speed and smoothness.

**Test pyramid:**
1. **Unit tests** (many) - Pure functions, business logic, utilities
2. **Integration tests** (some) - Firestore operations, API integrations
3. **Performance tests** (critical) - Animation FPS, load times, responsiveness
4. **Manual tests** (on tablet) - Touch interactions, visual polish, real-world scenarios

---

## Unit Testing

### Tools

- **Vitest** - Fast, Vite-native test runner
- **React Testing Library** - Component testing with user-centric queries
- **MSW** (Mock Service Worker) - API mocking

### What to Test

**Business Logic:**
- Streak calculation (consecutive completions, reset on missed day)
- Task recurrence logic (daily, weekly, monthly patterns)
- Kudos auto-generation for streaks
- Calendar clustering logic (if implemented)
- Date/time utilities (timezone handling, ISO 8601 parsing)

**State Management:**
- Zustand store actions (toggleTask, queueCelebration, navigateTo)
- Optimistic update logic
- State merging (Zustand + Firestore)

**Utilities:**
- Batched write queue (500ms batching)
- Date formatting
- Color contrast calculation (accessibility)

### Example Tests

```typescript
// src/lib/streaks.test.ts
import { describe, it, expect } from 'vitest';
import { calculateStreak, shouldResetStreak } from './streaks';

describe('calculateStreak', () => {
  it('increments streak on consecutive days', () => {
    const tasks = [
      { completedAt: '2025-10-14T10:00:00Z' },
      { completedAt: '2025-10-15T10:00:00Z' },
    ];
    expect(calculateStreak(tasks)).toBe(2);
  });

  it('resets streak on missed day', () => {
    const tasks = [
      { completedAt: '2025-10-10T10:00:00Z' },
      { completedAt: '2025-10-15T10:00:00Z' }, // 5-day gap
    ];
    expect(calculateStreak(tasks)).toBe(1);
  });

  it('handles timezone boundaries correctly', () => {
    // Test that 11:59 PM and 12:01 AM next day count as consecutive
    const tasks = [
      { completedAt: '2025-10-14T23:59:00-04:00' },
      { completedAt: '2025-10-15T00:01:00-04:00' },
    ];
    expect(calculateStreak(tasks)).toBe(2);
  });
});
```

```typescript
// src/stores/uiStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('UIStore', () => {
  beforeEach(() => {
    useUIStore.setState({ localCompletedTasks: new Set() });
  });

  it('toggles task in local state', () => {
    const { toggleTask, localCompletedTasks } = useUIStore.getState();
    
    toggleTask('task-1');
    expect(useUIStore.getState().localCompletedTasks.has('task-1')).toBe(true);
    
    toggleTask('task-1');
    expect(useUIStore.getState().localCompletedTasks.has('task-1')).toBe(false);
  });

  it('queues celebration', () => {
    const { queueCelebration } = useUIStore.getState();
    
    queueCelebration({ type: 'streak', userId: 'user-1', streakValue: 5 });
    
    const queue = useUIStore.getState().celebrationQueue;
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('streak');
  });
});
```

---

## Integration Testing

### What to Test

**Firestore Operations:**
- Security rules enforcement
- Batch writes execute correctly
- Query filters work (householdId, assignedTo, etc.)
- Optimistic updates reconcile with server state

**API Integrations:**
- Google Calendar OAuth flow
- Google Photos OAuth flow
- Event fetching and parsing
- Photo fetching and caching

**State Sync:**
- Zustand + Firestore consistency
- React Query invalidation after mutations
- Polling updates merge with optimistic state

### Tools

- **Firebase Emulator Suite** - Local Firestore/Auth for testing
- **Vitest** - Test runner
- **MSW** - Mock external APIs (Google, OpenAI)

### Example Tests

```typescript
// src/lib/firestore.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { initializeTestEnvironment, assertSucceeds, assertFails } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'kitchensync-test',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8'),
      },
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it('allows users to read their household tasks', async () => {
    const user = testEnv.authenticatedContext('user-1');
    // ... set up user doc with householdId ...
    
    const taskRef = user.firestore().collection('tasks').doc('task-1');
    await assertSucceeds(taskRef.get());
  });

  it('denies users from reading other household tasks', async () => {
    const user = testEnv.authenticatedContext('user-1');
    // ... set up user in household-A, task in household-B ...
    
    const taskRef = user.firestore().collection('tasks').doc('task-2');
    await assertFails(taskRef.get());
  });
});
```

---

## Performance Testing

### Critical Metrics

**Load Performance:**
- First render (cold start): < 1s
- First render (warm start): < 500ms
- Bundle size (gzipped): < 500KB

**Interaction Performance:**
- Checkbox response: < 100ms
- Page transition: < 300ms at 60fps
- Modal animations: 60fps

**Animation Performance:**
- Celebration: 60fps for 2-3s duration
- Screensaver transitions: 60fps

### How to Test

**Automated (Lighthouse CI):**
```bash
# Install Lighthouse CI
npm install -D @lhci/cli

# Run Lighthouse audit
lhci autorun --config=lighthouserc.json
```

**Manual (Chrome DevTools):**
1. Open app on tablet
2. Connect via USB debugging
3. Open `chrome://inspect`
4. Use Performance tab to record interactions
5. Check for long tasks (> 50ms)
6. Verify FPS in Rendering tab

**Performance Budget (Lighthouse):**
```json
// lighthouserc.json
{
  "ci": {
    "assert": {
      "preset": "lighthouse:recommended",
      "assertions": {
        "first-contentful-paint": ["error", {"maxNumericValue": 1000}],
        "interactive": ["error", {"maxNumericValue": 2000}],
        "speed-index": ["error", {"maxNumericValue": 1500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 200}]
      }
    }
  }
}
```

### Performance Tests Checklist

- [ ] First render < 1s on tablet (cold start)
- [ ] Dashboard → Calendar transition 60fps
- [ ] Checkbox toggle < 100ms response
- [ ] Celebration animation 60fps
- [ ] Screensaver transitions 60fps
- [ ] No memory leaks after 1hr use
- [ ] Bundle size < 500KB gzipped
- [ ] Lighthouse score > 90

---

## Manual Testing

### Why Manual Testing Matters

Automated tests can't verify:
- Touch interactions feel right (tap targets, gestures)
- Animations are delightful (not just smooth, but *pleasant*)
- Visual polish (alignment, spacing, colors)
- Real-world performance (battery, heat, WiFi issues)

**Manual testing is required on target tablet hardware.**

### Testing Checklist

#### Dashboard (Week 1-2)

**Visual:**
- [ ] Person cards display in 2x2 grid on tablet
- [ ] Person names are lowercase, bold, readable
- [ ] Colored top borders match person colors
- [ ] Spacing between cards feels balanced
- [ ] Streak badges are visible and readable

**Interaction:**
- [ ] Checkbox tap targets feel large enough (48px)
- [ ] Checkbox toggle is instant (< 100ms perceived)
- [ ] Checkmark stroke animation is smooth and satisfying
- [ ] Scrolling (if needed) is smooth
- [ ] No accidental taps on adjacent items

**Navigation:**
- [ ] Tap calendar icon → smooth slide to calendar
- [ ] Tap person card → smooth slide to profile
- [ ] Back button → smooth slide back to dashboard

#### Calendar (Week 1-2)

**Visual:**
- [ ] Month grid is clear and readable
- [ ] Event dots are color-coded by person
- [ ] Current day is highlighted
- [ ] Week/day views render correctly

**Interaction:**
- [ ] Tap day → shows events for that day
- [ ] Tap event → event details appear
- [ ] Swipe between months (if implemented) is smooth
- [ ] Add event button is easily tappable

#### Kudos System (Week 3)

**Visual:**
- [ ] Kudos picker slides up smoothly from bottom
- [ ] Backdrop blurs main content
- [ ] Category buttons are clear and tappable
- [ ] Message input is easy to use on tablet keyboard

**Interaction:**
- [ ] Long-press person card → kudos picker appears
- [ ] Select category → visual feedback
- [ ] Tap confirm → celebration triggers
- [ ] Tap outside → picker dismisses smoothly

#### Celebrations (Week 3)

**Visual:**
- [ ] Background blurs and scales back (subtle, not jarring)
- [ ] Celebration modal appears with spring animation
- [ ] Physics effects (ripple/morph) are delightful, not cheesy
- [ ] Auto-dismiss after 2-3s feels right

**Interaction:**
- [ ] Celebration doesn't block UI too long
- [ ] Sound effect is pleasant, not annoying
- [ ] Volume respects settings

#### Settings Panel (Week 4)

**Visual:**
- [ ] Panel slides in from right smoothly
- [ ] All sections are readable and organized
- [ ] Toggles and sliders are clear

**Interaction:**
- [ ] All toggles respond immediately
- [ ] Sliders are easy to adjust on touch
- [ ] PIN entry works correctly
- [ ] Scrolling within panel is smooth
- [ ] Close button/gesture works

#### Screensaver (Week 1-2)

**Visual:**
- [ ] Photos are high quality (not pixelated)
- [ ] Crossfades are smooth (10s per photo)
- [ ] Ken Burns effect is subtle and pleasant

**Interaction:**
- [ ] Activates after 5min idle (verify timing)
- [ ] Touch anywhere wakes app
- [ ] Return to dashboard is instant

---

## Test Data

### Sample Household

**Users:**
- Mom (Sarah) - Parent, color: yellow (#F7EA31)
- Dad (Mike) - Parent, color: red (#F7313F)
- Emma - Child, color: blue (#0A95FF)
- Jake - Child, color: purple (#3C0E4D)

**Tasks:**
- Sarah: "Review budget", "Call dentist"
- Mike: "Fix bike", "Water plants"
- Emma: "Feed cat", "Homework", "Practice piano"
- Jake: "Make bed", "Read 20 min", "Set table"

**Shared Todos:**
- "Get groceries"
- "Plan weekend trip"
- "Clean garage"

**Calendar Events:**
- Soccer practice (Emma) - Tuesdays 4pm
- Piano lesson (Emma) - Thursdays 3pm
- Parent-teacher conference - Oct 20, 2pm
- Family dinner - Every Sunday 6pm

**Photos:**
- 20+ family photos for screensaver testing
- Mix of indoor/outdoor, faces/no faces
- Test AI curation filters

### Seeding Test Data

```typescript
// scripts/seed-test-data.ts
import { firestore } from './lib/firebase';

async function seedTestData() {
  const householdId = 'demo-family-001';
  
  // Create users
  await firestore.collection('users').doc('user-sarah').set({
    id: 'user-sarah',
    householdId,
    name: 'sarah',
    role: 'parent',
    color: '#F7EA31',
    textColor: '#2D3748',
    currentStreak: 3,
    longestStreak: 7,
    kudosReceived: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });
  
  // Create tasks, events, etc.
  // ...
}

seedTestData();
```

---

## Continuous Integration (Future)

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

**Not implemented in Week 1, but architecture supports.**

---

## Testing Schedule

### Week 1-2: MVP Foundation
- Unit tests for streak calculation
- Unit tests for batched writes
- Manual testing on tablet (dashboard, calendar)
- Performance: First render, checkbox response

### Week 3: Recognition
- Unit tests for kudos logic
- Manual testing on tablet (kudos picker, celebrations)
- Performance: Celebration animations at 60fps

### Week 4: Settings
- Integration tests for settings persistence
- Manual testing on tablet (all settings)
- Performance: Settings panel slide-in

### Week 5+: Smart Features
- Integration tests for Google APIs
- Manual testing for email-to-calendar
- Final performance audit (Lighthouse CI)

---

## Acceptance Criteria Template

For each feature in [`tasks/tasks.md`](../tasks/tasks.md), acceptance criteria should include:

**Functional:**
- [ ] Feature works as specified
- [ ] Edge cases handled (empty states, errors)
- [ ] Data persists correctly

**Performance:**
- [ ] Meets performance budget (load time, FPS, latency)
- [ ] No memory leaks
- [ ] No console errors

**UX:**
- [ ] Touch interactions feel responsive
- [ ] Animations are smooth and delightful
- [ ] Visual design matches spec

**Accessibility:**
- [ ] Touch targets ≥ 44px
- [ ] Text contrast meets WCAG AA
- [ ] Works in landscape orientation

---

**Document Version:** 1.0  
**Last Updated:** October 15, 2025  
**Testing Status:** Framework defined, tests to be written during implementation

