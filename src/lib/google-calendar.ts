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
 *    - http://localhost:5173/auth/google/callback (dev)
 *    - https://yourdomain.com/auth/google/callback (prod)
 * 6. Add the following to your .env.local file:
 *    VITE_GOOGLE_CLIENT_ID=your_client_id_here
 *    VITE_GOOGLE_API_KEY=your_api_key_here
 * 
 * SCOPES NEEDED:
 * - https://www.googleapis.com/auth/calendar.readonly
 * - https://www.googleapis.com/auth/calendar.events
 */

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = 'https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events';

let tokenClient: any = null;

/**
 * Initialize Google OAuth2 client
 */
export const initGoogleCalendar = () => {
  if (!GOOGLE_CLIENT_ID || !GOOGLE_API_KEY) {
    console.warn('Google Calendar API credentials not configured. See src/lib/google-calendar.ts for setup instructions.');
    return;
  }

  // Load Google Identity Services library
  const script = document.createElement('script');
  script.src = 'https://accounts.google.com/gsi/client';
  script.async = true;
  script.defer = true;
  document.body.appendChild(script);

  script.onload = () => {
    // @ts-ignore
    tokenClient = google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: '', // Will be set when authorize is called
    });
  };
};

/**
 * Authorize user and get access token
 */
export const authorizeGoogleCalendar = (): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) {
      reject(new Error('Google Calendar not initialized'));
      return;
    }

    tokenClient.callback = (response: any) => {
      if (response.error) {
        reject(response.error);
      } else {
        resolve(response.access_token);
      }
    };

    tokenClient.requestAccessToken();
  });
};

/**
 * Fetch calendar events from Google Calendar
 */
export const fetchGoogleCalendarEvents = async (accessToken: string, timeMin: Date, timeMax: Date) => {
  const response = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
    `timeMin=${timeMin.toISOString()}&` +
    `timeMax=${timeMax.toISOString()}&` +
    `singleEvents=true&` +
    `orderBy=startTime`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch calendar events');
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
  userColor: string
) => {
  // Fetch events for the next 30 days
  const timeMin = new Date();
  const timeMax = new Date();
  timeMax.setDate(timeMax.getDate() + 30);

  const googleEvents = await fetchGoogleCalendarEvents(accessToken, timeMin, timeMax);

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

  // TODO: Save events to Firestore
  // You would use batched writes here to update the calendar-events collection
  console.log('Synced Google Calendar events:', events);

  return events;
};

// Export placeholder for settings UI
export const isGoogleCalendarConfigured = (): boolean => {
  return !!(GOOGLE_CLIENT_ID && GOOGLE_API_KEY);
};

