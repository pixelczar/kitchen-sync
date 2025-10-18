import { useState, useEffect, useCallback } from 'react';
import { syncGoogleCalendarEvents } from '../lib/google-calendar';
import { useUsers } from './useUsers';
import { collection, query, where, getDocs, addDoc, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../lib/firebase';

export const useGoogleCalendarSync = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const { data: users } = useUsers();

  const syncGoogleCalendar = useCallback(async () => {
    const accessToken = localStorage.getItem('googleCalendarToken');
    if (!accessToken) {
      console.log('No Google Calendar token found');
      return;
    }

    if (!users || users.length === 0) {
      console.log('No users found for sync');
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
      const householdId = import.meta.env.VITE_HOUSEHOLD_ID || 'demo-family-001';
      
      console.log('Sync using household ID:', householdId);
      console.log('Primary user:', primaryUser);
      
      // Get selected calendar IDs from localStorage or use primary
      const savedCalendarIds = localStorage.getItem('selectedGoogleCalendarIds');
      const selectedCalendarIds = savedCalendarIds ? JSON.parse(savedCalendarIds) : ['primary'];
      
      // Fetch events from all selected calendars
      const allEvents = [];
      for (const calendarId of selectedCalendarIds) {
        try {
          const calendarEvents = await syncGoogleCalendarEvents(
            accessToken,
            householdId,
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
        where('householdId', '==', householdId),
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
      
    } catch (error) {
      console.error('Google Calendar sync failed:', error);
      setSyncError(error instanceof Error ? error.message : 'Sync failed');
    } finally {
      setIsSyncing(false);
    }
  }, [users]);

  // Auto-sync when connected
  useEffect(() => {
    const accessToken = localStorage.getItem('googleCalendarToken');
    if (!accessToken) return;

    // Initial sync after a short delay to ensure app is loaded
    const initialSyncTimeout = setTimeout(syncGoogleCalendar, 2000);

    // Set up interval for periodic sync (every 30 minutes to avoid quota issues)
    const interval = setInterval(syncGoogleCalendar, 30 * 60 * 1000); // 30 minutes

    return () => {
      clearTimeout(initialSyncTimeout);
      clearInterval(interval);
    };
  }, [syncGoogleCalendar]);

  return {
    syncGoogleCalendar,
    isSyncing,
    lastSyncTime,
    syncError,
  };
};
