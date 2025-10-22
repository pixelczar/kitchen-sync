import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import { useCurrentHousehold } from './useCurrentHousehold';
import { generateDemoCalendarEvents } from '../lib/demo-calendar-data';
import type { CalendarEvent } from '../types';


export const useCalendarEvents = (startDate?: Date, endDate?: Date) => {
  const { currentHouseholdId } = useCurrentHousehold();
  
  return useQuery({
    queryKey: ['calendar-events', currentHouseholdId, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      try {
        if (!currentHouseholdId) {
          return [];
        }

        // Return demo data for Demo family
        if (currentHouseholdId === 'demo-family-001') {
          const demoEvents = generateDemoCalendarEvents();
          
          // Filter by date range if provided
          let filteredEvents = demoEvents;
          if (startDate && endDate) {
            filteredEvents = demoEvents.filter(event => {
              const eventStart = new Date(event.startTime);
              return eventStart >= startDate && eventStart <= endDate;
            });
          }
          
          return filteredEvents;
        }

        // Set a timeout to prevent hanging
        const timeoutPromise = new Promise<CalendarEvent[]>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 3000)
        );
        
        const queryPromise = (async () => {
          
          const q = query(
            collection(firestore, 'calendar-events'),
            where('householdId', '==', currentHouseholdId),
            orderBy('startTime', 'asc')
          );
          const snapshot = await getDocs(q);
          
          let events = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CalendarEvent));
          
          // Filter by date range if provided
          if (startDate && endDate) {
            events = events.filter(event => {
              const eventStart = new Date(event.startTime);
              return eventStart >= startDate && eventStart <= endDate;
            });
          }
          
          return events;
        })();
        
        const events = await Promise.race([queryPromise, timeoutPromise]);
        
        
        // Return real events from Firestore (no more stub fallback)
        return events;
      } catch (error) {
        console.warn('Calendar events query failed:', error);
        // Return empty array instead of stub data - let the UI handle empty state
        return [];
      }
    },
    enabled: !!currentHouseholdId,
    staleTime: 1000 * 60 * 10, // 10 minutes - calendar events change less frequently
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
  });
};

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();
  const { currentHouseholdId } = useCurrentHousehold();

  return useMutation({
    mutationFn: async (eventData: Partial<CalendarEvent>) => {
      // Remove undefined values (Firestore doesn't accept them)
      const cleanedData: Record<string, any> = {};
      Object.entries(eventData).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedData[key] = value;
        }
      });
      
      const newEvent = {
        ...cleanedData,
        householdId: currentHouseholdId,
        source: 'manual',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const docRef = await addDoc(collection(firestore, 'calendar-events'), newEvent);
      return { id: docRef.id, ...newEvent };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};

export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, updates }: { eventId: string; updates: Partial<CalendarEvent> }) => {
      // Remove undefined values (Firestore doesn't accept them)
      const cleanedUpdates: Record<string, any> = {};
      Object.entries(updates).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedUpdates[key] = value;
        }
      });
      
      const eventRef = doc(firestore, 'calendar-events', eventId);
      await updateDoc(eventRef, {
        ...cleanedUpdates,
        updatedAt: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      await deleteDoc(doc(firestore, 'calendar-events', eventId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
    },
  });
};
