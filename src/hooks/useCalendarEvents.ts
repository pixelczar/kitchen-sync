import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import type { CalendarEvent } from '../types';

const HOUSEHOLD_ID = import.meta.env.VITE_HOUSEHOLD_ID || 'demo-family-001';


export const useCalendarEvents = (startDate?: Date, endDate?: Date) => {
  return useQuery({
    queryKey: ['calendar-events', HOUSEHOLD_ID, startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      try {
        // Set a timeout to prevent hanging
        const timeoutPromise = new Promise<CalendarEvent[]>((_, reject) => 
          setTimeout(() => reject(new Error('Query timeout')), 3000)
        );
        
        const queryPromise = (async () => {
          console.log('Querying Firestore for calendar events...');
          console.log('Household ID:', HOUSEHOLD_ID);
          
          const q = query(
            collection(firestore, 'calendar-events'),
            where('householdId', '==', HOUSEHOLD_ID),
            orderBy('startTime', 'asc')
          );
          const snapshot = await getDocs(q);
          console.log('Firestore snapshot size:', snapshot.size);
          console.log('Firestore docs:', snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
          
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
        
        console.log('Calendar events from Firestore:', events.length, 'events');
        console.log('Events:', events);
        
        // Return real events from Firestore (no more stub fallback)
        return events;
      } catch (error) {
        console.warn('Calendar events query failed:', error);
        // Return empty array instead of stub data - let the UI handle empty state
        return [];
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes - makes subsequent loads instant
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
  });
};

export const useCreateCalendarEvent = () => {
  const queryClient = useQueryClient();

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
        householdId: HOUSEHOLD_ID,
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
