# Weather Feature Setup Guide

## Getting Your OpenWeatherMap API Key

1. Go to [OpenWeatherMap](https://openweathermap.org/api)
2. Click "Sign Up" or "Sign In"
3. Navigate to "API keys" section
4. Copy your API key
5. Add it to your `.env.local` file:

```bash
VITE_OPENWEATHER_API_KEY=your-api-key-here
```

## Free Tier Limits

The free tier includes:
- Current weather data
- 5-day / 3-hour forecast
- 60 calls/minute
- 1,000,000 calls/month

Perfect for a family dashboard!

## Browser Permissions

The weather feature uses the browser's Geolocation API. Users will see a permission prompt the first time they load the app. Make sure to allow location access.

## Features

### Weather Widget (Header)
- Displays current temperature and location
- Shows weather emoji based on conditions
- Clickable to open full forecast

### Weather Modal (Fullscreen)
- Beautiful gradient background based on weather conditions
- Current weather with detailed stats (feels like, humidity, high/low, sunrise)
- 5-day forecast with daily predictions
- Wind speed and precipitation probability
- Awesome shared-element transition animation using Framer Motion's layoutId

### Weather Gradients
- Clear sky: Blue to yellow gradient
- Cloudy: Gray gradients
- Rain: Blue and gray tones
- Thunderstorm: Dark purple and gray
- Snow: White and light blue
- Night time: Deep purple and pink gradients

## Troubleshooting

### "Loading..." stuck?
- Check browser console for errors
- Verify API key is correct
- Ensure you allowed location permissions
- Check if you exceeded API rate limits

### No location permission?
- Check browser settings for location access
- Try a different browser
- Clear site data and refresh

### API Key Issues?
- Make sure key is in `.env.local` (not `.env.example`)
- Restart dev server after adding key
- Verify key is active on OpenWeatherMap dashboard

