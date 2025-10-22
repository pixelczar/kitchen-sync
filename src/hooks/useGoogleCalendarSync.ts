import { useState, useEffect, useCallback } from 'react';
import { syncGoogleCalendarEvents, getGoogleCalendarToken } from '../lib/google-calendar';
import { useUsers } from './useUsers';
import { useCurrentHousehold } from './useCurrentHousehold';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';

export const useGoogleCalendarSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { data: users } = useUsers();
  const { currentHouseholdId } = useCurrentHousehold();

  const syncGoogleCalendar = useCallback(async () => {
    try {
      // Skip sync for Demo family - they have their own demo data
      if (currentHouseholdId === 'demo-family-001') {
        return;
      }

      const accessToken = await getGoogleCalendarToken();
      if (!accessToken) {
        console.log('No Google Calendar token found');
        return;
      }

      if (!users || users.length === 0) {
        console.log('No users found for sync');
        return;
      }

      if (!currentHouseholdId) {
        return;
      }

      // Prevent multiple simultaneous syncs
      if (isSyncing) {
        console.log('Sync already in progress, skipping...');
        return;
      }

      setIsSyncing(true);
      setSyncError(null);

      try {
        console.log('Starting Google Calendar sync (READ-ONLY - will not modify your Google Calendar)...');
        
        // Use the first user as the primary user for sync
        const primaryUser = users[0];
        
        console.log('Primary user:', primaryUser);
        
        // Get selected calendar IDs from localStorage (family-specific) or use primary
        const familyCalendarKey = `selectedGoogleCalendarIds_${currentHouseholdId}`;
        const savedCalendarIds = localStorage.getItem(familyCalendarKey);
        const selectedCalendarIds = savedCalendarIds ? JSON.parse(savedCalendarIds) : ['primary'];
        
        
        // Fetch events from all selected calendars
        const allEvents = [];
        for (const calendarId of selectedCalendarIds) {
          try {
            const calendarEvents = await syncGoogleCalendarEvents(
              accessToken,
              currentHouseholdId,
              primaryUser.id,
              primaryUser.color,
              calendarId
            );
            allEvents.push(...calendarEvents);
          } catch (error) {
            console.error(`Failed to sync calendar ${calendarId}:`, error);
          }
        }
        
        const events = allEvents;

        console.log(`Fetched ${events.length} Google Calendar events`);
        console.log('Events to save:', events);
        
        // Get all existing Google Calendar events for this household in one query
        const existingEventsQuery = query(
          collection(firestore, 'calendar-events'),
          where('householdId', '==', currentHouseholdId),
          where('source', '==', 'google')
        );
        const existingSnapshot = await getDocs(existingEventsQuery);
        const existingEvents = new Map();
        existingSnapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.externalId) {
            existingEvents.set(data.externalId, { id: doc.id, ...data });
          }
        });

        console.log(`Found ${existingEvents.size} existing Google Calendar events in Firestore`);

        // Save events to Firestore using batch operations
        let savedCount = 0;
        let updatedCount = 0;
        let skippedCount = 0;
        
        for (const event of events) {
          try {
            const existingEvent = existingEvents.get(event.externalId);
            
            if (existingEvent) {
              // Check if event has actually changed
              const hasChanged = (
                existingEvent.title !== event.title ||
                existingEvent.startTime !== event.startTime ||
                existingEvent.endTime !== event.endTime ||
                existingEvent.description !== event.description
              );
              
              if (hasChanged) {
                await updateDoc(doc(firestore, 'calendar-events', existingEvent.id), {
                  ...event,
                  updatedAt: new Date().toISOString(),
                });
                console.log(`Updated existing event: ${event.title}`);
                updatedCount++;
              } else {
                console.log(`Skipped unchanged event: ${event.title}`);
                skippedCount++;
              }
            } else {
              // Event doesn't exist, create it
              const eventData = {
                ...event,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              };
              console.log('Saving new event to Firestore:', eventData);
              await addDoc(collection(firestore, 'calendar-events'), eventData);
              console.log(`Created new event: ${event.title}`);
              savedCount++;
            }
          } catch (eventError) {
            console.error(`Failed to save event ${event.title}:`, eventError);
          }
        }

        console.log(`Sync complete: ${savedCount} new, ${updatedCount} updated, ${skippedCount} unchanged`);
        setLastSyncTime(new Date());
        
        // Update family-specific sync timestamp
        const familySyncKey = `lastGoogleCalendarSync_${currentHouseholdId}`;
        localStorage.setItem(familySyncKey, Date.now().toString());
        
      } catch (error) {
        console.error('Google Calendar sync failed:', error);
        setSyncError(error instanceof Error ? error.message : 'Sync failed');
      } finally {
        setIsSyncing(false);
      }
    } catch (error) {
      console.error('Failed to get Google Calendar token:', error);
      setSyncError('Failed to get Google Calendar token');
      setIsSyncing(false);
    }
  }, [users, currentHouseholdId]);

  // Auto-sync when connected with smart logic
  useEffect(() => {
    const checkAndSync = async () => {
      try {
        const accessToken = await getGoogleCalendarToken();
        if (!accessToken) return;

      // Check if we've synced recently for this family (within last hour)
      const familySyncKey = `lastGoogleCalendarSync_${currentHouseholdId}`;
      const lastSync = localStorage.getItem(familySyncKey);
      const now = Date.now();
      const oneHour = 60 * 60 * 1000;
      
      if (lastSync && (now - parseInt(lastSync)) < oneHour) {
        return;
      }
      

        // Initial sync after a short delay to ensure app is loaded
        const initialSyncTimeout = setTimeout(() => {
          syncGoogleCalendar().then(() => {
            localStorage.setItem(familySyncKey, now.toString());
          });
        }, 2000);

        // Set up interval for periodic sync (every 2 hours to minimize API calls)
        const interval = setInterval(() => {
          syncGoogleCalendar().then(() => {
            localStorage.setItem(familySyncKey, Date.now().toString());
          });
        }, 2 * 60 * 60 * 1000); // 2 hours

        return () => {
          clearTimeout(initialSyncTimeout);
          clearInterval(interval);
        };
      } catch (error) {
        console.error('Failed to check Google Calendar token:', error);
      }
    };

    checkAndSync();
  }, [syncGoogleCalendar]);

  return {
    syncGoogleCalendar,
    isSyncing,
    lastSyncTime,
    syncError,
  };
};
