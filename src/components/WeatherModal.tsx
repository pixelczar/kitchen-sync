import { motion, AnimatePresence } from 'framer-motion';
import { useWeather, useWeatherForecast } from '../hooks/useWeather';
import { getMeteoconsIcon } from '../lib/weather';

interface WeatherModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WeatherModal = ({ isOpen, onClose }: WeatherModalProps) => {
  const { data: currentData } = useWeather();
  const { data: forecast, isLoading: forecastLoading } = useWeatherForecast(
    currentData?.location.lat,
    currentData?.location.lon
  );

  // Note: Not using setModalOpen from uiStore since weather modal is fullscreen
  // and we don't want the background to blur/scale (opacity 0.85 issue)

  if (!currentData) return null;

  const { weather } = currentData;
  const mainWeatherIcon = getMeteoconsIcon(weather.icon);

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-4 z-[100] overflow-auto bg-purple rounded-3xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ 
            duration: 0.2, 
            ease: [0.4, 0, 0.2, 1],
            exit: { duration: 0.1, ease: [0.4, 0, 0.2, 1] }
          }}
        >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-8 right-8 w-20 h-20 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-white/40 hover:text-white text-2xl font-bold z-10 transition-colors"
            >
              <span className="text-4xl">×</span>
            </button>

            <div className="max-w-6xl mx-auto px-8 py-12">
              {/* Current Weather - Hero Section */}
              <motion.div
                className="mb-16"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="text-2xl font-bold text-white/90 text-center mb-8">
                  {weather.location}
                </div>

                {/* Icon, Temp, Description Row */}
                <div className="flex items-center justify-center gap-8 mb-12">
                  <img
                    src={`/weather-icons/${mainWeatherIcon}.svg`}
                    alt={weather.description}
                    className="w-48 h-48"
                  />
                  <div className="flex flex-col items-start">
                    <div className="text-8xl font-black tracking-tight text-white leading-none mb-2">
                      {weather.temp}°F
                    </div>
                    <div className="text-3xl text-white/80 capitalize font-semibold">
                      {weather.description}
                    </div>
                  </div>
                </div>

                {/* Current Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                  <div className="p-4">
                    <div className="text-white/70 text-sm font-semibold mb-1">Feels Like</div>
                    <div className="text-white text-3xl font-black">{weather.feelsLike}°</div>
                  </div>
                  <div className="p-4">
                    <div className="text-white/70 text-sm font-semibold mb-1">Humidity</div>
                    <div className="text-white text-3xl font-black">{weather.humidity}%</div>
                  </div>
                  <div className="p-4">
                    <div className="text-white/70 text-sm font-semibold mb-1">High / Low</div>
                    <div className="text-white text-3xl font-black">
                      {weather.tempMax}° / {weather.tempMin}°
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-white/70 text-sm font-semibold mb-1">Sunrise</div>
                    <div className="text-white text-3xl font-black">{formatTime(weather.sunrise)}</div>
                  </div>
                </div>
              </motion.div>

              {/* 5-Day Forecast */}
              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="text-3xl font-black text-white mb-6">5-Day Forecast</h3>
                
                {forecastLoading ? (
                  <div className="text-white/70 text-center py-12">Loading forecast...</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    {forecast?.map((day, index) => {
                      const meteoconsIcon = getMeteoconsIcon(day.icon);
                      return (
                        <motion.div
                          key={day.date}
                          className="bg-black/10 backdrop-blur-sm rounded-2xl p-6 text-center"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.3 + index * 0.05 }}
                        >
                          <div className="text-white/80 font-bold mb-3">{formatDate(day.date)}</div>
                          <img
                            src={`/weather-icons/${meteoconsIcon}.svg`}
                            alt={day.description}
                            className="w-20 h-20 mx-auto mb-3"
                          />
                          <div className="text-white text-3xl font-black mb-2">{day.temp}°</div>
                          <div className="text-white/70 text-sm capitalize mb-3">{day.description}</div>
                          <div className="flex items-center justify-center gap-4 text-white/60 text-sm">
                            <span>💧 {day.pop}%</span>
                            <span>💨 {day.windSpeed} mph</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

