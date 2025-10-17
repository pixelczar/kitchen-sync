# Google Photos Integration Setup Guide

## Getting Your Google Photos API Credentials

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "KitchenSync Photos"
4. Click "Create"

### 2. Enable Google Photos Library API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Photos Library API"
3. Click on it and press "Enable"

### 3. Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Choose "Web application"
4. Add authorized redirect URIs:
   - `http://localhost:5173/google-auth-callback.html` (for development)
   - `https://yourdomain.com/google-auth-callback.html` (for production)
5. Click "Create"
6. Copy the **Client ID** (you'll need this)

### 4. Configure Your Environment

Add these variables to your `.env.local` file:

```bash
# Google Photos API (optional - not needed for OAuth)
VITE_GOOGLE_PHOTOS_API_KEY=your-api-key-here

# Google OAuth Client ID (required)
VITE_GOOGLE_PHOTOS_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

## Features

### Screensaver Integration
- **Automatic Photo Loading**: Fetches your recent Google Photos
- **Smart Filtering**: Only shows actual photos (no videos or screenshots)
- **Ken Burns Effect**: Smooth zoom and pan animations
- **Fallback Photos**: Uses beautiful sample photos if Google Photos isn't connected

### OAuth Flow
- **Secure Authentication**: Uses Google's OAuth 2.0
- **Popup Authentication**: Clean popup-based login
- **Token Storage**: Securely stores access tokens in localStorage
- **Automatic Refresh**: Handles token expiration gracefully

## Setup Steps

1. **Get your Google OAuth Client ID** (follow steps above)
2. **Add credentials to `.env.local`**
3. **Restart your dev server**: `npm run dev`
4. **Test the connection**: Go to Settings → Connect Google Photos

## Troubleshooting

### "Google Photos API credentials not configured"
- Make sure `VITE_GOOGLE_PHOTOS_CLIENT_ID` is in your `.env.local`
- Restart the dev server after adding the variable

### "Popup blocked" error
- Allow popups for your localhost domain
- Try the connection again

### "Authentication cancelled"
- User closed the popup before completing OAuth
- Try connecting again

### "Failed to fetch recent photos"
- Check that Google Photos Library API is enabled
- Verify your OAuth client is configured correctly
- Make sure the redirect URI matches exactly

### No photos showing in screensaver
- Check that you have photos in your Google Photos library
- Verify the OAuth token is valid
- Check browser console for API errors

## API Limits

Google Photos Library API has these limits:
- **100 requests per 100 seconds per user**
- **10,000 requests per day per project**
- **1,000 requests per 100 seconds per user for search**

For a family dashboard, these limits are more than sufficient!

## Security Notes

- OAuth tokens are stored in localStorage (client-side only)
- No photos are downloaded to your server
- All API calls are made directly from the browser
- Tokens can be revoked from Google Account settings

## Production Deployment

When deploying to production:

1. **Update redirect URIs** in Google Cloud Console
2. **Add your production domain** to authorized origins
3. **Update environment variables** with production values
4. **Test OAuth flow** on production domain

---

**Need help?** Check the browser console for detailed error messages!
