// Google Photos Debug Utilities
// This helps troubleshoot OAuth and API issues

import { isGooglePhotosConfigured } from './google-photos';

/**
 * Test the current Google Photos token and API access
 */
export const debugGooglePhotosToken = async (): Promise<void> => {
  console.log('🔍 Debugging Google Photos Integration...');
  
  // Check if configured
  if (!isGooglePhotosConfigured()) {
    console.error('❌ Google Photos not configured - missing CLIENT_ID');
    return;
  }
  
  // Check for token
  const token = localStorage.getItem('googlePhotosToken');
  if (!token) {
    console.error('❌ No Google Photos token found in localStorage');
    return;
  }
  
  console.log('✅ Google Photos CLIENT_ID configured');
  console.log('✅ Google Photos token found:', token.substring(0, 20) + '...');
  
  // Test token validity
  try {
    console.log('🧪 Testing token with Google Photos API...');
    
    // Test 1: Get albums
    const albumsResponse = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📁 Albums API response:', albumsResponse.status, albumsResponse.statusText);
    
    if (albumsResponse.ok) {
      const albums = await albumsResponse.json();
      console.log('✅ Albums API working - found', albums.albums?.length || 0, 'albums');
      
      // Look for Kitchen Sync album
      const kitchenSyncAlbum = albums.albums?.find((album: any) => 
        album.title.toLowerCase().includes('kitchen sync') ||
        album.title.toLowerCase().includes('kitchen-sync') ||
        album.title.toLowerCase().includes('kitchensync')
      );
      
      if (kitchenSyncAlbum) {
        console.log('✅ Found Kitchen Sync album:', kitchenSyncAlbum.title);
      } else {
        console.log('⚠️ Kitchen Sync album not found. Create an album called "Kitchen Sync" in Google Photos.');
      }
    } else {
      const errorText = await albumsResponse.text();
      console.error('❌ Albums API failed:', errorText);
    }
    
    // Test 2: Search for photos
    const searchResponse = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        pageSize: 1,
        filters: {
          mediaTypeFilter: {
            mediaTypes: ['PHOTO']
          }
        }
      }),
    });
    
    console.log('📸 Search API response:', searchResponse.status, searchResponse.statusText);
    
    if (searchResponse.ok) {
      const searchData = await searchResponse.json();
      console.log('✅ Search API working - found', searchData.mediaItems?.length || 0, 'photos');
    } else {
      const errorText = await searchResponse.text();
      console.error('❌ Search API failed:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Debug test failed:', error);
  }
};

/**
 * Clear all Google Photos data and reset
 */
export const resetGooglePhotos = (): void => {
  console.log('🔄 Resetting Google Photos integration...');
  
  // Clear localStorage
  localStorage.removeItem('googlePhotosToken');
  localStorage.removeItem('googlePhotosState');
  
  // Clear sessionStorage
  sessionStorage.removeItem('googlePhotosState');
  
  console.log('✅ Google Photos data cleared');
  console.log('🔄 Please refresh the page and reconnect to Google Photos');
};

// Make functions available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).debugGooglePhotos = debugGooglePhotosToken;
  (window as any).resetGooglePhotos = resetGooglePhotos;
}
