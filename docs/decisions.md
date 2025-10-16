# Architecture Decision Records (ADRs)

This document tracks major architectural decisions for KitchenSync. Each decision includes context, the decision itself, consequences, and date.

---

## ADR-001: Batched Firestore Writes

**Date:** October 15, 2025  
**Status:** Accepted  
**Deciders:** Will

### Context

We need to support smooth animations (60fps) on budget Android tablets (Samsung Galaxy Tab A9+, ~$220). Real-time Firestore listeners trigger React re-renders during animations, causing visible frame drops and stuttering.

Competitors like Skylight and Hearth achieve buttery-smooth UX because they control the entire stack (proprietary hardware + software). We're building on web tech with Firebase backend, so we need a different approach.

### Decision

**Buffer Firestore writes for 500ms instead of writing immediately.**

Implementation:
1. User interactions update Zustand state immediately (< 10ms, synchronous)
2. Firestore writes are queued and executed in batches every 500ms
3. UI renders from Zustand (optimistic state), not Firestore
4. React Query polls Firestore every 10s to sync and validate

### Consequences

**Positive:**
- ✅ Maintains 60fps animations (UI updates are instant, no network dependency)
- ✅ Reduces Firestore write costs (batch multiple checkbox toggles into one write)
- ✅ Better user experience (checkboxes respond in < 100ms)
- ✅ Simpler animation code (no need to coordinate with async operations)

**Negative:**
- ❌ 500ms delay before cross-device sync (other devices see update after ~10s)
- ❌ Potential data loss if app crashes before batched write executes
- ❌ More complex state management (two layers: Zustand + Firestore)

**Mitigation:**
- 500ms delay is imperceptible for background sync in family coordination context
- Data loss risk is low (writes execute in 500ms, rare crash window)
- Zustand is straightforward and well-documented
- For critical operations (kudos, event creation), can bypass batching

### Alternatives Considered

1. **Real-time Firestore listeners (`onSnapshot`)** - Firebase's recommended pattern, but causes animation jank
2. **Debounced writes (2-5s)** - Longer delay, more data loss risk, minimal additional benefit
3. **IndexedDB + sync queue** - Over-engineered, adds complexity without performance benefit
4. **Redux Offline** - Heavy library, overkill for our needs

---

## ADR-002: Zustand Over Redux

**Date:** October 15, 2025  
**Status:** Accepted  
**Deciders:** Will

### Context

We need lightweight, performant client-side state management for:
- UI state (active view, modals, transitions)
- Optimistic updates (checkbox toggles before Firestore confirms)
- Celebration queue (which celebrations to show)

The app runs on budget tablets with limited resources. State management library must be fast and small.

### Decision

**Use Zustand for local UI state management instead of Redux or Context API.**

### Consequences

**Positive:**
- ✅ Small bundle size (~1KB vs ~15KB for Redux)
- ✅ Simple API with minimal boilerplate
- ✅ Excellent TypeScript support out of the box
- ✅ Fast performance (no unnecessary re-renders)
- ✅ Easy to learn (less onboarding friction)

**Negative:**
- ❌ Smaller ecosystem than Redux (fewer middleware options)
- ❌ No Redux DevTools integration (less critical for this app)
- ❌ Less team familiarity (but team is just Will for now)

**Mitigation:**
- Zustand's ecosystem is sufficient for our needs
- Can use browser DevTools + logging for debugging
- API is simple enough that future contributors can learn quickly
- Can migrate to Redux later if truly needed (unlikely)

### Alternatives Considered

1. **Redux Toolkit** - Industry standard, but too heavy for tablet performance requirements
2. **React Context + useReducer** - Built-in, but causes re-render issues at scale
3. **Jotai** - Similar to Zustand, but atomic state model is overkill for our use case
4. **Recoil** - Experimental, still in development, Facebook-specific patterns

---

## ADR-003: React Query Polling vs Real-Time Listeners

**Date:** October 15, 2025  
**Status:** Accepted  
**Deciders:** Will

### Context

Need to keep UI in sync with Firestore data across devices. Firebase recommends real-time listeners (`onSnapshot`), but they trigger unpredictable re-renders that conflict with animations.

Family coordination doesn't require instant cross-device updates (not a chat app). A few seconds of delay is acceptable.

### Decision

**Use React Query polling (10s interval) instead of Firestore real-time listeners.**

Implementation:
- React Query fetches from Firestore every 10 seconds
- `staleTime: 5000` - Consider data fresh for 5s
- `refetchInterval: 10000` - Poll every 10s
- Optimistic updates via Zustand give instant local feedback

### Consequences

**Positive:**
- ✅ Predictable update timing (happens between animations, not during)
- ✅ Simpler mental model (query-based, like REST APIs)
- ✅ Better performance on low-end tablets (controlled re-renders)
- ✅ Leverages React Query's excellent caching and invalidation

**Negative:**
- ❌ 10s delay for cross-device updates (vs instant with `onSnapshot`)
- ❌ Slightly higher Firestore read costs (polling vs listeners)
- ❌ Not using Firebase's "recommended" approach

**Mitigation:**
- 10s is perfectly acceptable for family coordination (checking off chores, adding events)
- Optimistic updates make local interactions feel instant
- Can reduce polling interval to 5s if users request it
- Read costs are minimal compared to value of smooth UX

### Alternatives Considered

1. **Firestore real-time listeners** - Instant updates, but causes animation jank (unacceptable)
2. **Hybrid: Polling + listeners** - Complex, doesn't solve jank problem
3. **WebSockets to custom backend** - Over-engineered, defeats purpose of using Firebase
4. **Longer polling (30s-60s)** - Too slow, users would perceive staleness

---

## ADR-004: Web-First PWA, Capacitor Later

**Date:** October 15, 2025  
**Status:** Accepted  
**Deciders:** Will

### Context

Need to deploy to tablet ASAP to test performance. Two paths:
1. Build native Android app with React Native or Capacitor from day 1
2. Build PWA first, add native wrapper later

Native wrappers provide features like haptic feedback, kiosk mode, full-screen, but add build complexity.

### Decision

**Build as PWA first (Phase 1), add Capacitor wrapper in Phase 2.**

Phase 1: Web app with PWA manifest, service worker, installable to home screen  
Phase 2: Capacitor wrapper for native features (haptics, launcher mode)

### Consequences

**Positive:**
- ✅ Faster initial development (no Android build toolchain)
- ✅ Can test on tablet in Week 1 (just open in browser)
- ✅ Works on any device (phones, tablets, desktop)
- ✅ Easier iteration (refresh page vs rebuild APK)
- ✅ PWA features (offline, install) work well on Android

**Negative:**
- ❌ No haptic feedback in Phase 1 (nice-to-have, not critical)
- ❌ No full-screen kiosk mode in Phase 1 (can add in Phase 2)
- ❌ Relies on browser PWA support (good on Android, varies on iOS)

**Mitigation:**
- Architecture supports Capacitor from day 1 (no refactoring needed)
- Adding Capacitor is straightforward (well-documented, widely used)
- Phase 1 haptics can be simulated with CSS `:active` states and animations
- Kiosk mode is Phase 2 feature, not MVP requirement

### Alternatives Considered

1. **React Native** - Different component model, can't reuse web components, steeper learning curve
2. **Capacitor from day 1** - Slower development, harder testing, overkill for MVP
3. **Electron** - Desktop-focused, terrible for touch/mobile
4. **Native Android (Kotlin/Java)** - Can't leverage React expertise, 10x more work

---

## ADR-005: (Template for Future Decisions)

**Date:** _TBD_  
**Status:** _Proposed | Accepted | Deprecated | Superseded_  
**Deciders:** _Who was involved?_

### Context

_What is the issue we're facing? What constraints exist? Why does this decision matter?_

### Decision

_What are we deciding to do?_

### Consequences

**Positive:**
- ✅ _What are the benefits?_

**Negative:**
- ❌ _What are the drawbacks?_

**Mitigation:**
- _How do we address the negatives?_

### Alternatives Considered

1. **Alternative 1** - _Why not this?_
2. **Alternative 2** - _Why not this?_

---

## Decision Log

| ADR | Title | Date | Status |
|-----|-------|------|--------|
| ADR-001 | Batched Firestore Writes | Oct 15, 2025 | Accepted |
| ADR-002 | Zustand Over Redux | Oct 15, 2025 | Accepted |
| ADR-003 | React Query Polling vs Real-Time | Oct 15, 2025 | Accepted |
| ADR-004 | Web-First PWA, Capacitor Later | Oct 15, 2025 | Accepted |

---

**Note:** Update this document whenever making significant architectural decisions. Link to specific ADRs from code comments when implementing the decision.

