// Google Photos Picker API Integration
// Documentation: https://developers.google.com/photos

const GOOGLE_PHOTOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_PHOTOS_CLIENT_ID;

// OAuth scopes for Google Photos API
const SCOPES = [
  'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
  'https://www.googleapis.com/auth/photoslibrary.readonly',
];

export interface PickerSession {
  sessionId: string;
  pickerUri: string;
  mediaItemsSet: boolean;
}

export interface PickerMediaItem {
  id: string;
  baseUrl: string;
  mimeType: string;
  filename: string;
  mediaFile?: {
    baseUrl: string;
    mimeType: string;
    filename: string;
  };
}

/**
 * Check if Google Photos API is configured
 */
export const isGooglePhotosConfigured = (): boolean => {
  return !!GOOGLE_PHOTOS_CLIENT_ID;
};

/**
 * Store OAuth token securely via Cloud Function
 */
export const storeGooglePhotosToken = async (tokenData: {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}) => {
  try {
    const { storeOAuthTokenClient } = await import('../lib/functions');
    await storeOAuthTokenClient({
      provider: 'photos',
      ...tokenData
    });
    console.log('Google Photos token stored securely');
  } catch (error) {
    console.warn('Failed to store token securely, falling back to localStorage:', error);
    // Fallback to localStorage for development
    localStorage.setItem('googlePhotosToken', JSON.stringify(tokenData));
  }
};

// Cache for token results to avoid repeated calls
const tokenCache: { [key: string]: { token: string | null; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get OAuth token from Cloud Function or localStorage fallback
 */
export const getGooglePhotosToken = async (): Promise<string | null> => {
  const cacheKey = 'photos';
  const now = Date.now();
  
  // Check cache first
  if (tokenCache[cacheKey] && (now - tokenCache[cacheKey].timestamp) < CACHE_DURATION) {
    return tokenCache[cacheKey].token;
  }
  
  // Skip OAuth functions for now to prevent 404 errors
  // TODO: Re-enable when OAuth functions are properly deployed
  // try {
  //   const { getOAuthTokenClient } = await import('../lib/functions');
  //   const token = await getOAuthTokenClient('photos');
  //   tokenCache[cacheKey] = { token, timestamp: now };
  //   return token;
  // } catch (error) {
  //   // Only log warning once per session to avoid spam
  //   if (!tokenCache[cacheKey] || (now - tokenCache[cacheKey].timestamp) > CACHE_DURATION) {
  //     console.warn('OAuth functions not available, using localStorage for Google Photos');
  //   }
  // }
  
  // Use localStorage directly
  const tokenData = localStorage.getItem('googlePhotosToken');
  let token = null;
  if (tokenData) {
    const parsed = JSON.parse(tokenData);
    token = parsed.accessToken;
  }
  
  tokenCache[cacheKey] = { token, timestamp: now };
  return token;
};

/**
 * Authorize with Google Photos using OAuth 2.0
 */
export const authorizeGooglePhotos = async (): Promise<string> => {
  if (!isGooglePhotosConfigured()) {
    throw new Error('Google Photos API not configured');
  }

  return new Promise((resolve, reject) => {
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_PHOTOS_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', `${window.location.origin}/google-auth-callback.html`);
    authUrl.searchParams.set('response_type', 'token');
    authUrl.searchParams.set('scope', SCOPES.join(' '));
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('select_account', 'select_account');

    const popup = window.open(authUrl.toString(), 'google-auth', 'width=500,height=600');

    if (!popup) {
      reject(new Error('Failed to open authentication popup'));
      return;
    }

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        window.removeEventListener('message', handleMessage);
        try {
          popup.close();
        } catch (e) {
          // Ignore popup close errors due to CORS policies
        }
        resolve(event.data.accessToken);
      } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
        window.removeEventListener('message', handleMessage);
        try {
          popup.close();
        } catch (e) {
          // Ignore popup close errors due to CORS policies
        }
        reject(new Error(event.data.error));
      }
    };

    window.addEventListener('message', handleMessage);
    
    // Add timeout to handle cases where popup doesn't close properly
    setTimeout(() => {
      window.removeEventListener('message', handleMessage);
      reject(new Error('Authentication timeout - please try again'));
    }, 300000); // 5 minutes timeout
  });
};

/**
 * Create a new picker session
 */
export const createPickerSession = async (accessToken: string): Promise<PickerSession> => {
  if (!isGooglePhotosConfigured()) {
    throw new Error('Google Photos API not configured');
  }

  const response = await fetch('https://photospicker.googleapis.com/v1/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to create picker session: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  
  return {
    sessionId: data.id, // The API returns 'id', not 'sessionId'
    pickerUri: data.pickerUri,
    mediaItemsSet: data.mediaItemsSet || false,
  };
};

/**
 * Check if a picker session has media items selected
 */
export const checkPickerSession = async (accessToken: string, sessionId: string): Promise<boolean> => {
  if (!isGooglePhotosConfigured()) {
    throw new Error('Google Photos API not configured');
  }

  if (!sessionId || sessionId === 'undefined') {
    throw new Error('Invalid session ID provided');
  }

  const response = await fetch(`https://photospicker.googleapis.com/v1/sessions/${sessionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to check picker session: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.mediaItemsSet || false;
};

/**
 * Get selected media items from a picker session
 */
export const getPickerMediaItems = async (accessToken: string, sessionId: string): Promise<PickerMediaItem[]> => {
  if (!isGooglePhotosConfigured()) {
    throw new Error('Google Photos API not configured');
  }

  const response = await fetch(`https://photospicker.googleapis.com/v1/mediaItems?sessionId=${sessionId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get picker media items: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.mediaItems || [];
};

/**
 * Get fresh base URLs for media items (they expire after 60 minutes)
 */
export const getFreshBaseUrls = async (): Promise<PickerMediaItem[]> => {
  if (!isGooglePhotosConfigured()) {
    throw new Error('Google Photos API not configured');
  }

  // The Google Photos Picker API doesn't have a batchGet endpoint
  // We can't refresh URLs with the Picker API
  return [];
};

/**
 * Load selected photos from localStorage and get fresh base URLs
 */
export const loadSelectedPhotos = async (): Promise<string[]> => {
  try {
    const savedPhotos = localStorage.getItem('screensaverPhotos');
    const savedTimestamp = localStorage.getItem('screensaverPhotosTimestamp');
    
    if (!savedPhotos || !savedTimestamp) {
      console.log('No selected photos found in localStorage');
      return [];
    }

    const photos: PickerMediaItem[] = JSON.parse(savedPhotos);
    const accessToken = localStorage.getItem('googlePhotosToken');
    
    if (!accessToken) {
      console.log('No Google Photos token found');
      return [];
    }

    // Check if we have valid photos with baseUrls
    if (!photos || photos.length === 0) {
      console.log('No photos in saved data');
      return [];
    }

    // For now, we'll use a proxy approach or return empty array
    // The Google Photos Picker API baseUrls are not meant to be used directly
    // in img src tags due to CORS restrictions
    console.log('Google Photos URLs cannot be used directly due to CORS restrictions');
    console.log('Consider using a backend proxy or alternative approach');
    
    return [];

  } catch (error) {
    console.error('Error loading selected photos:', error);
    return [];
  }
};