# Test OAuth Flow

## Step 1: Test the Callback Page
Open this URL in your browser:
```
http://localhost:5173/google-auth-callback.html
```

Should show "Connecting to Google Photos..." page.

## Step 2: Test the OAuth URL
Try this URL in a new tab (with your actual client ID):
```
https://accounts.google.com/oauth/authorize?client_id=80037989963-ap60navboqm788cq1kbmbjbi9phfuq65.apps.googleusercontent.com&redirect_uri=http://localhost:5173/google-auth-callback.html&scope=https://www.googleapis.com/auth/photoslibrary.readonly&response_type=token&access_type=offline&state=test123
```

## Step 3: Check Browser Console
When you click "Connect" in the app, check the browser console for:
- OAuth URL being generated
- Any error messages
- Popup opening/closing

## Step 4: Debug Steps
1. Make sure your dev server is running: `npm run dev`
2. Check that `.env.local` has the correct client ID
3. Restart the dev server after adding environment variables
4. Clear browser cache and try again

## Common Issues:
- **404 on callback**: Dev server not running
- **"access_denied"**: Not added as test user
- **"invalid_client"**: Wrong client ID
- **"redirect_uri_mismatch"**: Redirect URI doesn't match exactly
