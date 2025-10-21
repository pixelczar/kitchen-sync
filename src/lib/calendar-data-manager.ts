/**
 * Smart Calendar Data Manager
 * 
 * This module provides intelligent data fetching and caching for calendar events
 * to minimize Firebase calls while maintaining data freshness.
 */

import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, orderBy, limit } from 'firebase/firestore';
import { firestore } from './firebase';
import type { CalendarEvent } from '../types';
const CACHE_KEY = 'kitchen-sync-calendar-cache';
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes - calendar data changes less frequently

interface CachedData {
  events: CalendarEvent[];
  lastFetch: number;
  dateRange: {
    start: string;
    end: string;
  };
}

interface CalendarDataManager {
  getEvents: (householdId: string, startDate: Date, endDate: Date) => Promise<CalendarEvent[]>;
  createEvent: (householdId: string, eventData: Partial<CalendarEvent>) => Promise<CalendarEvent>;
  updateEvent: (eventId: string, updates: Partial<CalendarEvent>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  invalidateCache: () => void;
  syncWithGoogle: () => Promise<void>;
}

class CalendarDataManagerImpl implements CalendarDataManager {
  private cache: Map<string, CachedData> = new Map();

  /**
   * Get events for a date range with intelligent caching
   */
  async getEvents(householdId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    // Validate input parameters
    if (!startDate || !endDate) {
      console.error('Invalid date parameters:', { startDate, endDate });
      return [];
    }
    
    const cacheKey = this.getCacheKey(startDate, endDate);
    const cached = this.getCachedData(cacheKey);
    
    // Return cached data if still fresh
    if (cached && this.isCacheValid(cached)) {
      return cached.events;
    }

    console.log('📅 Fetching fresh calendar events from Firebase');
    
    try {
      const events = await this.fetchEventsFromFirebase(householdId, startDate, endDate);
      this.setCachedData(cacheKey, events, startDate, endDate);
      return events;
    } catch (error) {
      console.error('Failed to fetch calendar events:', error);
      
      // Return stale cache if available, otherwise empty array
      if (cached) {
        console.log('📅 Using stale cache due to error');
        return cached.events;
      }
      
      return [];
    }
  }

  /**
   * Create a new calendar event
   */
  async createEvent(householdId: string, eventData: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const cleanedData = this.cleanEventData(eventData);
    
    const newEvent = {
      ...cleanedData,
      householdId,
      source: 'manual' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const docRef = await addDoc(collection(firestore, 'calendar-events'), newEvent);
    const createdEvent: CalendarEvent = { 
      id: docRef.id, 
      title: cleanedData.title || '',
      startTime: cleanedData.startTime || '',
      endTime: cleanedData.endTime || '',
      assignedTo: cleanedData.assignedTo || '',
      color: cleanedData.color || '#0A95FF',
      householdId,
      source: 'manual',
      createdAt: newEvent.createdAt,
      updatedAt: newEvent.updatedAt,
      description: cleanedData.description,
      location: cleanedData.location,
      externalId: cleanedData.externalId,
    };

    // Invalidate cache to force refresh
    this.invalidateCache();
    
    return createdEvent;
  }

  /**
   * Update an existing calendar event
   */
  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<void> {
    const cleanedUpdates = this.cleanEventData(updates);
    
    const eventRef = doc(firestore, 'calendar-events', eventId);
    await updateDoc(eventRef, {
      ...cleanedUpdates,
      updatedAt: new Date().toISOString(),
    });

    // Invalidate cache to force refresh
    this.invalidateCache();
  }

  /**
   * Delete a calendar event
   */
  async deleteEvent(eventId: string): Promise<void> {
    await deleteDoc(doc(firestore, 'calendar-events', eventId));
    
    // Invalidate cache to force refresh
    this.invalidateCache();
  }

  /**
   * Sync with Google Calendar (existing functionality)
   */
  async syncWithGoogle(): Promise<void> {
    // This will be handled by the existing useGoogleCalendarSync hook
    // We just need to invalidate cache after sync
    this.invalidateCache();
  }

  /**
   * Invalidate all cached data
   */
  invalidateCache(): void {
    this.cache.clear();
    localStorage.removeItem(CACHE_KEY);
    console.log('📅 Calendar cache invalidated');
  }

  /**
   * Fetch events from Firebase with optimized query
   */
  private async fetchEventsFromFirebase(householdId: string, startDate: Date, endDate: Date): Promise<CalendarEvent[]> {
    const q = query(
      collection(firestore, 'calendar-events'),
      where('householdId', '==', householdId),
      where('startTime', '>=', startDate.toISOString()),
      where('startTime', '<=', endDate.toISOString()),
      orderBy('startTime', 'asc'),
      limit(100) // Reasonable limit to prevent large queries
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as CalendarEvent));
  }

  /**
   * Get cache key for date range
   */
  private getCacheKey(startDate: Date, endDate: Date): string {
    if (!startDate || !endDate) {
      console.error('getCacheKey called with invalid dates:', { startDate, endDate });
      return 'invalid-dates';
    }
    return `${startDate.toISOString().split('T')[0]}-${endDate.toISOString().split('T')[0]}`;
  }

  /**
   * Get cached data for a key
   */
  private getCachedData(cacheKey: string): CachedData | null {
    // Check memory cache first
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`${CACHE_KEY}-${cacheKey}`);
      if (stored) {
        const cached = JSON.parse(stored);
        this.cache.set(cacheKey, cached);
        return cached;
      }
    } catch (error) {
      console.warn('Failed to parse cached data:', error);
    }

    return null;
  }

  /**
   * Set cached data for a key
   */
  private setCachedData(cacheKey: string, events: CalendarEvent[], startDate: Date, endDate: Date): void {
    const cached: CachedData = {
      events,
      lastFetch: Date.now(),
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      }
    };

    // Store in memory cache
    this.cache.set(cacheKey, cached);

    // Store in localStorage (with size limit)
    try {
      localStorage.setItem(`${CACHE_KEY}-${cacheKey}`, JSON.stringify(cached));
    } catch (error) {
      console.warn('Failed to store in localStorage:', error);
    }
  }

  /**
   * Check if cached data is still valid
   */
  private isCacheValid(cached: CachedData): boolean {
    return Date.now() - cached.lastFetch < CACHE_DURATION;
  }

  /**
   * Clean event data by removing undefined values
   */
  private cleanEventData(eventData: Partial<CalendarEvent>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    Object.entries(eventData).forEach(([key, value]) => {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    });
    return cleaned;
  }
}

// Export singleton instance
export const calendarDataManager = new CalendarDataManagerImpl();

/**
 * Hook for using calendar data with intelligent caching
 */
export const useCalendarData = () => {
  // This hook is deprecated - use useCalendarEvents instead
  console.warn('useCalendarData is deprecated. Use useCalendarEvents hook instead.');
  
  return {
    getEvents: (_startDate: Date, _endDate: Date) => {
      console.error('useCalendarData.getEvents called without household ID. Use useCalendarEvents hook instead.');
      return Promise.resolve([]);
    },
    createEvent: calendarDataManager.createEvent.bind(calendarDataManager),
    updateEvent: calendarDataManager.updateEvent.bind(calendarDataManager),
    deleteEvent: calendarDataManager.deleteEvent.bind(calendarDataManager),
    invalidateCache: calendarDataManager.invalidateCache.bind(calendarDataManager),
    syncWithGoogle: calendarDataManager.syncWithGoogle.bind(calendarDataManager),
  };
};
