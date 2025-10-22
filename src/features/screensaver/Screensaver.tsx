import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadSelectedPhotos } from '../../lib/google-photos';
import { useWeather } from '../../hooks/useWeather';
import { getMeteoconsIcon } from '../../lib/weather';

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
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  
  // Weather data
  const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useWeather();
  
  // Simple weather icon component (no animations to avoid jank)
  const WeatherIcon = ({ icon, size = 'w-12 h-12' }: { icon: string; size?: string }) => {
    const iconName = getMeteoconsIcon(icon);
    
    return (
      <div className={`${size} flex items-center justify-center`}>
        <img
          src={`/weather-icons/${iconName}.svg`}
          alt={iconName}
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to emoji if SVG not found
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            const parent = target.parentElement;
            if (parent) {
              parent.innerHTML = getWeatherEmoji(icon);
            }
          }}
        />
      </div>
    );
  };

  // Fallback emoji function
  const getWeatherEmoji = (icon: string): string => {
    const code = icon.slice(0, 2);
    const isNight = icon.endsWith('n');
    
    const emojiMap: Record<string, string> = {
      '01': isNight ? '🌙' : '☀️',
      '02': isNight ? '☁️' : '⛅',
      '03': '☁️',
      '04': '☁️',
      '09': '🌧️',
      '10': '🌦️',
      '11': '⛈️',
      '13': '❄️',
      '50': '🌫️',
    };
    
    return emojiMap[code] || '🌤️';
  };
  
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
          {!isLoadingPhotos && photos.length > 0 && !imageErrors.has(currentIndex) && (
            <motion.img
              src={photos[currentIndex]}
              alt="Family photo"
              className="w-full h-full object-cover"
              initial={{ scale: 1 }}
              animate={{ scale: 1.1, x: -20, y: -10 }}
              transition={{ duration: 10, ease: 'linear' }}
              onError={() => {
                console.warn(`Failed to load image at index ${currentIndex}:`, photos[currentIndex]);
                setImageErrors(prev => new Set([...prev, currentIndex]));
                // Move to next image if current one fails
                setCurrentIndex((prev) => (prev + 1) % photos.length);
              }}
            />
          )}
          
          {/* Fallback for failed images */}
          {!isLoadingPhotos && photos.length > 0 && imageErrors.has(currentIndex) && (
            <div className="w-full h-full bg-gradient-to-br from-purple to-blue flex items-center justify-center">
              <div className="text-white text-center">
                <div className="text-6xl mb-4">📸</div>
                <div className="text-2xl font-semibold">Photo unavailable</div>
                <div className="text-lg opacity-75 mt-2">CORS restrictions prevent display</div>
              </div>
            </div>
          )}
          
          {/* Subtle black gradient from bottom for better visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
          
          {/* Weather Widget - Bottom Left */}
          <motion.div 
            className="absolute bottom-4 left-2 text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.4, duration: 0.8, ease: "circInOut" }}
          >
            {!weatherLoading && !weatherError && weatherData && (
              <div className="flex items-center gap-4">
                <WeatherIcon icon={weatherData.weather.icon} size="w-40 h-40" />
                <div>
                  <div className="text-8xl font-bold text-white tracking-tighter">
                    {weatherData.weather.temp}°
                  </div>
                  <div className="text-4xl text-white/80 tracking-tight capitalize">
                    {weatherData.weather.description}
                  </div>
                </div>
              </div>
            )}
            
            {/* Weather loading state */}
            {weatherLoading && (
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white/20 rounded-full animate-pulse" />
                <div>
                  <div className="h-12 w-20 bg-white/20 rounded animate-pulse mb-2" />
                  <div className="h-6 w-32 bg-white/20 rounded animate-pulse" />
                </div>
              </div>
            )}
            
            {/* Weather error state */}
            {weatherError && (
              <div className="flex items-center gap-6">
                <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🌤️</span>
                </div>
                <div>
                  <div className="text-2xl text-white/80">Weather unavailable</div>
                </div>
              </div>
            )}
          </motion.div>

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
              className="text-9xl font-extrabold text-yellow tracking-tighter leading-none"
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

