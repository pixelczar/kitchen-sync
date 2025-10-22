import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useWeather, useWeatherForecast } from '../hooks/useWeather';
import { getMeteoconsIcon } from '../lib/weather';

interface WeatherWidgetProps {
  className?: string;
}

export const WeatherWidget = ({ className = '' }: WeatherWidgetProps) => {
  const { data: weatherData, isLoading: weatherLoading, error: weatherError } = useWeather();
  const { data: forecastData, isLoading: forecastLoading, error: forecastError } = useWeatherForecast();
  const [currentTime, setCurrentTime] = useState(new Date());


  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get today and tomorrow from forecast
  const getTodayAndTomorrow = () => {
    if (!forecastData || forecastData.length < 2) return { today: null, tomorrow: null };
    
    const today = forecastData[0];
    const tomorrow = forecastData[1];
    
    return { today, tomorrow };
  };

  const { today, tomorrow } = getTodayAndTomorrow();

  // Loading state
  if (weatherLoading || forecastLoading) {
    return (
      <div className={`rounded-3xl p-6 bg-gray-light/30 ${className}`}>
        <div className="h-8 w-32 bg-gray-light/50 rounded animate-pulse mb-4" />
        <div className="space-y-4">
          <div className="h-16 bg-gray-light/50 rounded animate-pulse" />
          <div className="h-16 bg-gray-light/50 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  // Error state
  if (weatherError || forecastError) {
    return (
      <div className={`rounded-3xl p-6 bg-gray-light/30 ${className}`}>
        <div className="text-center">
          <div className="text-4xl mb-2">🌤️</div>
          <p className="text-gray-medium font-semibold">Weather unavailable</p>
        </div>
      </div>
    );
  }

  // Format time
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    });
  };

  // Format date
  const formatDate = (dateStr: string) => {
    // Parse the date string in local timezone to avoid UTC offset issues
    const date = new Date(dateStr + 'T12:00:00');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
  };

  // Animated weather icon component
  const AnimatedWeatherIcon = ({ icon, size = 'w-12 h-12' }: { icon: string; size?: string }) => {
    const iconName = getMeteoconsIcon(icon);
    
    // Animation variants based on weather type
    const getAnimationVariants = () => {
      const code = icon.slice(0, 2);
      
      switch (code) {
        case '01': // Clear sky
          return {
            animate: { 
              rotate: [0, 360],
              scale: [1, 1.1, 1]
            },
            transition: { 
              duration: 20, 
              repeat: Infinity, 
              ease: "linear" 
            }
          };
        case '02': // Few clouds
        case '03': // Scattered clouds
        case '04': // Broken clouds
          return {
            animate: { 
              x: [0, 5, -5, 0],
              y: [0, -2, 2, 0]
            },
            transition: { 
              duration: 4, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }
          };
        case '09': // Shower rain
        case '10': // Rain
          return {
            animate: { 
              y: [0, -3, 0]
            },
            transition: { 
              duration: 1.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }
          };
        case '11': // Thunderstorm
          return {
            animate: { 
              scale: [1, 1.2, 1],
              opacity: [1, 0.7, 1]
            },
            transition: { 
              duration: 0.5, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }
          };
        case '13': // Snow
          return {
            animate: { 
              y: [0, -2, 0],
              rotate: [0, 5, -5, 0]
            },
            transition: { 
              duration: 2, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }
          };
        default:
          return {
            animate: { 
              scale: [1, 1.05, 1]
            },
            transition: { 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }
          };
      }
    };

    return (
      <motion.div
        className={`${size} flex items-center justify-center`}
        {...getAnimationVariants()}
      >
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
      </motion.div>
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

  return (
    <motion.div 
      className={`rounded-3xl p-6 bg-white h-full ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-2xl font-black text-charcoal">
            Weather
          </h3>
          <p className="text-sm text-gray-medium">
            {weatherData?.weather?.location} • {formatTime(currentTime)}
          </p>
        </div>
        {weatherData && (
          <div className="text-right">
            <div className="text-3xl font-black text-charcoal">
              {weatherData.weather.temp}°
            </div>
            <p className="text-sm text-gray-medium capitalize">
              {weatherData.weather.description}
            </p>
          </div>
        )}
      </div>

      {/* Today and Tomorrow */}
      <div className="space-y-4">
        {/* Today */}
        {today && (
          <motion.div 
            className="flex items-center justify-between p-4 rounded-2xl bg-gray-light/20"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center gap-4">
              <AnimatedWeatherIcon icon={today.icon} size="w-12 h-12" />
              <div>
                <h4 className="font-bold text-charcoal text-lg">
                  {formatDate(today.date)}
                </h4>
                <p className="text-sm text-gray-medium capitalize">
                  {today.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-black text-charcoal">
                {today.tempMax}°/{today.tempMin}°
              </div>
              <div className="text-xs text-gray-medium">
                H/L
              </div>
            </div>
          </motion.div>
        )}

        {/* Tomorrow */}
        {tomorrow && (
          <motion.div 
            className="flex items-center justify-between p-4 rounded-2xl bg-gray-light/20"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center gap-4">
              <AnimatedWeatherIcon icon={tomorrow.icon} size="w-10 h-10" />
              <div>
                <h4 className="font-bold text-charcoal text-lg">
                  {formatDate(tomorrow.date)}
                </h4>
                <p className="text-sm text-gray-medium capitalize">
                  {tomorrow.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-black text-charcoal">
                {tomorrow.tempMax}°/{tomorrow.tempMin}°
              </div>
              <div className="text-xs text-gray-medium">
                H/L
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Additional info */}
      {weatherData && (
        <div className="mt-4 pt-4 border-t border-gray-light/30">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-center">
              <div className="text-gray-medium">Feels like</div>
              <div className="font-bold text-charcoal">{weatherData.weather.feelsLike}°</div>
            </div>
            <div className="text-center">
              <div className="text-gray-medium">Humidity</div>
              <div className="font-bold text-charcoal">{weatherData.weather.humidity}%</div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};