# 🔧 Complete Google OAuth Debug Guide

## The Problem
You're getting a **404 error** when trying to access Google's OAuth endpoint. This means your **Google Cloud Console** configuration is incorrect.

## 🚨 Critical Steps to Fix

### 1. **Verify Your OAuth Client ID**
Your current Client ID: `80037989963-ap60navboqm788cq1kbmbjbi9phfuq65.apps.googleusercontent.com`

**Check this in Google Cloud Console:**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Go to **APIs & Services** → **Credentials**
4. Find your OAuth 2.0 Client ID
5. **Copy the EXACT Client ID** from there

### 2. **Check OAuth Client Type**
Make sure your OAuth client is configured as:
- **Application type**: `Web application` (NOT Desktop or Other)
- **Authorized redirect URIs**: `http://localhost:5173/google-auth-callback.html`
- **Authorized JavaScript origins**: `http://localhost:5173`

### 3. **Verify APIs Are Enabled**
Go to **APIs & Services** → **Library** and ensure these are enabled:
- ✅ **Google Photos Library API**
- ✅ **Google+ API** (sometimes needed)

### 4. **Check OAuth Consent Screen**
Go to **APIs & Services** → **OAuth consent screen**:
- **User Type**: External (unless you have a Google Workspace)
- **App status**: Testing or Published
- **Scopes**: Add `https://www.googleapis.com/auth/photoslibrary.readonly`
- **Test users**: Add your Google account email if in Testing mode

### 5. **Common Issues**

#### Issue A: Wrong Client ID
- The Client ID in your `.env.local` doesn't match Google Cloud Console
- **Fix**: Copy the exact Client ID from Google Cloud Console

#### Issue B: Wrong Application Type
- OAuth client is configured as "Desktop" instead of "Web application"
- **Fix**: Delete and recreate the OAuth client as "Web application"

#### Issue C: Missing Redirect URI
- `http://localhost:5173/google-auth-callback.html` is not in Authorized redirect URIs
- **Fix**: Add it exactly as shown above

#### Issue D: API Not Enabled
- Google Photos Library API is not enabled
- **Fix**: Enable it in APIs & Services → Library

#### Issue E: Consent Screen Issues
- OAuth consent screen is not configured
- **Fix**: Configure it with proper scopes and test users

## 🧪 Test Your Configuration

### Step 1: Verify Client ID
```bash
# Replace YOUR_CLIENT_ID with the exact one from Google Cloud Console
curl -I "https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http%3A//localhost%3A5173/google-auth-callback.html&scope=https%3A//www.googleapis.com/auth/photoslibrary.readonly&response_type=token&access_type=offline&state=test123"
```

### Step 2: Test in Browser
1. Go to `http://localhost:5173/test-oauth-simple.html`
2. Click "Test OAuth URL"
3. Should show "✅ OAuth URL is accessible!" instead of 404

## 🔄 If Still Not Working

### Option 1: Create New OAuth Client
1. Go to Google Cloud Console → APIs & Services → Credentials
2. **Delete** your existing OAuth 2.0 Client ID
3. **Create** a new one:
   - Application type: **Web application**
   - Name: "Kitchen Sync OAuth"
   - Authorized redirect URIs: `http://localhost:5173/google-auth-callback.html`
   - Authorized JavaScript origins: `http://localhost:5173`
4. **Copy the new Client ID** to your `.env.local`

### Option 2: Create New Google Cloud Project
If the above doesn't work, create a completely new project:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"New Project"**
3. Name it "Kitchen Sync"
4. Enable **Google Photos Library API**
5. Create **OAuth 2.0 Client ID** (Web application)
6. Configure **OAuth consent screen**
7. Update your `.env.local` with the new Client ID

## 📝 Your .env.local Should Look Like This

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef

# Google Photos OAuth (NO API KEY NEEDED)
VITE_GOOGLE_PHOTOS_CLIENT_ID=your_exact_client_id_from_google_cloud_console

# Weather API
VITE_OPENWEATHER_API_KEY=your_openweather_api_key
```

## 🎯 Most Likely Issue

Based on the 404 error, the most likely issue is that your **Client ID in `.env.local` doesn't match the one in Google Cloud Console**.

**Double-check this first!** 🎯
