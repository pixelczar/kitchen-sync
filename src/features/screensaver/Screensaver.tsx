import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchRecentPhotos, getPhotoUrl, filterImages, authorizeGooglePhotos, isGooglePhotosConfigured } from '../../lib/google-photos';
import { getKitchenSyncPhotos } from '../../lib/google-photos-album';

// Sample photos as fallback
const SAMPLE_PHOTOS = [
  'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1581579438747-1dc8d17bbce4?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1475503572774-15a45e5d60b9?w=1920&h=1080&fit=crop',
  'https://images.unsplash.com/photo-1511988617509-a57c8a288659?w=1920&h=1080&fit=crop',
];

interface ScreensaverProps {
  onWake: () => void;
}

export const Screensaver = ({ onWake }: ScreensaverProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [photos, setPhotos] = useState<string[]>(SAMPLE_PHOTOS);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Load Google Photos if available
  const loadGooglePhotos = useCallback(async () => {
    // Check if Google Photos is configured
    if (!isGooglePhotosConfigured()) {
      console.log('Google Photos not configured, using sample photos');
      setPhotos(SAMPLE_PHOTOS);
      return;
    }

    let accessToken = localStorage.getItem('googlePhotosToken');
    
    // If no token, try to get one
    if (!accessToken) {
      try {
        accessToken = await authorizeGooglePhotos();
      } catch (error) {
        console.log('Google Photos authentication failed, using sample photos:', error);
        setPhotos(SAMPLE_PHOTOS);
        return;
      }
    }
    
    setIsLoadingPhotos(true);
    try {
      // First try to get photos from the Kitchen Sync album
      let googlePhotos = await getKitchenSyncPhotos(accessToken, 30);
      
      // If no Kitchen Sync album photos, fall back to recent photos
      if (googlePhotos.length === 0) {
        console.log('No Kitchen Sync album found, trying recent photos...');
        googlePhotos = await fetchRecentPhotos(accessToken, 30);
      }
      
      const imagePhotos = filterImages(googlePhotos);
      
      if (imagePhotos.length > 0) {
        const photoUrls = imagePhotos.map(photo => 
          getPhotoUrl(photo, 1920, 1080)
        );
        setPhotos(photoUrls);
        console.log(`Loaded ${photoUrls.length} Google Photos`);
      } else {
        console.log('No Google Photos found, using sample photos');
        setPhotos(SAMPLE_PHOTOS);
      }
    } catch (error) {
      console.error('Failed to load Google Photos:', error);
      // Fall back to sample photos
      setPhotos(SAMPLE_PHOTOS);
    } finally {
      setIsLoadingPhotos(false);
    }
  }, []);
  
  useEffect(() => {
    loadGooglePhotos();
  }, [loadGooglePhotos]);
  
  useEffect(() => {
    // Cycle through photos every 10 seconds
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % photos.length);
    }, 10000);
    
    return () => clearInterval(timer);
  }, [photos.length]);

  useEffect(() => {
    // Update time every second
    const timeTimer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timeTimer);
  }, []);
  
  return (
    <div
      className="fixed inset-0 bg-black z-50 cursor-pointer"
      onClick={onWake}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          className="w-full h-full relative overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
        >
          {!isLoadingPhotos && photos.length > 0 && (
            <motion.img
              src={photos[currentIndex]}
              alt="Family photo"
              className="w-full h-full object-cover"
              initial={{ scale: 1 }}
              animate={{ scale: 1.1, x: -20, y: -10 }}
              transition={{ duration: 10, ease: 'linear' }}
            />
          )}
          
          {/* Time and Date Display */}
          <motion.div 
            className="absolute bottom-4 right-8 text-white text-right"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2, duration: .8 }}
          >
            <div className="text-5xl text-white font-medium mb-1 tracking-tighter">
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
              <div className="text-[128px] font-extrabold text-yellow tracking-tighter leading-none">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: false 
                })}
              </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

