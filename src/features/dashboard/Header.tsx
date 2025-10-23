import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWeather } from '../../hooks/useWeather';
import { getMeteoconsIcon } from '../../lib/weather';
import { Breadcrumb } from '../../components/Breadcrumb';
import { WeatherModal } from '../../components/WeatherModal';
import { useCurrentHousehold } from '../../hooks/useCurrentHousehold';

export const Header = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState(false);
  const { data: weatherData, isLoading } = useWeather();
  const { currentHousehold } = useCurrentHousehold();
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000); // Update every second
    
    return () => clearInterval(timer);
  }, []);
  
  const formattedDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
  
  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Simple weather icon that uses the animated SVG directly
  const WeatherIcon = useMemo(() => {
    if (!weatherData) return null;
    
    const icon = weatherData.weather.icon;
    const iconName = getMeteoconsIcon(icon);

    return (
      <div className="w-8 h-8 flex items-center justify-center">
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
              parent.innerHTML = emojiMap[code] || '🌤️';
            }
          }}
        />
      </div>
    );
  }, [weatherData]); // Only re-create when weather data changes
  
  return (
    <header className="bg-cream w-full px-6 py-4">
      <div className="flex items-center justify-between w-full max-w-full">
        {/* Logo and Breadcrumb */}
        <div className="flex items-center gap-3">
          <h1
            className="text-2xl font-bold text-charcoal tracking-tighter cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate('/settings')}
            title="Open settings"
          >
            {currentHousehold?.name || 'KS'}
          </h1>
          <Breadcrumb />
        </div>
        
        <div className="flex items-center gap-8">
          {/* User Status */}
          {/* {user && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-green/10 border border-green/20">
              {user.photoURL && (
                <img src={user.photoURL} alt="avatar" className="w-6 h-6 rounded-full" />
              )}
              <div className="text-sm font-medium text-charcoal">
                {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
          )} */}
          
          {/* Simple Weather Widget */}
          {weatherData && !isLoading && (
            <motion.button
              className="flex items-center gap-3 hover:bg-gray-light/20 rounded-xl px-3 py-2 transition-colors cursor-pointer tracking-tighter" 
              onClick={() => setIsWeatherModalOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {WeatherIcon}
              <div className="text-2xl font-bold text-charcoal">
                {weatherData.weather.temp}°
              </div>
            </motion.button>
          )}
          
          {/* Date Display */}
          <div className="text-2xl font-bold text-charcoal tracking-tighter">
            {formattedDate}
          </div>
          
          {/* Time Display */}
          <div className="text-2xl font-bold text-charcoal tabular-nums tracking-tighter">
            {formattedTime}
          </div>
        </div>
      </div>
      
      {/* Weather Modal */}
      <WeatherModal 
        isOpen={isWeatherModalOpen} 
        onClose={() => setIsWeatherModalOpen(false)} 
      />
    </header>
  );
};

