// Weather API Integration (using OpenWeatherMap)
// Get a free API key at: https://openweathermap.org/api

const WEATHER_API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo';
const WEATHER_API_BASE = 'https://api.openweathermap.org/data/2.5';

export interface WeatherData {
  temp: number;
  feelsLike: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  description: string;
  icon: string;
  location: string;
  sunrise: number;
  sunset: number;
}

export interface ForecastDay {
  date: string;
  temp: number;
  tempMin: number;
  tempMax: number;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  pop: number; // Probability of precipitation
}

/**
 * Get user's location using browser geolocation API
 */
export const getUserLocation = (): Promise<{ lat: number; lon: number }> => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      // Fallback to New York City
      resolve({ lat: 40.7128, lon: -74.0060 });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      (error) => {
        console.warn('🌤️ Geolocation failed, using fallback location:', error.message);
        // Fallback to New York City
        resolve({ lat: 40.7128, lon: -74.0060 });
      }
    );
  });
};

/**
 * Fetch current weather data for coordinates
 */
export const fetchCurrentWeather = async (lat: number, lon: number): Promise<WeatherData> => {
  const url = `${WEATHER_API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=imperial`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  return {
    temp: Math.round(data.main.temp),
    feelsLike: Math.round(data.main.feels_like),
    tempMin: Math.round(data.main.temp_min),
    tempMax: Math.round(data.main.temp_max),
    humidity: data.main.humidity,
    description: data.weather[0].description,
    icon: data.weather[0].icon,
    location: data.name,
    sunrise: data.sys.sunrise,
    sunset: data.sys.sunset,
  };
};

/**
 * Fetch 5-day weather forecast
 */
export const fetchWeatherForecast = async (lat: number, lon: number): Promise<ForecastDay[]> => {
  const url = `${WEATHER_API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${WEATHER_API_KEY}&units=imperial`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Group by day and find the best representative forecast for each day
  const dailyForecasts: ForecastDay[] = [];
  const dayGroups: { [dateStr: string]: any[] } = {};
  
  // Group all forecasts by date
  for (const item of data.list) {
    const date = new Date(item.dt * 1000);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!dayGroups[dateStr]) {
      dayGroups[dateStr] = [];
    }
    dayGroups[dateStr].push(item);
  }
  
  // Process each day to get the best representative forecast
  const sortedDates = Object.keys(dayGroups).sort();
  
  for (const dateStr of sortedDates) {
    if (dailyForecasts.length >= 5) break;
    
    const dayForecasts = dayGroups[dateStr];
    
    // Find the forecast closest to noon (12:00) for the main display
    let bestForecast = dayForecasts[0];
    let bestHourDiff = Math.abs(dayForecasts[0].dt * 1000 - new Date(dateStr + 'T12:00:00Z').getTime());
    
    for (const forecast of dayForecasts) {
      const forecastDate = new Date(forecast.dt * 1000);
      const hourDiff = Math.abs(forecastDate.getTime() - new Date(dateStr + 'T12:00:00Z').getTime());
      
      if (hourDiff < bestHourDiff) {
        bestHourDiff = hourDiff;
        bestForecast = forecast;
      }
    }
    
    // Calculate actual min/max for the day from all forecasts
    const temps = dayForecasts.map(f => f.main.temp);
    const actualMin = Math.min(...temps);
    const actualMax = Math.max(...temps);
    
    dailyForecasts.push({
      date: dateStr,
      temp: Math.round(bestForecast.main.temp),
      tempMin: Math.round(actualMin),
      tempMax: Math.round(actualMax),
      description: bestForecast.weather[0].description,
      icon: bestForecast.weather[0].icon,
      humidity: bestForecast.main.humidity,
      windSpeed: Math.round(bestForecast.wind.speed),
      pop: Math.round(bestForecast.pop * 100),
    });
  }
  
  return dailyForecasts;
};

/**
 * Get weather icon URL from OpenWeatherMap
 */
export const getWeatherIconUrl = (icon: string, size: '2x' | '4x' = '2x'): string => {
  return `https://openweathermap.org/img/wn/${icon}@${size}.png`;
};

/**
 * Get weather emoji based on condition code
 */
export const getWeatherEmoji = (icon: string): string => {
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

/**
 * Get Meteocons icon filename based on OpenWeatherMap icon code
 */
export const getMeteoconsIcon = (icon: string): string => {
  const code = icon.slice(0, 2);
  const isNight = icon.endsWith('n');
  
  const iconMap: Record<string, string> = {
    '01': isNight ? 'clear-night' : 'clear-day',
    '02': isNight ? 'partly-cloudy-night' : 'partly-cloudy-day',
    '03': 'cloudy',
    '04': 'overcast',
    '09': 'rain',
    '10': isNight ? 'partly-cloudy-night-rain' : 'partly-cloudy-day-rain',
    '11': isNight ? 'thunderstorms-night-rain' : 'thunderstorms-day-rain',
    '13': 'snow',
    '50': isNight ? 'fog-night' : 'fog-day',
  };
  
  return iconMap[code] || 'partly-cloudy-day';
};

/**
 * Get background color based on weather condition (using design system colors)
 */
export const getWeatherBackgroundColor = (icon: string): string => {
  const isNight = icon.endsWith('n');
  
  // Use design system purple for night, blue for day
  if (isNight) {
    return '#3C0E4D'; // --purple
  }
  
  return '#0A95FF'; // --blue
};

