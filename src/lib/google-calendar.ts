/**
 * Google Calendar Integration
 * 
 * This module handles OAuth2 authentication and syncing with Google Calendar API.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Go to Google Cloud Console (console.cloud.google.com)
 * 2. Create a new project or select existing one
 * 3. Enable Google Calendar API
 * 4. Create OAuth 2.0 credentials (Web application)
 * 5. Add authorized redirect URIs:
 *    - http://localhost:5173/google-auth-callback.html (dev)
 *    - https://yourdomain.com/google-auth-callback.html (prod)
 * 6. Add the following to your .env.local file:
 *    VITE_GOOGLE_CALENDAR_CLIENT_ID=your_client_id_here
 * 
 * SCOPES NEEDED:
 * - https://www.googleapis.com/auth/calendar.readonly
 * - https://www.googleapis.com/auth/calendar.events
 */

const GOOGLE_CALENDAR_CLIENT_ID = import.meta.env.VITE_GOOGLE_CALENDAR_CLIENT_ID;
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events'
];

/**
 * Check if Google Calendar is configured
 */
export const isGoogleCalendarConfigured = (): boolean => {
  return !!GOOGLE_CALENDAR_CLIENT_ID;
};

/**
 * Authorize Google Calendar using OAuth2
 */
export const authorizeGoogleCalendar = async (): Promise<string> => {
  if (!isGoogleCalendarConfigured()) {
    throw new Error('Google Calendar API credentials not configured');
  }

  console.log('Starting Google Calendar authorization...');
  console.log('Client ID:', GOOGLE_CALENDAR_CLIENT_ID);

  // Use direct redirect approach similar to Google Photos
  const redirectUri = `${window.location.origin}/google-auth-callback.html`;
  const state = Math.random().toString(36).substring(2, 15);

  console.log('Redirect URI:', redirectUri);
  console.log('State:', state);

  // Store state for verification
  sessionStorage.setItem('googleCalendarState', state);

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CALENDAR_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(SCOPES.join(' '))}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `state=${state}&` +
    `include_granted_scopes=true`;

  console.log('OAuth URL:', authUrl);
  console.log('Redirecting to Google OAuth...');

  // Redirect to Google OAuth
  window.location.href = authUrl;

  // This will never resolve because we're redirecting
  return new Promise(() => {});
};

/**
 * Fetch available calendars from Google Calendar
 */
export const fetchGoogleCalendars = async (accessToken: string) => {
  const response = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch calendars');
  }

  const data = await response.json();
  return data.items || [];
};

/**
 * Fetch calendar events from Google Calendar
 */
export const fetchGoogleCalendarEvents = async (accessToken: string, timeMin: Date, timeMax: Date, calendarId: string = 'primary') => {
  const userTimezone = localStorage.getItem('userTimezone') || Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?` +
    `timeMin=${timeMin.toISOString()}&` +
    `timeMax=${timeMax.toISOString()}&` +
    `singleEvents=true&` +
    `orderBy=startTime&` +
    `timeZone=${encodeURIComponent(userTimezone)}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    if (response.status === 401) {
      console.error('Google Calendar API: Unauthorized - token may be expired');
      // Clear the invalid token
      localStorage.removeItem('googleCalendarToken');
      throw new Error('Google Calendar authentication expired. Please reconnect.');
    }
    throw new Error(`Failed to fetch calendar events: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.items || [];
};

/**
 * Sync Google Calendar events to Firestore
 * This function should be called periodically (e.g., every 15 minutes)
 */
export const syncGoogleCalendarEvents = async (
  accessToken: string,
  householdId: string,
  userId: string,
  userColor: string,
  calendarId: string = 'primary'
) => {
  try {
    // Fetch events for the next 30 days
    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + 30);

    console.log(`Fetching Google Calendar events from calendar: ${calendarId}...`);
    const googleEvents = await fetchGoogleCalendarEvents(accessToken, timeMin, timeMax, calendarId);
    console.log(`Found ${googleEvents.length} Google Calendar events`);

    // Convert Google Calendar events to our format
    const events = googleEvents.map((event: any) => ({
      householdId,
      title: event.summary || 'Untitled Event',
      startTime: event.start.dateTime || event.start.date,
      endTime: event.end.dateTime || event.end.date,
      assignedTo: userId,
      color: userColor,
      source: 'google' as const,
      externalId: event.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }));

    console.log('Converted Google Calendar events:', events);
    return events;
  } catch (error) {
    console.error('Failed to sync Google Calendar events:', error);
    throw error;
  }
};

/**
 * Create a new event in Google Calendar
 */
export const createGoogleCalendarEvent = async (
  accessToken: string,
  event: {
    title: string;
    startTime: string;
    endTime: string;
    description?: string;
  }
) => {
  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summary: event.title,
      description: event.description || '',
      start: {
        dateTime: event.startTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      end: {
        dateTime: event.endTime,
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create Google Calendar event');
  }

  const data = await response.json();
  return data;
};

