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
  console.log('Stored Google Calendar state:', state);

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_CALENDAR_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(SCOPES.join(' '))}&` +
    `response_type=token&` +
    `state=${state}&` +
    `include_granted_scopes=true&` +
    `prompt=consent`;

  console.log('OAuth URL:', authUrl);
  console.log('Redirecting to Google OAuth...');

  // Redirect to Google OAuth
  window.location.href = authUrl;

  // This will never resolve because we're redirecting
  return new Promise(() => {});
};

/**
 * Store OAuth token securely via Cloud Function
 */
export const storeGoogleCalendarToken = async (tokenData: {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}) => {
  try {
    const { storeOAuthTokenClient } = await import('../lib/functions');
    await storeOAuthTokenClient({
      provider: 'calendar',
      ...tokenData
    });
    console.log('Google Calendar token stored securely');
  } catch (error) {
    console.warn('Failed to store token securely, falling back to localStorage:', error);
    // Fallback to localStorage for development
    localStorage.setItem('googleCalendarToken', JSON.stringify(tokenData));
  }
};

/**
 * Get OAuth token from Cloud Function or localStorage fallback
 */
// Cache for token results to avoid repeated calls
const tokenCache: { [key: string]: { token: string | null; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getGoogleCalendarToken = async (): Promise<string | null> => {
  const cacheKey = 'calendar';
  const now = Date.now();
  
  // Check cache first
  if (tokenCache[cacheKey] && (now - tokenCache[cacheKey].timestamp) < CACHE_DURATION) {
    return tokenCache[cacheKey].token;
  }
  
  // Skip OAuth functions for now to prevent 404 errors
  // TODO: Re-enable when OAuth functions are properly deployed
  // try {
  //   const { getOAuthTokenClient } = await import('../lib/functions');
  //   const token = await getOAuthTokenClient('calendar');
  //   tokenCache[cacheKey] = { token, timestamp: now };
  //   return token;
  // } catch (error) {
  //   // Only log warning once per session to avoid spam
  //   if (!tokenCache[cacheKey] || (now - tokenCache[cacheKey].timestamp) > CACHE_DURATION) {
  //     console.warn('OAuth functions not available, using localStorage for Google Calendar');
  //   }
  // }
  
  // Use localStorage directly
  const tokenData = localStorage.getItem('googleCalendarToken');
  let token = null;
  if (tokenData) {
    try {
      const parsed = JSON.parse(tokenData);
      // Handle both old format (just string) and new format (object with accessToken)
      if (typeof parsed === 'string') {
        token = parsed;
      } else if (parsed && parsed.accessToken) {
        // Check if token is expired
        if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
          console.log('Google Calendar token expired, clearing...');
          localStorage.removeItem('googleCalendarToken');
          token = null;
        } else {
          token = parsed.accessToken;
        }
      }
    } catch (error) {
      console.error('Error parsing Google Calendar token:', error);
      // If parsing fails, try to use the raw value as a token
      token = tokenData;
    }
  }
  
  tokenCache[cacheKey] = { token, timestamp: now };
  return token;
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
  
  console.log('Fetching Google Calendar events with:', {
    calendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    userTimezone,
    accessTokenLength: accessToken.length
  });
  
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
  console.log('Google Calendar API response:', {
    status: response.status,
    hasItems: !!data.items,
    itemsLength: data.items?.length || 0,
    dataKeys: Object.keys(data),
    firstItem: data.items?.[0] || null
  });
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

