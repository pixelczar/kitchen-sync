/**
 * Demo Calendar Data Generator
 * 
 * Generates realistic demo calendar events for the Demo family
 */

import type { CalendarEvent } from '../types';

const DEMO_HOUSEHOLD_ID = 'demo-family-001';

// Demo user IDs (these should match the demo users)
const DEMO_USERS = {
  mom: 'demo-mom-001',
  dad: 'demo-dad-001', 
  kid1: 'demo-kid1-001',
  kid2: 'demo-kid2-001'
};

// Demo user colors
const DEMO_COLORS = {
  [DEMO_USERS.mom]: '#FF6B6B', // Red
  [DEMO_USERS.dad]: '#4ECDC4', // Teal
  [DEMO_USERS.kid1]: '#45B7D1', // Blue
  [DEMO_USERS.kid2]: '#96CEB4', // Green
};

/**
 * Generate demo calendar events for the next 30 days
 */
export const generateDemoCalendarEvents = (): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const now = new Date();
  
  // Generate events for the next 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    
    // Skip weekends for some events
    // const isWeekend = date.getDay() === 0 || date.getDay() === 6;
    
    // Generate 1-3 events per day
    const eventCount = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < eventCount; j++) {
      const event = generateRandomEvent(date, i, j);
      if (event) {
        events.push(event);
      }
    }
  }
  
  return events;
};

/**
 * Generate a random event for a specific date
 */
function generateRandomEvent(date: Date, dayOffset: number, eventIndex: number): CalendarEvent | null {
  const eventTemplates = [
    // School events
    { title: 'School Drop-off', time: '08:00', duration: 30, user: DEMO_USERS.mom, type: 'school' },
    { title: 'Soccer Practice', time: '16:00', duration: 60, user: DEMO_USERS.kid1, type: 'sports' },
    { title: 'Piano Lesson', time: '15:30', duration: 45, user: DEMO_USERS.kid2, type: 'music' },
    { title: 'Parent-Teacher Conference', time: '14:00', duration: 30, user: DEMO_USERS.mom, type: 'school' },
    
    // Work events
    { title: 'Team Meeting', time: '10:00', duration: 60, user: DEMO_USERS.dad, type: 'work' },
    { title: 'Doctor Appointment', time: '11:00', duration: 45, user: DEMO_USERS.mom, type: 'health' },
    { title: 'Grocery Shopping', time: '18:00', duration: 90, user: DEMO_USERS.mom, type: 'errands' },
    
    // Family events
    { title: 'Family Dinner', time: '19:00', duration: 60, user: DEMO_USERS.mom, type: 'family' },
    { title: 'Movie Night', time: '20:00', duration: 120, user: DEMO_USERS.dad, type: 'family' },
    { title: 'Birthday Party', time: '14:00', duration: 180, user: DEMO_USERS.kid1, type: 'celebration' },
    
    // Weekend events
    { title: 'Weekend Hike', time: '09:00', duration: 240, user: DEMO_USERS.dad, type: 'recreation' },
    { title: 'Playground Visit', time: '15:00', duration: 90, user: DEMO_USERS.mom, type: 'recreation' },
    { title: 'Library Visit', time: '10:00', duration: 60, user: DEMO_USERS.kid2, type: 'education' },
  ];
  
  // Filter events based on day and type
  const availableEvents = eventTemplates.filter(template => {
    if (template.type === 'weekend' && !isWeekend(date)) return false;
    if (template.type === 'work' && isWeekend(date)) return false;
    return true;
  });
  
  if (availableEvents.length === 0) return null;
  
  const template = availableEvents[Math.floor(Math.random() * availableEvents.length)];
  
  // Create start and end times
  const [hours, minutes] = template.time.split(':').map(Number);
  const startTime = new Date(date);
  startTime.setHours(hours, minutes, 0, 0);
  
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + template.duration);
  
  // Add some randomness to times
  const timeVariation = Math.floor(Math.random() * 30) - 15; // ±15 minutes
  startTime.setMinutes(startTime.getMinutes() + timeVariation);
  endTime.setMinutes(endTime.getMinutes() + timeVariation);
  
  return {
    id: `demo-event-${dayOffset}-${eventIndex}-${Date.now()}`,
    householdId: DEMO_HOUSEHOLD_ID,
    title: template.title,
    description: getEventDescription(template.type),
    location: getEventLocation(template.type),
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    assignedTo: template.user,
    color: DEMO_COLORS[template.user],
    source: 'manual' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function getEventDescription(type: string): string {
  const descriptions = {
    school: 'Regular school activities and events',
    sports: 'Athletic activities and training',
    music: 'Music lessons and practice',
    work: 'Professional meetings and appointments',
    health: 'Medical appointments and checkups',
    errands: 'Daily tasks and shopping',
    family: 'Family time and activities',
    celebration: 'Special occasions and parties',
    recreation: 'Leisure activities and outings',
    education: 'Learning and educational activities',
  };
  
  return descriptions[type as keyof typeof descriptions] || 'Family activity';
}

function getEventLocation(type: string): string {
  const locations = {
    school: 'Local Elementary School',
    sports: 'Community Sports Center',
    music: 'Music Academy',
    work: 'Office Building',
    health: 'Family Medical Center',
    errands: 'Local Shopping Center',
    family: 'Home',
    celebration: 'Community Center',
    recreation: 'Local Park',
    education: 'Public Library',
  };
  
  return locations[type as keyof typeof locations] || 'Various Locations';
}

function isWeekend(date: Date): boolean {
  return date.getDay() === 0 || date.getDay() === 6;
}
