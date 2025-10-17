import { motion } from 'framer-motion';
import { useWeather } from '../hooks/useWeather';
import { getMeteoconsIcon } from '../lib/weather';

interface WeatherWidgetProps {
  onClick: () => void;
}

export const WeatherWidget = ({ onClick }: WeatherWidgetProps) => {
  const { data, isLoading, error } = useWeather();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gray-light/50">
        <span className="text-sm text-gray-medium">Loading weather...</span>
      </div>
    );
  }

  if (error) {
    console.error('Weather error:', error);
    return (
      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-red/10 hover:bg-red/20 transition-all cursor-help" title="Weather API key may need activation (up to 2 hours)">
        <span className="text-xl">🌤️</span>
        <span className="text-sm text-gray-medium font-semibold">Weather unavailable</span>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { weather } = data;
  const weatherIcon = getMeteoconsIcon(weather.icon);

  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 px-4 py-2 rounded-full transition-all cursor-pointer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="w-16 h-16 flex items-center justify-center p-2">
        <img
          src={`/weather-icons/${weatherIcon}.svg`}
          alt={weather.description}
          className="w-full h-full"
          style={{ filter: 'brightness(0.8) saturate(2)' }}
        />
      </div>
      <div className="flex flex-col items-start">
        <span className="text-2xl font-bold text-charcoal tracking-tighter">
          {weather.temp}°
        </span>
      </div>
    </motion.button>
  );
};

