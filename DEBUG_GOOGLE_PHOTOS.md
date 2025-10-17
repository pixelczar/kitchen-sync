# Debug Google Photos Connection

## Step 1: Check Your Environment Variables

Open browser console and run:
```javascript
console.log('Client ID:', import.meta.env.VITE_GOOGLE_PHOTOS_CLIENT_ID);
```

Should show: `80037989963-ap60navboqm788cq1kbmbjbi9phfuq65.apps.googleusercontent.com`

## Step 2: Check OAuth Consent Screen

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "APIs & Services" → "OAuth consent screen"
3. **CRITICAL**: Scroll down to "Test users" section
4. Click "ADD USERS" 
5. Add your Google account email (the one you're signing in with)
6. Click "SAVE"

## Step 3: Enable Google Photos Library API

1. Go to "APIs & Services" → "Library"
2. Search for "Google Photos Library API"
3. Click on it and press "Enable"

## Step 4: Test the OAuth URL Manually

Open this URL in a new tab (replace with your actual client ID):
```
https://accounts.google.com/oauth/authorize?client_id=80037989963-ap60navboqm788cq1kbmbjbi9phfuq65.apps.googleusercontent.com&redirect_uri=http://localhost:5173/google-auth-callback.html&scope=https://www.googleapis.com/auth/photoslibrary.readonly&response_type=token&access_type=offline
```

If this works, you'll be redirected to the callback page with a token.

## Step 5: Check Browser Console

When you click "Connect", check the browser console for errors. Common issues:

- `CONFIGURATION_NOT_FOUND` = Client ID wrong or OAuth not configured
- `access_denied` = Not added as test user
- `invalid_client` = Client ID incorrect
- `redirect_uri_mismatch` = Redirect URI doesn't match exactly

## Step 6: Clear Everything and Try Again

```javascript
// Run this in browser console
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

## Still Not Working?

Share the exact error message from the browser console when you click "Connect".
