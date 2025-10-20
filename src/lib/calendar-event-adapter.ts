/**
 * Calendar Event Adapter
 * 
 * Converts between our CalendarEvent format and react-big-calendar format
 */

import moment from 'moment';
import type { CalendarEvent } from '../types';

export interface BigCalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: {
    assignedTo: string;
    color: string;
    source: 'google' | 'manual';
    externalId?: string;
    description?: string;
    location?: string;
  };
}

/**
 * Convert our CalendarEvent to react-big-calendar format
 */
export const toBigCalendarEvent = (event: CalendarEvent): BigCalendarEvent => {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  
  // Check if it's an all-day event (starts and ends at midnight, or spans 24+ hours)
  const isAllDay = (
    (start.getHours() === 0 && 
     start.getMinutes() === 0 && 
     start.getSeconds() === 0 &&
     end.getHours() === 0 && 
     end.getMinutes() === 0 && 
     end.getSeconds() === 0) ||
    (end.getTime() - start.getTime()) >= 24 * 60 * 60 * 1000 // 24+ hours
  );

  return {
    id: event.id,
    title: event.title,
    start: isAllDay ? moment(start).startOf('day').toDate() : start,
    end: isAllDay ? moment(end).endOf('day').toDate() : end,
    allDay: isAllDay,
    resource: {
      assignedTo: event.assignedTo,
      color: event.color,
      source: event.source,
      externalId: event.externalId,
      description: event.description,
      location: event.location,
    },
  };
};

/**
 * Convert react-big-calendar event to our CalendarEvent format
 */
export const fromBigCalendarEvent = (
  event: BigCalendarEvent,
  householdId: string
): Partial<CalendarEvent> => {
  return {
    title: event.title,
    startTime: event.start.toISOString(),
    endTime: event.end.toISOString(),
    assignedTo: event.resource?.assignedTo || '',
    color: event.resource?.color || '#0A95FF',
    source: event.resource?.source || 'manual',
    externalId: event.resource?.externalId,
    description: event.resource?.description,
    location: event.resource?.location,
    householdId,
  };
};

/**
 * Convert array of CalendarEvents to BigCalendarEvents
 */
export const toBigCalendarEvents = (events: CalendarEvent[]): BigCalendarEvent[] => {
  return events.map(toBigCalendarEvent);
};

/**
 * Get event color for display
 */
export const getEventColor = (event: BigCalendarEvent): string => {
  return event.resource?.color || '#0A95FF';
};

/**
 * Check if event is from Google Calendar
 */
export const isGoogleEvent = (event: BigCalendarEvent): boolean => {
  return event.resource?.source === 'google';
};

/**
 * Get user color for Google Calendar events
 */
export const getGoogleCalendarColor = (externalId?: string): string => {
  if (!externalId) return '#0A95FF';
  
  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57', 
    '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF6348'
  ];
  
  const hash = externalId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  return colors[Math.abs(hash) % colors.length];
};
