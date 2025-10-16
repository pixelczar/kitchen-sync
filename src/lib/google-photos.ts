// Google Photos API Integration
// Documentation: https://developers.google.com/photos

const GOOGLE_PHOTOS_API_KEY = import.meta.env.VITE_GOOGLE_PHOTOS_API_KEY;
const GOOGLE_PHOTOS_CLIENT_ID = import.meta.env.VITE_GOOGLE_PHOTOS_CLIENT_ID;

// OAuth scopes for Google Photos
const SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.readonly',
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
  return !!(GOOGLE_PHOTOS_API_KEY && GOOGLE_PHOTOS_CLIENT_ID);
};

/**
 * Authorize with Google Photos using OAuth 2.0
 * Returns access token on success
 */
export const authorizeGooglePhotos = async (): Promise<string> => {
  if (!isGooglePhotosConfigured()) {
    throw new Error('Google Photos API credentials not configured');
  }

  // Placeholder for OAuth flow
  // In a real implementation, this would:
  // 1. Open OAuth consent screen
  // 2. Get authorization code
  // 3. Exchange for access token
  // 4. Store token securely

  console.log('Google Photos OAuth flow would start here');
  console.log('Required scopes:', SCOPES);
  
  // TODO: Implement actual OAuth flow using Google Identity Services
  // See: https://developers.google.com/identity/protocols/oauth2/javascript-implicit-flow
  
  return Promise.resolve('mock-access-token');
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

  const response = await fetch(`https://photoslibrary.googleapis.com/v1/mediaItems?pageSize=${pageSize}`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch recent photos: ${response.statusText}`);
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

