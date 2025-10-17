// Test Google Photos API directly
// This helps debug scope and token issues

export const testGooglePhotosAPI = async (): Promise<void> => {
  console.log('🧪 Testing Google Photos API directly...');
  
  const token = localStorage.getItem('googlePhotosToken');
  if (!token) {
    console.error('❌ No token found');
    return;
  }
  
  console.log('✅ Token found:', token.substring(0, 20) + '...');
  
  // Test 1: Simple albums request
  try {
    console.log('📁 Testing albums API...');
    const response = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('📁 Albums response:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Albums API working! Found', data.albums?.length || 0, 'albums');
      
      // Look for Kitchen Sync album
      const kitchenSyncAlbum = data.albums?.find((album: any) => 
        album.title.toLowerCase().includes('kitchen sync') ||
        album.title.toLowerCase().includes('kitchen-sync') ||
        album.title.toLowerCase().includes('kitchensync')
      );
      
      if (kitchenSyncAlbum) {
        console.log('✅ Found Kitchen Sync album:', kitchenSyncAlbum.title);
      } else {
        console.log('⚠️ Kitchen Sync album not found');
        console.log('Available albums:', data.albums?.map((a: any) => a.title) || []);
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Albums API failed:', errorText);
    }
  } catch (error) {
    console.error('❌ Albums API error:', error);
  }
  
  // Test 2: Simple search request
  try {
    console.log('📸 Testing search API...');
    const response = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:search', {
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
    
    console.log('📸 Search response:', response.status, response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Search API working! Found', data.mediaItems?.length || 0, 'photos');
    } else {
      const errorText = await response.text();
      console.error('❌ Search API failed:', errorText);
    }
  } catch (error) {
    console.error('❌ Search API error:', error);
  }
};

// Make function available globally
if (typeof window !== 'undefined') {
  (window as any).testGooglePhotosAPI = testGooglePhotosAPI;
}
