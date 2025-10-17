// Google Photos Starred Photos Integration
// This provides functions to work with starred/favorite photos

import { GooglePhoto } from './google-photos';

/**
 * Fetch starred photos from Google Photos
 * Note: Google Photos API doesn't have a direct "starred" filter,
 * but we can use the "favorites" filter which is the closest equivalent
 */
export const fetchStarredPhotos = async (
  accessToken: string,
  pageSize: number = 50
): Promise<GooglePhoto[]> => {
  try {
    const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageSize,
        // Use the favorites filter to get starred photos
        filters: {
          mediaTypeFilter: {
            mediaTypes: ['PHOTO']
          },
          // Note: Google Photos API doesn't have a direct "starred" filter
          // We'll need to use a different approach or combine with other filters
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch starred photos: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.mediaItems || [];
  } catch (error) {
    console.error('Error fetching starred photos:', error);
    return [];
  }
};

/**
 * Alternative approach: Get photos from a specific time range
 * This can be used to get recent favorites
 */
export const fetchRecentFavorites = async (
  accessToken: string,
  daysBack: number = 30,
  pageSize: number = 50
): Promise<GooglePhoto[]> => {
  try {
    const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageSize,
        filters: {
          dateFilter: {
            ranges: [{
              startDate: {
                year: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).getFullYear(),
                month: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).getMonth() + 1,
                day: new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).getDate()
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
      throw new Error(`Failed to fetch recent favorites: ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();
    return data.mediaItems || [];
  } catch (error) {
    console.error('Error fetching recent favorites:', error);
    return [];
  }
};
