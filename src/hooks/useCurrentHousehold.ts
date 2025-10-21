import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useHouseholds } from './useHouseholds';

export const useCurrentHousehold = () => {
  const { data: households, isLoading, error } = useHouseholds();
  const queryClient = useQueryClient();
  const [currentHouseholdId, setCurrentHouseholdId] = useState<string | null>(null);
  const [isSwitching, setIsSwitching] = useState(false);

  // Load saved household ID from localStorage
  useEffect(() => {
    const savedHouseholdId = localStorage.getItem('currentHouseholdId');
    if (savedHouseholdId) {
      setCurrentHouseholdId(savedHouseholdId);
    }

    // Listen for cross-hook/current-tab changes via custom event
    const handleHouseholdChanged = (e: Event) => {
      // Support both CustomEvent with detail and simple Event
      const custom = e as CustomEvent<{ householdId: string | null }>;
      const newId = custom?.detail?.householdId ?? localStorage.getItem('currentHouseholdId');
      if (newId !== currentHouseholdId) {
        setCurrentHouseholdId(newId);
        // Trigger a quick refresh of dependent queries in this hook instance
        queryClient.invalidateQueries({ queryKey: ['users'] });
        queryClient.invalidateQueries({ queryKey: ['householdUserCounts'] });
      }
    };

    // Listen for cross-tab storage updates as well
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'currentHouseholdId') {
        const newId = e.newValue;
        if (newId !== currentHouseholdId) {
          setCurrentHouseholdId(newId);
          queryClient.invalidateQueries({ queryKey: ['users'] });
          queryClient.invalidateQueries({ queryKey: ['householdUserCounts'] });
        }
      }
    };

    window.addEventListener('currentHouseholdChanged', handleHouseholdChanged as EventListener);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('currentHouseholdChanged', handleHouseholdChanged as EventListener);
      window.removeEventListener('storage', handleStorage);
    };
  }, [currentHouseholdId, queryClient]);

  // Auto-select household if user has only one
  useEffect(() => {
    if (households && households.length === 1 && !currentHouseholdId) {
      setCurrentHouseholdId(households[0].id);
      localStorage.setItem('currentHouseholdId', households[0].id);
    }
  }, [households, currentHouseholdId]);

  const currentHousehold = households?.find(h => h.id === currentHouseholdId) || null;

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
    
    // Clear family-specific sync timestamps to force fresh sync
    if (householdId) {
      const familySyncKey = `lastGoogleCalendarSync_${householdId}`;
      localStorage.removeItem(familySyncKey);
      console.log('🔄 Cleared sync timestamp for family:', householdId);
    }

    // Invalidate all relevant queries to force fresh data
    console.log('🔄 Invalidating queries...');
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['users'], refetchType: 'active' }),
      queryClient.invalidateQueries({ queryKey: ['householdUserCounts'], refetchType: 'active' }),
      queryClient.invalidateQueries({ queryKey: ['calendar-events'], refetchType: 'active' }),
    ]);
    
    // Small delay to ensure state updates propagate
    await new Promise(resolve => setTimeout(resolve, 50));

    // Broadcast the change to all hook instances in this tab
    try {
      window.dispatchEvent(new CustomEvent('currentHouseholdChanged', { detail: { householdId } }));
    } catch {
      // no-op if CustomEvent fails in env
      window.dispatchEvent(new Event('currentHouseholdChanged'));
    }

    // Explicitly refetch the new household's queries to ensure fresh data ASAP
    if (householdId) {
      await Promise.all([
        queryClient.refetchQueries({ queryKey: ['users', householdId], exact: true }),
        queryClient.refetchQueries({ queryKey: ['householdUserCounts'], exact: false }),
        queryClient.refetchQueries({ queryKey: ['calendar-events', householdId], exact: false }),
      ]);
    }
    
    console.log('✅ Household switch complete:', householdId);
    setIsSwitching(false);
  };

  // Check if user needs to set up their first household
  const needsSetup = !isLoading && (!households || households.length === 0);

  return {
    currentHousehold,
    currentHouseholdId,
    setHousehold,
    households: households || [],
    isLoading,
    isSwitching,
    needsSetup,
    error,
  };
};
