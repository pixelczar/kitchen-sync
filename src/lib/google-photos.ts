// Google Photos API Integration
// Documentation: https://developers.google.com/photos

const GOOGLE_PHOTOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_PHOTOS_CLIENT_ID;

// OAuth scopes for Google Photos
const SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.readonly',
  'https://www.googleapis.com/auth/photoslibrary',
];

export interface GooglePhoto {
  id: string;
  baseUrl: string;
  mimeType: string;
  filename: string;
  mediaMetadata?: {
    creationTime: string;
    width: string;
    height: string;
  };
}

export interface GoogleAlbum {
  id: string;
  title: string;
  coverPhotoBaseUrl?: string;
  mediaItemsCount?: string;
}

/**
 * Check if Google Photos API is configured
 */
export const isGooglePhotosConfigured = (): boolean => {
  return !!GOOGLE_PHOTOS_CLIENT_ID;
};

/**
 * Authorize with Google Photos using a robust redirect-based OAuth flow
 * This bypasses all GSI network issues and uses direct OAuth
 */
export const authorizeGooglePhotos = async (): Promise<string> => {
  if (!isGooglePhotosConfigured()) {
    throw new Error('Google Photos API credentials not configured');
  }

  console.log('Starting Google Photos authorization...');
  console.log('Client ID:', GOOGLE_PHOTOS_CLIENT_ID);
  
  // Use direct redirect approach that bypasses all GSI issues
  const redirectUri = `${window.location.origin}/google-auth-callback.html`;
  const state = Math.random().toString(36).substring(2, 15);
  
  console.log('Redirect URI:', redirectUri);
  console.log('State:', state);
  
  // Store state for verification
  sessionStorage.setItem('googlePhotosState', state);
  
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${GOOGLE_PHOTOS_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `scope=${encodeURIComponent(SCOPES.join(' '))}&` +
    `response_type=code&` +
    `access_type=offline&` +
    `state=${state}&` +
    `include_granted_scopes=true`;

  console.log('OAuth URL:', authUrl);
  console.log('Redirecting to Google OAuth...');
  
  // Redirect to Google OAuth (this will work even with network issues)
  window.location.href = authUrl;
  
  // This will never resolve because we're redirecting
  return new Promise(() => {});
};

/**
 * Fetch user's photo albums
 */
export const fetchAlbums = async (accessToken: string): Promise<GoogleAlbum[]> => {
  if (!isGooglePhotosConfigured()) {
    throw new Error('Google Photos API not configured');
  }

  const response = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch albums: ${response.statusText}`);
  }

  const data = await response.json();
  return data.albums || [];
};

/**
 * Fetch photos from a specific album
 */
export const fetchPhotosFromAlbum = async (
  accessToken: string,
  albumId: string,
  pageSize: number = 50
): Promise<GooglePhoto[]> => {
  if (!isGooglePhotosConfigured()) {
    throw new Error('Google Photos API not configured');
  }

  const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      albumId,
      pageSize,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch photos: ${response.statusText}`);
  }

  const data = await response.json();
  return data.mediaItems || [];
};

/**
 * Fetch recent photos (not from albums)
 */
export const fetchRecentPhotos = async (
  accessToken: string,
  pageSize: number = 50
): Promise<GooglePhoto[]> => {
  if (!isGooglePhotosConfigured()) {
    throw new Error('Google Photos API not configured');
  }

  // Use the search endpoint to get recent photos
  const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pageSize,
      // Get photos from the last 30 days
      filters: {
        dateFilter: {
          ranges: [{
            startDate: {
              year: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getFullYear(),
              month: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getMonth() + 1,
              day: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).getDate()
            },
            endDate: {
              year: new Date().getFullYear(),
              month: new Date().getMonth() + 1,
              day: new Date().getDate()
            }
          }]
        },
        mediaTypeFilter: {
          mediaTypes: ['PHOTO']
        }
      }
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch recent photos: ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();
  return data.mediaItems || [];
};

/**
 * Get a photo URL with specific size parameters
 * Google Photos API requires appending size parameters to baseUrl
 */
export const getPhotoUrl = (photo: GooglePhoto, width: number, height: number): string => {
  return `${photo.baseUrl}=w${width}-h${height}`;
};

/**
 * Filter photos by type (only images, no videos)
 */
export const filterImages = (photos: GooglePhoto[]): GooglePhoto[] => {
  return photos.filter(photo => photo.mimeType.startsWith('image/'));
};

