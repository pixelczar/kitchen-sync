# Google OAuth Debug Guide

## Quick Debug Steps

### 1. Check Your Environment Variables
Open your browser console and run:
```javascript
console.log('Google Photos Client ID:', import.meta.env.VITE_GOOGLE_PHOTOS_CLIENT_ID);
console.log('Google Photos API Key:', import.meta.env.VITE_GOOGLE_PHOTOS_API_KEY);
```

If these show `undefined`, your `.env.local` file isn't set up correctly.

### 2. Verify OAuth Configuration in Google Cloud Console

**Step 1: Check OAuth Consent Screen**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "OAuth consent screen"
3. Make sure:
   - App is in "Testing" status
   - Your email is in "Test users" list
   - Scopes include: `https://www.googleapis.com/auth/photoslibrary.readonly`

**Step 2: Check OAuth Client Configuration**
1. Go to "APIs & Services" → "Credentials"
2. Click on your OAuth 2.0 Client ID
3. Verify:
   - **Authorized JavaScript origins**: `http://localhost:5173`
   - **Authorized redirect URIs**: `http://localhost:5173/google-auth-callback.html`

### 3. Test the OAuth URL Manually

Open this URL in a new tab (replace `YOUR_CLIENT_ID` with your actual client ID):
```
https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http://localhost:5173/google-auth-callback.html&scope=https://www.googleapis.com/auth/photoslibrary.readonly&response_type=token&access_type=offline
```

If this works, you'll be redirected to the callback page with a token.

### 4. Common Issues & Solutions

**Issue: "CONFIGURATION_NOT_FOUND"**
- Your OAuth client ID is incorrect
- The redirect URI doesn't match exactly
- The OAuth consent screen isn't configured

**Issue: "access_denied"**
- You're not added as a test user
- The OAuth consent screen is in production mode
- You denied permissions

**Issue: "invalid_client"**
- Your client ID is wrong
- The OAuth client is disabled

**Issue: "redirect_uri_mismatch"**
- The redirect URI in Google Cloud Console doesn't match
- Make sure it's exactly: `http://localhost:5173/google-auth-callback.html`

### 5. Debug the OAuth Flow

Add this to your browser console to debug:
```javascript
// Check if tokens exist
console.log('Photos Token:', localStorage.getItem('googlePhotosToken'));
console.log('Calendar Token:', localStorage.getItem('googleCalendarToken'));

// Check for errors
console.log('Photos Error:', localStorage.getItem('googlePhotosAuthError'));
console.log('Calendar Error:', localStorage.getItem('googleCalendarAuthError'));
```

### 6. Reset Everything

If you're still having issues, try this:
```javascript
// Clear all stored tokens and errors
localStorage.removeItem('googlePhotosToken');
localStorage.removeItem('googleCalendarToken');
localStorage.removeItem('googlePhotosAuthError');
localStorage.removeItem('googleCalendarAuthError');
sessionStorage.clear();

// Reload the page
window.location.reload();
```

## Still Not Working?

1. **Double-check your `.env.local` file** - make sure it's in the project root
2. **Restart your dev server** after adding environment variables
3. **Check the browser console** for any JavaScript errors
4. **Try incognito mode** to rule out browser cache issues
5. **Verify your Google account** has access to Google Photos

## Need Help?

If you're still stuck, share:
1. The exact error message from the browser console
2. Your OAuth client configuration (without the actual client ID)
3. Whether the manual OAuth URL test works
