# Quick Google Photos Setup

## ✅ You Only Need OAuth 2.0 Client ID (No API Key Required!)

### Step 1: Get Your Client ID
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your "kitchen-sync" project
3. Go to "APIs & Services" → "Credentials"
4. Click on your "KS Web client 1" OAuth 2.0 Client ID
5. Copy the **Client ID** (looks like: `123456789-abcdefg.apps.googleusercontent.com`)

### Step 2: Add to Your Environment
Create/update your `.env.local` file in the project root:
```bash
VITE_GOOGLE_PHOTOS_CLIENT_ID=your-client-id-here.apps.googleusercontent.com
```

### Step 3: Configure OAuth Settings
In your OAuth client settings, make sure you have:

**Authorized JavaScript origins:**
- `http://localhost:5173`

**Authorized redirect URIs:**
- `http://localhost:5173/google-auth-callback.html`

### Step 4: Add Yourself as Test User
1. Go to "APIs & Services" → "OAuth consent screen"
2. Scroll down to "Test users"
3. Click "ADD USERS"
4. Add your Google account email
5. Click "SAVE"

### Step 5: Restart and Test
```bash
npm run dev
```

Now try connecting to Google Photos - it should open a popup window! 🎉

## Troubleshooting

**"Popup blocked" error?**
- Allow popups for localhost:5173
- Try again

**"Something went wrong" error?**
- Make sure you're added as a test user
- Check that your redirect URI matches exactly

**Still not working?**
- Check browser console for errors
- Verify your Client ID is correct in `.env.local`
- Make sure you restarted the dev server after adding the environment variable
