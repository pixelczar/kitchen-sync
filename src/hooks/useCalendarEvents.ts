import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { firestore } from '../lib/firebase';
import type { CalendarEvent } from '../types';

const HOUSEHOLD_ID = import.meta.env.VITE_HOUSEHOLD_ID || 'demo-family-001';

// Stub calendar data for demo/fallback
const getStubCalendarEvents = (): CalendarEvent[] => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return [
    {
      id: 'stub-1',
      householdId: HOUSEHOLD_ID,
      title: 'Soccer Practice',
      description: 'Weekly soccer practice at the park',
      startTime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString(), // 2 days from now, 4pm
      endTime: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000 + 17.5 * 60 * 60 * 1000).toISOString(), // 5:30pm
      assignedTo: 'user-1', // Emma
      location: 'Central Park',
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stub-2',
      householdId: HOUSEHOLD_ID,
      title: 'Piano Recital',
      description: 'Spring piano recital',
      startTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000).toISOString(), // 5 days from now, 6pm
      endTime: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000 + 19.5 * 60 * 60 * 1000).toISOString(), // 7:30pm
      assignedTo: 'user-2', // Liam
      location: 'Music Hall',
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stub-3',
      householdId: HOUSEHOLD_ID,
      title: 'Dentist Appointment',
      description: 'Regular checkup',
      startTime: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 14 * 60 * 60 * 1000).toISOString(), // Tomorrow, 2pm
      endTime: new Date(today.getTime() + 1 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(), // 3pm
      assignedTo: 'user-3', // Ava
      location: 'Dr. Smith Dental',
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stub-4',
      householdId: HOUSEHOLD_ID,
      title: 'Swimming Lessons',
      description: 'Level 3 swimming class',
      startTime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 15 * 60 * 60 * 1000).toISOString(), // 3 days from now, 3pm
      endTime: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000 + 16 * 60 * 60 * 1000).toISOString(), // 4pm
      assignedTo: 'user-4', // Noah
      location: 'Community Pool',
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stub-5',
      householdId: HOUSEHOLD_ID,
      title: 'Family Movie Night',
      description: 'Weekly family movie and popcorn',
      startTime: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 19 * 60 * 60 * 1000).toISOString(), // 4 days from now, 7pm
      endTime: new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000 + 21 * 60 * 60 * 1000).toISOString(), // 9pm
      assignedTo: 'user-1', // Emma
      location: 'Home',
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'stub-6',
      householdId: HOUSEHOLD_ID,
      title: 'Basketball Game',
      description: 'Championship game',
      startTime: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000 + 17 * 60 * 60 * 1000).toISOString(), // 6 days from now, 5pm
      endTime: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000 + 18.5 * 60 * 60 * 1000).toISOString(), // 6:30pm
      assignedTo: 'user-2', // Liam
      location: 'School Gym',
      source: 'manual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
};

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
          const q = query(
            collection(firestore, 'calendar-events'),
            where('householdId', '==', HOUSEHOLD_ID),
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
        
        // If no events from DB, use stub data
        if (events.length === 0) {
          return getStubCalendarEvents();
        }
        
        return events;
      } catch (error) {
        console.warn('Calendar events query failed, using stub data:', error);
        return getStubCalendarEvents();
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
