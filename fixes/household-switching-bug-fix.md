# Household Switching Bug Fix

## Problem Summary

When clicking on a Family unit under Account Status in the Settings view:
1. The active state of the list item would switch
2. BUT the Family Members listing would NOT update to show the correct members
3. The member count beneath the family name in "Your Families" was incorrect
4. Only after switching navigation tabs or doing a manual refresh would the data be correct

## Root Causes Identified

### 1. **React Query State Synchronization Issue**
When `currentHouseholdId` changes, React Query creates a **new query** with a new key. This new query starts with `undefined` data and enters a loading/fetching state. The UI was checking only `isSwitching` but not React Query's `isLoading` or `isFetching` states, so it would try to render with undefined or stale data.

```typescript
// The problem:
const displayUsers = isSwitching ? [] : users; // ❌ users might be undefined!
```

### 2. **`isSwitching` State Issue**
In `useCurrentHousehold.ts`, the `isSwitching` flag was being set to `false` immediately after setting the household ID, so it never stayed true long enough for the UI to show a loading state or wait for data to refresh.

```typescript
// BEFORE (broken)
setIsSwitching(true);
setCurrentHouseholdId(householdId);
// ... localStorage update
setIsSwitching(false); // ❌ Immediately false!
```

### 3. **No Query Invalidation**
When switching households, the `householdUserCounts` and `users` queries were not being invalidated, so React Query would sometimes serve stale cached data.

### 4. **Async Handler Not Awaited**
In several places, the `handleFamilySwitch` function was being called but not awaited, so the async operation wasn't completing before the UI tried to render.

## Fixes Applied

### 1. **`SettingsView.tsx` - Track React Query Loading States (CRITICAL FIX)**

The most important fix: We now track React Query's `isFetching` state in addition to our custom `isSwitching` flag. This ensures the UI shows a loading state until React Query has actually fetched and updated the component with new data.

```typescript
// Get isFetching from React Query
const { data: users, isLoading: usersLoading, isFetching: usersFetching } = useUsers();

// Combine all loading indicators
const isActuallySwitching = isSwitching || usersLoading || usersFetching;

// Use the combined state for UI decisions
const displayUsers = isActuallySwitching ? [] : users;
```

**Why this fixes it:**
- When `currentHouseholdId` changes, React Query creates a new query with a new key
- That new query immediately enters `isFetching` state
- The UI now respects this state and shows loading until the fetch completes
- Once data arrives, `isFetching` becomes false and the UI updates with correct data

All UI checks now use `isActuallySwitching` instead of just `isSwitching`:
- Family member list rendering
- Loading overlays
- Button disabled states
- Empty states

### 2. **`useCurrentHousehold.ts` - Made `setHousehold` Properly Async**

```typescript
const setHousehold = async (householdId: string | null) => {
  // Set switching state immediately
  setIsSwitching(true);
  
  console.log('🔄 Starting household switch to:', householdId);
  
  // Update state FIRST - this will cause queries to refetch with new key
  setCurrentHouseholdId(householdId);
  
  // Update localStorage
  if (householdId) {
    localStorage.setItem('currentHouseholdId', householdId);
  } else {
    localStorage.removeItem('currentHouseholdId');
  }
  
  // Invalidate all relevant queries to force fresh data
  console.log('🔄 Invalidating queries...');
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['users'], refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: ['householdUserCounts'], refetchType: 'active' }),
  ]);
  
  // Small delay to ensure state updates propagate
  await new Promise(resolve => setTimeout(resolve, 50));
  
  console.log('✅ Household switch initiated:', householdId);
  // UI will continue showing loading state via isFetching until queries complete
  setIsSwitching(false);
};
```

**Key improvements:**
- Made the function async
- Updates `currentHouseholdId` first, which triggers React Query to create new query instances
- Invalidates both `users` and `householdUserCounts` queries
- Sets `isSwitching` to false quickly, because the UI now tracks `isFetching` state
- React Query's `isFetching` keeps the UI in loading state until data arrives
- Added comprehensive logging for debugging

### 3. **`SettingsView.tsx` - Made Handlers Async**

```typescript
// Make handleFamilySwitch async
const handleFamilySwitch = async (householdId: string | null) => {
  await setHousehold(householdId);
};

// Updated handleDeleteFamily to await the switch
const handleDeleteFamily = async (householdId: string, householdName: string) => {
  if (confirm(`Are you sure you want to delete...`)) {
    try {
      await deleteHousehold.mutateAsync(householdId);
      if (householdId === currentHouseholdId) {
        const remainingHouseholds = allHouseholds?.filter(h => h.id !== householdId) || [];
        if (remainingHouseholds.length > 0) {
          await handleFamilySwitch(remainingHouseholds[0].id); // ✅ Now awaits
        } else {
          await handleFamilySwitch('demo-family-001'); // ✅ Now awaits
        }
      }
    } catch (error) {
      console.error('Failed to delete family:', error);
    }
  }
};
```

### 4. **`App.tsx` - Updated Family Setup Completion Handler**

```typescript
<FamilySetupModal
  isOpen={showFamilySetup}
  onClose={() => setShowFamilySetup(false)}
  onComplete={async (householdId) => {
    await setHousehold(householdId); // ✅ Now awaits
    setShowFamilySetup(false);
  }}
/>
```

### 5. **`useUsers.ts` - Enhanced Logging**

Added better logging to track when users are fetched for each household:

```typescript
console.log('📊 Database returned users for', currentHouseholdId, ':', users.length, users.map(u => u.name));
```

### 6. **`useHouseholdUserCounts.ts` - Enhanced Logging**

Added comprehensive logging to track member counts:

```typescript
console.log('🔢 Fetching household user counts for:', households.map(h => h.name));
// ... for each household ...
console.log(`🔢 Household "${household.name}" (${household.id}): ${snapshot.docs.length} users`);
console.log('🔢 Final counts:', counts);
```

## How It Works Now

1. **User clicks on a family unit** → `handleFamilySwitch(householdId)` is called
2. **`setHousehold` starts** → `isSwitching` becomes `true`
3. **State updates** → `currentHouseholdId` is set and saved to localStorage
4. **React Query detects change** → New query key `['users', newHouseholdId]` triggers query creation
5. **Query enters fetching state** → React Query sets `isFetching` to `true`
6. **UI shows loading state** → `isActuallySwitching` is true (combines `isSwitching`, `isLoading`, `isFetching`)
7. **Queries invalidated** → All `users` and `householdUserCounts` queries marked as stale
8. **Data fetched from Firestore** → React Query fetches users for the new household
9. **`isSwitching` becomes false** → But UI still shows loading via `isFetching`
10. **Query completes** → `isFetching` becomes `false`, data is now available
11. **UI updates** → `isActuallySwitching` is now `false`, so `displayUsers` shows new data
12. **Member counts update** → "Your Families" list shows correct counts for all households

**The key insight:** By tracking React Query's `isFetching` state, we ensure the UI doesn't render until React Query has actually updated the component with fresh data.

## Testing Checklist

To verify the fix works:

- [ ] Click on "16 Mulberry" family → Should show 3 members
- [ ] Click on "Fam 2" family → Should show 0 members
- [ ] Member counts under each family name should be correct (3 and 0)
- [ ] No need to refresh or switch tabs - data updates immediately
- [ ] Console logs should show:
  - "🔄 Starting household switch to: [household-id]"
  - "🔄 Invalidating queries..."
  - "🔥 useUsers queryFn called for household: [household-id]"
  - "📊 Database returned users for [household-id]: [count] [names]"
  - "🔢 Fetching household user counts..."
  - "✅ Household switch complete: [household-id]"

## Benefits

- ✅ **No more stale data** - Queries are invalidated and refetched, UI waits for fresh data
- ✅ **Proper loading states** - Combines `isSwitching`, `isLoading`, and `isFetching` for accurate state
- ✅ **No race conditions** - UI respects React Query's loading states until data arrives
- ✅ **Better debugging** - Comprehensive console logging to track the switching process
- ✅ **Consistent behavior** - Works the same across all components (Dashboard, Settings, etc.)
- ✅ **Leverages React Query** - Uses React Query's built-in state management instead of fighting it

## Files Modified

1. `src/hooks/useCurrentHousehold.ts` - Core fix for switching logic
2. `src/hooks/useUsers.ts` - Enhanced logging
3. `src/hooks/useHouseholdUserCounts.ts` - Enhanced logging
4. `src/features/settings/SettingsView.tsx` - Made handlers async
5. `src/App.tsx` - Made family setup handler async

