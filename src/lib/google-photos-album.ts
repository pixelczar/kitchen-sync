// Google Photos Album Integration for Kitchen Sync
// This provides functions to work with a dedicated "Kitchen Sync" album

import { GooglePhoto, GoogleAlbum, fetchAlbums, fetchPhotosFromAlbum } from './google-photos';

const KITCHEN_SYNC_ALBUM_NAME = 'Kitchen Sync';

/**
 * Find the Kitchen Sync album
 */
export const findKitchenSyncAlbum = async (accessToken: string): Promise<GoogleAlbum | null> => {
  try {
    const albums = await fetchAlbums(accessToken);
    const kitchenSyncAlbum = albums.find(album => 
      album.title.toLowerCase().includes('kitchen sync') ||
      album.title.toLowerCase().includes('kitchen-sync') ||
      album.title.toLowerCase().includes('kitchensync')
    );
    return kitchenSyncAlbum || null;
  } catch (error) {
    console.error('Error finding Kitchen Sync album:', error);
    return null;
  }
};

/**
 * Get photos from the Kitchen Sync album
 */
export const getKitchenSyncPhotos = async (
  accessToken: string,
  pageSize: number = 50
): Promise<GooglePhoto[]> => {
  try {
    const album = await findKitchenSyncAlbum(accessToken);
    
    if (!album) {
      console.log('Kitchen Sync album not found. Create an album called "Kitchen Sync" in Google Photos.');
      return [];
    }
    
    console.log('Found Kitchen Sync album:', album.title);
    return await fetchPhotosFromAlbum(accessToken, album.id, pageSize);
  } catch (error) {
    console.error('Error fetching Kitchen Sync photos:', error);
    return [];
  }
};

/**
 * Create the Kitchen Sync album (if it doesn't exist)
 * Note: This requires additional API permissions and might need server-side implementation
 */
export const createKitchenSyncAlbum = async (accessToken: string): Promise<GoogleAlbum | null> => {
  // This would require the Google Photos Library API album creation endpoint
  // For now, we'll just return null and let the user create it manually
  console.log('Please create an album called "Kitchen Sync" in Google Photos manually.');
  return null;
};
