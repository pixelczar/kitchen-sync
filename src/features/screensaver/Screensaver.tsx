import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadSelectedPhotos } from '../../lib/google-photos';

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
  
  // Load selected photos from Google Photos Picker
  const loadGooglePhotos = useCallback(async () => {
    setIsLoadingPhotos(true);
    try {
      // Try to load selected photos from the Picker API
      const selectedPhotos = await loadSelectedPhotos();
      
      if (selectedPhotos.length > 0) {
        setPhotos(selectedPhotos);
        console.log(`Loaded ${selectedPhotos.length} selected photos for screensaver`);
      } else {
        console.log('No selected photos found, using sample photos');
        setPhotos(SAMPLE_PHOTOS);
      }
    } catch (error) {
      console.error('Failed to load selected photos:', error);
      console.log('Falling back to sample photos due to CORS restrictions');
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
          >
            <motion.div 
              className="text-5xl text-white font-medium mb-1 tracking-tighter"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.2, duration: 0.9, ease: "circInOut" }}
            >
              {currentTime.toLocaleDateString('en-US', { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric' 
              })}
            </motion.div>
            <motion.div 
              className="text-[128px] font-extrabold text-yellow tracking-tighter leading-none"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.3, duration: 0.8, ease: "circInOut" }}
            >
              {currentTime.toLocaleTimeString('en-US', { 
                hour: 'numeric', 
                minute: '2-digit',
                hour12: false 
              })}
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

