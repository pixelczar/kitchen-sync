# Debug Google Photos OAuth Issue

## Problem
Getting "Request had insufficient authentication scopes" error when trying to access Google Photos API.

## Debug Steps

### 1. Use the Debug Button
1. Go to Settings in your app
2. Click the "Debug OAuth" button (yellow button)
3. Check the browser console for detailed OAuth state information

### 2. Check OAuth Consent Screen Configuration

The most likely issue is that your Google Cloud Console OAuth consent screen doesn't have the Google Photos scope enabled.

#### Steps to fix:

1. **Go to Google Cloud Console**: https://console.cloud.google.com/
2. **Select your project** (the one with your OAuth credentials)
3. **Navigate to APIs & Services > OAuth consent screen**
4. **Click "Edit App"**
5. **Go to "Scopes" tab**
6. **Click "Add or Remove Scopes"**
7. **Search for and add these scopes:**
   - `https://www.googleapis.com/auth/photoslibrary.readonly`
   - `https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata`
8. **Save the changes**
9. **Publish the consent screen** (if it's in testing mode, you may need to add test users)

### 3. Verify OAuth Client Configuration

1. **Go to APIs & Services > Credentials**
2. **Click on your OAuth 2.0 Client ID**
3. **Check "Authorized redirect URIs" includes:**
   - `http://localhost:5173/google-auth-callback.html` (for development)
   - `https://yourdomain.com/google-auth-callback.html` (for production)

### 4. Clear and Re-authenticate

If the scopes were missing, you need to clear the old token and re-authenticate:

1. **Disconnect Google Photos** in the app settings
2. **Clear browser data** (or just localStorage):
   ```javascript
   localStorage.removeItem('googlePhotosToken');
   ```
3. **Re-connect Google Photos** in the app

### 5. Test the Fix

After making the OAuth consent screen changes:

1. **Wait 5-10 minutes** for changes to propagate
2. **Clear your browser cache and localStorage**
3. **Try connecting to Google Photos again**
4. **Use the Debug button** to verify the token has the right scopes

## Expected Debug Output

When working correctly, the debug output should show:

```
OAuth State: {
  hasToken: true,
  tokenLength: 100+,
  hasState: false,
  hasClientId: false,
  envClientId: true
}

Token Info: {
  valid: true,
  scopes: ["https://www.googleapis.com/auth/photoslibrary.readonly"],
  expiresAt: 1234567890
}

API Test: {
  success: true,
  data: {
    albumsCount: 5,
    albums: [...]
  }
}
```

## Common Issues

1. **Missing scopes in OAuth consent screen** - Most common issue
2. **Token expired** - Re-authenticate
3. **Wrong redirect URI** - Check OAuth client configuration
4. **App not published** - Add test users or publish the app

## Next Steps

If the debug shows the token is valid but API calls still fail, the issue is likely in the OAuth consent screen configuration.
