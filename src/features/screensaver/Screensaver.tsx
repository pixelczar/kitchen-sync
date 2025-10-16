import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchRecentPhotos, getPhotoUrl, filterImages } from '../../lib/google-photos';

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
  
  // Load Google Photos if available
  const loadGooglePhotos = useCallback(async () => {
    const accessToken = localStorage.getItem('googlePhotosToken');
    if (!accessToken) return;
    
    setIsLoadingPhotos(true);
    try {
      const googlePhotos = await fetchRecentPhotos(accessToken, 30);
      const imagePhotos = filterImages(googlePhotos);
      
      if (imagePhotos.length > 0) {
        const photoUrls = imagePhotos.map(photo => 
          getPhotoUrl(photo, 1920, 1080)
        );
        setPhotos(photoUrls);
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
          
          {/* Display overlay text */}
          <div className="absolute bottom-8 right-8 text-white/70 text-sm">
            Tap anywhere to wake
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

