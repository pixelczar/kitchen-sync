import { useQuery } from '@tanstack/react-query';
import { getUserLocation, fetchCurrentWeather, fetchWeatherForecast } from '../lib/weather';

export const useWeather = () => {
  return useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      try {
        const location = await getUserLocation();
        const weather = await fetchCurrentWeather(location.lat, location.lon);
        return { weather, location };
      } catch (error) {
        console.error('🌤️ Weather fetch error:', error);
        throw error;
      }
    },
    staleTime: 600000, // 10 minutes
    retry: 2,
  });
};

export const useWeatherForecast = (lat?: number, lon?: number) => {
  return useQuery({
    queryKey: ['weather-forecast', lat, lon],
    queryFn: async () => {
      if (!lat || !lon) {
        const location = await getUserLocation();
        return fetchWeatherForecast(location.lat, location.lon);
      }
      return fetchWeatherForecast(lat, lon);
    },
    enabled: true,
    staleTime: 600000, // 10 minutes
  });
};

