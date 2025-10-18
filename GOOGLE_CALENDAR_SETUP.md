# 📅 Google Calendar Setup Guide

This guide will help you set up Google Calendar integration for Kitchen Sync.

## 🔧 **Step 1: Google Cloud Console Setup**

1. **Go to Google Cloud Console**: [console.cloud.google.com](https://console.cloud.google.com)
2. **Select your project** (or create a new one)
3. **Enable Google Calendar API**:
   - Go to "APIs & Services" → "Library"
   - Search for "Google Calendar API"
   - Click "Enable"

## 🔑 **Step 2: Create OAuth 2.0 Credentials**

1. **Go to Credentials**: "APIs & Services" → "Credentials"
2. **Create OAuth 2.0 Client ID**:
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "Kitchen Sync Calendar"
3. **Add Authorized Redirect URIs**:
   - `http://localhost:5173/google-auth-callback.html` (development)
   - `https://yourdomain.com/google-auth-callback.html` (production)
4. **Add Authorized JavaScript Origins**:
   - `http://localhost:5173` (development)
   - `https://yourdomain.com` (production)

## 📝 **Step 3: Configure OAuth Consent Screen**

1. **Go to OAuth Consent Screen**: "APIs & Services" → "OAuth consent screen"
2. **Add Required Scopes**:
   - `https://www.googleapis.com/auth/calendar.readonly`
   - `https://www.googleapis.com/auth/calendar.events`
3. **Complete Required Fields**:
   - App name: "Kitchen Sync"
   - User support email: your email
   - Application home page: `http://localhost:5173/home.html`
   - Privacy policy link: `http://localhost:5173/privacy-policy.html`

## 🔐 **Step 4: Environment Variables**

Add to your `.env.local` file:

```bash
# Google Calendar API
VITE_GOOGLE_CALENDAR_CLIENT_ID=your_client_id_here
```

**Get your Client ID from**: Google Cloud Console → Credentials → Your OAuth 2.0 Client ID

## 🧪 **Step 5: Test the Integration**

1. **Start your dev server**: `npm run dev`
2. **Go to Settings**: Click the settings icon in your app
3. **Connect Google Calendar**: Click "Connect" next to Google Calendar
4. **Complete OAuth flow**: Authorize the app in the popup
5. **Verify connection**: You should see "Syncing ✓" status

## 🔄 **Step 6: How It Works**

Once connected, Kitchen Sync will:

- **Sync Google Calendar events** every 15 minutes
- **Display events** in your calendar views
- **Create events** in Google Calendar when you add them in the app
- **Color-code events** by family member

## 🚨 **Troubleshooting**

### **"Google Calendar API is not configured"**
- Check that `VITE_GOOGLE_CALENDAR_CLIENT_ID` is set in `.env.local`
- Restart your dev server after adding the environment variable

### **"Authentication failed"**
- Check that redirect URIs are correct in Google Cloud Console
- Ensure OAuth consent screen is configured
- Verify scopes are added to the consent screen

### **"403 Forbidden" errors**
- Make sure Google Calendar API is enabled
- Check that scopes are properly configured
- Verify your app is published or you're added as a test user

### **Events not syncing**
- Check browser console for errors
- Verify the access token is stored in localStorage
- Ensure you have events in your Google Calendar

## 🎯 **Expected Results**

After setup, you should see:
- ✅ **Google Calendar connected** in settings
- ✅ **Events syncing** every 15 minutes
- ✅ **Google Calendar events** appearing in your calendar views
- ✅ **Two-way sync** (create in app → appears in Google Calendar)

## 📚 **Additional Resources**

- [Google Calendar API Documentation](https://developers.google.com/calendar/api)
- [OAuth 2.0 Scopes](https://developers.google.com/identity/protocols/oauth2/scopes#calendar)
- [Google Cloud Console](https://console.cloud.google.com)

---

**Need help?** Check the browser console for detailed error messages and ensure all steps are completed correctly.
