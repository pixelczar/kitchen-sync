// Google Photos Picker API Integration
// Documentation: https://developers.google.com/photos

const GOOGLE_PHOTOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_PHOTOS_CLIENT_ID;

// OAuth scopes for Google Photos API
const SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata',
  'https://www.googleapis.com/auth/photospicker.mediaitems.readonly',
];

export interface PickerSession {
  sessionId: string;
  pickerUri: string;
  mediaItemsSet: boolean;
}

export interface PickerMediaItem {
  id: string;
  baseUrl?: string;
  mimeType?: string;
  filename?: string;
  mediaFile?: {
    baseUrl: string;
    mimeType: string;
    filename: string;
  };
  // Additional fields that might be present in the API response
  productUrl?: string;
  description?: string;
  mediaMetadata?: {
    creationTime: string;
    width: string;
    height: string;
  };
  // Base64 data URL for local storage (avoids CORS and expiration)
  base64Data?: string;
  originalBaseUrl?: string;
}

/**
 * Return the base URL without any appended sizing/format params (strip after first '=')
 */
export const cleanBaseUrl = (url?: string | null): string | null => {
  if (!url) return null;
  const str = String(url);
  return str.split('=')[0];
};

/**
 * Build a sized Google Photos URL using width/height (and optional crop) params.
 * If neither width nor height provided, returns the cleaned base URL.
 */
export const getSizedPhotoUrl = (baseUrl?: string | null, opts?: { width?: number; height?: number; crop?: boolean; original?: boolean }): string | null => {
  const clean = cleanBaseUrl(baseUrl);
  if (!clean) return null;
  if (opts?.original) return `${clean}=d`;
  const w = opts?.width && opts.width > 0 ? `w${Math.round(opts.width)}` : '';
  const h = opts?.height && opts.height > 0 ? `h${Math.round(opts.height)}` : '';
  const parts = [w, h].filter(Boolean).join('-');
  if (!parts) return clean;
  const crop = opts?.crop ? '-c' : '';
  return `${clean}=${parts}${crop}`;
};

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
  
  // Try OAuth functions first for proper authentication
  try {
    console.log('Attempting to get OAuth token from Cloud Functions...');
    const { getOAuthTokenClient } = await import('../lib/functions');
    const token = await getOAuthTokenClient('photos');
    console.log('Got OAuth token for Google Photos:', token.substring(0, 20) + '...');
    tokenCache[cacheKey] = { token, timestamp: now };
    return token;
  } catch (error) {
    console.warn('OAuth functions not available, falling back to localStorage for Google Photos:', error);
    console.log('Error details:', error instanceof Error ? error.message : String(error));
  }
  
  // Use localStorage directly as fallback
  const tokenData = localStorage.getItem('googlePhotosToken');
  let token = null;
  if (tokenData) {
    const parsed = JSON.parse(tokenData);
    console.log('Raw token data from localStorage:', parsed);
    
    // Handle different token structures
    token = parsed.accessToken || parsed.access_token || parsed.token;
    console.log('Using localStorage token for Google Photos:', token ? token.substring(0, 20) + '...' : 'null');
    
    // Check if token is expired
    if (token && parsed.expiresAt) {
      const now = Date.now();
      const timeUntilExpiry = parsed.expiresAt - now;
      
      if (now >= parsed.expiresAt) {
        console.log('Token is expired, removing from localStorage');
        localStorage.removeItem('googlePhotosToken');
        token = null;
      } else if (timeUntilExpiry < 5 * 60 * 1000) { // Less than 5 minutes left
        console.log('Token expires soon:', new Date(parsed.expiresAt));
        console.log('Time until expiry:', Math.round(timeUntilExpiry / 1000), 'seconds');
        // Don't remove the token yet, but warn that re-authentication will be needed soon
      } else {
        console.log('Token expires at:', new Date(parsed.expiresAt));
        console.log('Time until expiry:', Math.round(timeUntilExpiry / 1000 / 60), 'minutes');
      }
    }
    
    if (!token) {
      console.error('No valid token found in localStorage data:', parsed);
    }
  } else {
    console.log('No localStorage token found for Google Photos');
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
    // Generate state parameter for security
    const state = Math.random().toString(36).substring(2, 15);
    
    // Store state for verification
    sessionStorage.setItem('googlePhotosState', state);
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', GOOGLE_PHOTOS_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', `${window.location.origin}/google-auth-callback.html`);
    authUrl.searchParams.set('response_type', 'token'); // Keep implicit flow for now
    authUrl.searchParams.set('scope', SCOPES.join(' '));
    authUrl.searchParams.set('prompt', 'consent');
    authUrl.searchParams.set('select_account', 'select_account');
    authUrl.searchParams.set('state', state);

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

  console.log('Creating picker session with token:', accessToken.substring(0, 20) + '...');

  // The Google Photos Picker API requires the correct endpoint
  const response = await fetch('https://photospicker.googleapis.com/v1/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({}),
  });

  console.log('Picker session response status:', response.status);
  console.log('Picker session response headers:', Object.fromEntries(response.headers.entries()));

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Picker session error details:', errorText);
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
  console.log('Google Photos Picker API response:', data);
  console.log('Media items from API:', data.mediaItems);
  
  // Log the structure of each media item
  if (data.mediaItems && data.mediaItems.length > 0) {
    console.log('First media item structure:', data.mediaItems[0]);
    console.log('Available properties:', Object.keys(data.mediaItems[0]));
  }
  
  return data.mediaItems || [];
};

/**
 * Wait for picker session completion with automatic window closing
 * This function polls the session status and automatically closes the picker window when complete
 */
export const waitForPickerCompletion = async (
  accessToken: string, 
  sessionId: string, 
  pickerWindow: Window | null,
  onComplete: (mediaItems: PickerMediaItem[]) => void,
  onError: (error: Error) => void,
  options: {
    pollInterval?: number;
    maxPolls?: number;
    checkWindowClosed?: boolean;
  } = {}
): Promise<void> => {
  const {
    pollInterval = 1500, // Default to 1.5 seconds (more responsive)
    maxPolls = 80, // Default to 2 minutes
    // checkWindowClosed removed - was causing premature closure detection
  } = options;

  let pollCount = 0;
  let isCompleted = false;

  const pollForCompletion = async (): Promise<void> => {
    try {
      pollCount++;
      console.log(`Checking picker session completion (attempt ${pollCount}/${maxPolls})`);
      
      // Debug window state (avoid cross-origin access)
      if (pickerWindow) {
        try {
          console.log('Picker window state:', {
            closed: pickerWindow.closed,
            // Don't access location or document to avoid CORS errors
            available: !pickerWindow.closed
          });
        } catch (e) {
          console.log('Picker window state (limited):', {
            closed: pickerWindow.closed,
            error: 'Cross-origin access blocked'
          });
        }
      }
      
      // Don't check for window closure during polling - let the user complete their selection
      // The window close detection is too aggressive and interferes with photo selection
      
      const isComplete = await checkPickerSession(accessToken, sessionId);
      
      if (isComplete && !isCompleted) {
        isCompleted = true;
        console.log('Picker session completed, processing results');
        
        // Close the picker window immediately
        if (pickerWindow && !pickerWindow.closed) {
          try {
            pickerWindow.close();
            console.log('Picker window closed successfully');
          } catch (e) {
            console.warn('Could not close picker window:', e);
          }
        }
        
        // Focus the parent window
        try {
          window.focus();
        } catch (e) {
          console.warn('Could not focus parent window:', e);
        }
        
        // Get the selected media items
        const mediaItems = await getPickerMediaItems(accessToken, sessionId);
        console.log(`Retrieved ${mediaItems.length} selected photos`);
        console.log('Media items structure:', mediaItems);
        
        // Log each media item to understand the structure
        mediaItems.forEach((item, index) => {
          console.log(`Media item ${index}:`, {
            id: item.id,
            baseUrl: item.baseUrl,
            mimeType: item.mimeType,
            filename: item.filename,
            mediaFile: item.mediaFile,
            productUrl: item.productUrl,
            allKeys: Object.keys(item)
          });
        });
        
        // Check if the picker media items have usable data
        console.log('Checking if picker media items have usable data...');
        const usableItems = mediaItems.filter(item => 
          item.baseUrl || 
          item.mediaFile?.baseUrl || 
          item.productUrl
        );
        
        if (usableItems.length > 0) {
          console.log(`Found ${usableItems.length} usable items from picker, converting to base64`);
          
          // Convert picker items to base64 using Cloud Function
          try {
            const { convertPhotosToBase64Client } = await import('../lib/functions');
            
            const viewportWidth = Math.max(window.innerWidth || 0, 1920);
            const viewportHeight = Math.max(window.innerHeight || 0, 1080);
            const result = await convertPhotosToBase64Client({ 
              mediaItems: usableItems,
              accessToken: accessToken,
              targetWidth: viewportWidth,
              targetHeight: viewportHeight,
              crop: false
            });
            
            console.log('Cloud Function result:', result);
            console.log(`Successfully converted ${result.successCount}/${result.totalCount} photos`);
            
            if (result.failed.length > 0) {
              console.warn(`Failed to convert ${result.failed.length} photos:`, result.failed);
            }
            
            // Convert the results to the expected format
            const processedMediaItems = usableItems.map((pickerItem) => {
              const converted = result.results.find(r => r.id === pickerItem.id);
              if (converted) {
                console.log(`Successfully converted picker photo ${pickerItem.id} to base64`);
                return {
                  id: pickerItem.id,
                  base64Data: converted.base64Data,
                  mimeType: converted.mimeType,
                  filename: converted.filename,
                  originalBaseUrl: pickerItem.baseUrl || pickerItem.mediaFile?.baseUrl || pickerItem.productUrl
                };
              } else {
                console.warn(`No base64 data for picker photo ${pickerItem.id}`);
                return {
                  id: pickerItem.id,
                  baseUrl: pickerItem.baseUrl || pickerItem.mediaFile?.baseUrl || pickerItem.productUrl,
                  mimeType: pickerItem.mimeType || pickerItem.mediaFile?.mimeType || 'image/jpeg',
                  filename: pickerItem.filename || pickerItem.mediaFile?.filename || `photo_${pickerItem.id}.jpg`
                };
              }
            });
            
            console.log('Picker photo conversion complete, processed items:', processedMediaItems);
            onComplete(processedMediaItems);
            return;
          } catch (error) {
            console.error('Failed to convert picker photos via Cloud Function:', error);
            console.error('Error details:', error instanceof Error ? error.message : String(error));
            // Fallback to original items if conversion fails
            console.log('Falling back to original picker items');
            const processedMediaItems = usableItems.map(item => {
              const url = item.baseUrl || item.mediaFile?.baseUrl || item.productUrl;
              return {
                id: item.id,
                baseUrl: url,
                mimeType: item.mimeType || item.mediaFile?.mimeType || 'image/jpeg',
                filename: item.filename || item.mediaFile?.filename || `photo_${item.id}.jpg`,
                originalBaseUrl: url
              };
            });
            onComplete(processedMediaItems);
            return;
          }
        }
        
        // If picker items are not usable, try to get the selected photos using Library API
        console.log('Picker items not usable, trying to get selected photos from library...');
        try {
          const { convertPhotosToBase64Client } = await import('../lib/functions');
          
          // Try to get the specific photos that were selected using batchGet
          const mediaItemIds = mediaItems.map(item => item.id);
          console.log('Trying to get selected photos by ID:', mediaItemIds);
          
          const batchResponse = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems:batchGet`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              mediaItemIds: mediaItemIds
            })
          });

          if (batchResponse.ok) {
            const batchData = await batchResponse.json();
            console.log('Batch get response:', batchData);
            
            if (batchData.mediaItemResults && batchData.mediaItemResults.length > 0) {
              const selectedPhotos = batchData.mediaItemResults
                .filter((item: { mediaItem?: unknown }) => item.mediaItem)
                .map((item: { mediaItem: unknown }) => item.mediaItem);
              
              console.log('Found selected photos in library:', selectedPhotos.length);
              
              const viewportWidth = Math.max(window.innerWidth || 0, 1920);
              const viewportHeight = Math.max(window.innerHeight || 0, 1080);
              const result = await convertPhotosToBase64Client({ 
                mediaItems: selectedPhotos,
                accessToken: accessToken,
                targetWidth: viewportWidth,
                targetHeight: viewportHeight,
                crop: false
              });
              
              console.log('Cloud Function result:', result);
              console.log(`Successfully converted ${result.successCount}/${result.totalCount} photos`);
              
              if (result.failed.length > 0) {
                console.warn(`Failed to convert ${result.failed.length} photos:`, result.failed);
              }
              
              // Convert the selected photos to the expected format
              const processedMediaItems = selectedPhotos.map((libraryItem: { id: string; baseUrl: string; mimeType: string; filename: string }) => {
                const converted = result.results.find(r => r.id === libraryItem.id);
                if (converted) {
                  console.log(`Successfully converted selected photo ${libraryItem.id} to base64`);
                  return {
                    id: libraryItem.id,
                    base64Data: converted.base64Data,
                    mimeType: converted.mimeType,
                    filename: converted.filename,
                    originalBaseUrl: libraryItem.baseUrl
                  };
                } else {
                  console.warn(`No base64 data for selected photo ${libraryItem.id}`);
                  return {
                    id: libraryItem.id,
                    baseUrl: libraryItem.baseUrl,
                    mimeType: libraryItem.mimeType,
                    filename: libraryItem.filename
                  };
                }
              });
              
              console.log('Selected photo conversion complete, processed items:', processedMediaItems);
              onComplete(processedMediaItems);
              return;
            }
          }
          
          // If batchGet fails, fall back to getting recent photos
          console.log('BatchGet failed, falling back to recent photos...');
          const libraryResponse = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=20`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            }
          });

          if (!libraryResponse.ok) {
            throw new Error(`Failed to fetch library photos: ${libraryResponse.status}`);
          }

          const libraryData = await libraryResponse.json();
          console.log('Library API response:', libraryData);
          
          if (!libraryData.mediaItems || libraryData.mediaItems.length === 0) {
            console.log('No photos found in library');
            onComplete([]);
            return;
          }

          // Take the first few photos from the library
          const recentPhotos = libraryData.mediaItems.slice(0, Math.min(mediaItems.length, 10));
          
          console.log('Using recent photos from library:', recentPhotos.length);
          
          const viewportWidth = Math.max(window.innerWidth || 0, 1920);
          const viewportHeight = Math.max(window.innerHeight || 0, 1080);
          const result = await convertPhotosToBase64Client({ 
            mediaItems: recentPhotos,
            accessToken: accessToken,
            targetWidth: viewportWidth,
            targetHeight: viewportHeight,
            crop: false
          });
          
          console.log('Cloud Function result:', result);
          console.log(`Successfully converted ${result.successCount}/${result.totalCount} photos`);
          
          if (result.failed.length > 0) {
            console.warn(`Failed to convert ${result.failed.length} photos:`, result.failed);
          }
          
          // Convert the library photos to the expected format
          const processedMediaItems = recentPhotos.map((libraryItem: { id: string; baseUrl: string; mimeType: string; filename: string }) => {
            const converted = result.results.find(r => r.id === libraryItem.id);
            if (converted) {
              console.log(`Successfully converted library photo ${libraryItem.id} to base64`);
              return {
                id: libraryItem.id,
                base64Data: converted.base64Data,
                mimeType: converted.mimeType,
                filename: converted.filename,
                originalBaseUrl: libraryItem.baseUrl
              };
            } else {
              console.warn(`No base64 data for library photo ${libraryItem.id}`);
              return {
                id: libraryItem.id,
                baseUrl: libraryItem.baseUrl,
                mimeType: libraryItem.mimeType,
                filename: libraryItem.filename
              };
            }
          });
          
          console.log('Photo conversion complete, processed items:', processedMediaItems);
          onComplete(processedMediaItems);
        } catch (error) {
          console.error('Failed to convert photos via Cloud Function:', error);
          console.error('Error details:', error instanceof Error ? error.message : String(error));
          // Fallback to original items if conversion fails
          console.log('Falling back to original media items');
          onComplete(mediaItems);
        }
        return;
      }
      
      if (pollCount >= maxPolls && !isCompleted) {
        console.log('Picker session timeout reached');
        onError(new Error('Photo selection timed out. Please try again.'));
        return;
      }
      
      if (!isCompleted) {
        setTimeout(pollForCompletion, pollInterval);
      }
    } catch (error) {
      console.error('Error checking picker session:', error);
      
      // Handle specific error types
      if (error instanceof Error) {
        if (error.name === 'SecurityError') {
          console.log('Cross-origin access blocked, continuing to poll...');
        } else if (error.message.includes('Failed to fetch')) {
          console.log('Network error, continuing to poll...');
        } else {
          console.log('Other error, continuing to poll...');
        }
      }
      
      // Don't treat API errors as fatal - continue polling
      if (!isCompleted) {
        setTimeout(pollForCompletion, pollInterval);
      }
    }
  };

  // Start polling
  pollForCompletion();

  // Disable window close detection completely - it's too aggressive and interferes with photo selection
  // Users can close the picker window manually when they're done, and the polling will handle completion
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
 * Convert a Google Photos media item to base64 data URL
 */
export const convertPhotoToBase64 = async (mediaItem: PickerMediaItem, accessToken: string): Promise<string> => {
  try {
    // Try to get the image using the Google Photos Library API
    const response = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems/${mediaItem.id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch media item: ${response.status}`);
    }

    const data = await response.json();
    const baseUrl = data.baseUrl;
    
    if (!baseUrl) {
      throw new Error('No baseUrl found in media item');
    }

    // Fetch the actual image data
    const imageResponse = await fetch(baseUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.status}`);
    }

    // Convert to base64
    const arrayBuffer = await imageResponse.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    const mimeType = imageResponse.headers.get('content-type') || 'image/jpeg';
    
    return `data:${mimeType};base64,${base64}`;
  } catch (error) {
    console.error('Error converting photo to base64:', error);
    throw error;
  }
};

/**
 * Check if Google Photos token is expiring soon and warn user
 */
export const checkGooglePhotosTokenExpiry = (): { isExpiring: boolean; timeLeft: number; message: string } => {
  const tokenData = localStorage.getItem('googlePhotosToken');
  if (!tokenData) {
    return { isExpiring: false, timeLeft: 0, message: 'No token found' };
  }

  try {
    const parsed = JSON.parse(tokenData);
    if (!parsed.expiresAt) {
      return { isExpiring: false, timeLeft: 0, message: 'No expiration time set' };
    }

    const now = Date.now();
    const timeUntilExpiry = parsed.expiresAt - now;
    const minutesLeft = Math.round(timeUntilExpiry / 1000 / 60);

    if (timeUntilExpiry <= 0) {
      return { isExpiring: true, timeLeft: 0, message: 'Token has expired' };
    } else if (timeUntilExpiry < 10 * 60 * 1000) { // Less than 10 minutes
      return { 
        isExpiring: true, 
        timeLeft: minutesLeft, 
        message: `Google Photos connection expires in ${minutesLeft} minutes. You may need to reconnect soon.` 
      };
    } else {
      return { 
        isExpiring: false, 
        timeLeft: minutesLeft, 
        message: `Google Photos connected (expires in ${minutesLeft} minutes)` 
      };
    }
  } catch (error) {
    console.error('Error checking token expiry:', error);
    return { isExpiring: false, timeLeft: 0, message: 'Error checking token' };
  }
};

/**
 * Test function to debug Google Photos API issues
 */
export const debugGooglePhotosAPI = async (): Promise<void> => {
  try {

    // Check if we have a token
    const token = await getGooglePhotosToken();

    if (token) {
      // Test the Google Photos Library API
      try {
        const response = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=5`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        console.log('Google Photos Library API response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('Google Photos Library API response:', data);
          console.log('Number of media items:', data.mediaItems?.length || 0);

          if (data.mediaItems && data.mediaItems.length > 0) {
            console.log('First media item:', data.mediaItems[0]);
          }
        } else {
          const errorText = await response.text();
          console.error('Google Photos Library API error:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error testing Google Photos Library API:', error);
      }

      // Test the Google Photos Picker API
      try {
        console.log('Testing Google Photos Picker API...');
        const pickerResponse = await fetch('https://photospicker.googleapis.com/v1/sessions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        console.log('Google Photos Picker API response status:', pickerResponse.status);

        if (pickerResponse.ok) {
          const pickerData = await pickerResponse.json();
          console.log('Google Photos Picker API response:', pickerData);
        } else {
          const errorText = await pickerResponse.text();
          console.error('Google Photos Picker API error:', pickerResponse.status, errorText);
          
          // Check if it's a scope issue
          if (pickerResponse.status === 403) {
            console.error('🚨 SCOPE ISSUE: The token doesn\'t have the required scope for Google Photos Picker API');
            console.error('🔧 SOLUTION: Add this scope to your OAuth consent screen:');
            console.error('   https://www.googleapis.com/auth/photospicker.mediaitems.readonly');
            console.error('📖 See GOOGLE_PHOTOS_PICKER_SCOPE_FIX.md for detailed instructions');
          }
        }
      } catch (error) {
        console.error('Error testing Google Photos Picker API:', error);
      }
    }

    // Check stored photos
    const savedPhotos = localStorage.getItem('screensaverPhotos');
    if (savedPhotos) {
      const photos = JSON.parse(savedPhotos);
      console.log('Stored photos count:', photos.length);
      console.log('Stored photos structure:', photos);
    } else {
      console.log('No stored photos found');
    }

    console.log('=== End Debug ===');
  } catch (error) {
    console.error('Debug error:', error);
  }
};

/**
 * Load selected photos from localStorage and convert them to displayable URLs
 * We'll try multiple approaches to handle CORS restrictions
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
    
    if (!photos || photos.length === 0) {
      console.log('No photos in saved data');
      return [];
    }

    console.log(`Loading ${photos.length} selected photos...`);
    console.log('Stored photos data:', photos);
    
    // Check if we have base64 data (new format)
    const hasBase64Data = photos.some(photo => photo.base64Data);
    console.log('Has base64 data:', hasBase64Data);
    console.log('Photos with base64 data:', photos.filter(photo => photo.base64Data).length);
    
    if (hasBase64Data) {
      console.log('Using base64 data URLs (no CORS issues)');
      const base64Urls = photos
        .filter(photo => photo.base64Data)
        .map(photo => photo.base64Data!)
        .filter(url => url !== undefined);
      
      console.log(`Loaded ${base64Urls.length} base64 photos for screensaver`);
      return base64Urls;
    }
    
    console.log('No base64 data found - photos were not properly converted during selection');
    console.log('This means the base64 conversion failed during the selection process');
    
    // Log the structure of each stored photo for debugging
    photos.forEach((photo, index) => {
      console.log(`Photo ${index}:`, {
        id: photo.id,
        baseUrl: photo.baseUrl,
        base64Data: photo.base64Data,
        mimeType: photo.mimeType,
        filename: photo.filename,
        mediaFile: photo.mediaFile,
        productUrl: photo.productUrl,
        availableKeys: Object.keys(photo)
      });
    });
    
    console.log('Cannot display photos without base64 data - CORS prevents direct URL access');
    console.log('Please try selecting photos again to trigger the base64 conversion');
    
    return [];

  } catch (error) {
    console.error('Error loading selected photos:', error);
    return [];
  }
};