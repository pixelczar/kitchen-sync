# 🚨 Final Google OAuth Debug Guide

## The Core Problem
Your OAuth URLs are returning 404 errors, which means there's a fundamental issue with your Google Cloud Console configuration that we need to fix.

## 🔍 Step-by-Step Debug Process

### 1. **Verify Your Google Cloud Project**
Go to [Google Cloud Console](https://console.cloud.google.com/) and check:

- **Project Name**: Should be "kitchen-sync" or similar
- **Project ID**: Should match your Firebase project
- **Billing**: Must be enabled (required for OAuth)

### 2. **Check OAuth Consent Screen**
Go to **APIs & Services** → **OAuth consent screen**:

- **User Type**: External
- **Publishing status**: Testing (or Published)
- **App name**: Any name (e.g., "Kitchen Sync")
- **User support email**: Your email
- **Developer contact**: Your email
- **Scopes**: Must include `https://www.googleapis.com/auth/photoslibrary.readonly`
- **Test users**: Add your Google account email

### 3. **Verify OAuth Client Configuration**
Go to **APIs & Services** → **Credentials**:

- **Application type**: Web application
- **Name**: Any name
- **Authorized JavaScript origins**: `http://localhost:5173`
- **Authorized redirect URIs**: `http://localhost:5173/google-auth-callback.html`

### 4. **Check APIs Are Enabled**
Go to **APIs & Services** → **Library**:

- ✅ **Google Photos Library API** (enabled)
- ✅ **Google+ API** (enabled)

### 5. **Test Your OAuth Client**
After making changes, test with:

```bash
curl -I "https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fgoogle-auth-callback.html&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fphotoslibrary.readonly&response_type=token&access_type=offline&state=test123"
```

Should return **200 OK** instead of **404**.

## 🚨 If Still Getting 404

### Option 1: Create Completely New Project
1. **Google Cloud Console** → **New Project**
2. **Name**: "Kitchen Sync Photos"
3. **Enable billing**
4. **Enable Google Photos Library API**
5. **Create OAuth 2.0 Client ID**
6. **Configure OAuth consent screen**
7. **Update .env.local** with new credentials

### Option 2: Check Your Google Account
- Make sure you're using the same Google account for:
  - Google Cloud Console
  - OAuth consent screen
  - Test users
- Try logging out and back in

### Option 3: Regional Issues
- Try using a VPN if you're in a restricted region
- Check if Google services are accessible in your location

## 🎯 Most Likely Issues

1. **Billing not enabled** (most common)
2. **OAuth consent screen not configured**
3. **Wrong project selected**
4. **Regional restrictions**

## 🧪 Test After Each Step

After making any changes, test immediately:

```bash
curl -I "https://accounts.google.com/oauth/authorize?client_id=YOUR_CLIENT_ID&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fgoogle-auth-callback.html&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fphotoslibrary.readonly&response_type=token&access_type=offline&state=test123"
```

**This MUST return 200 OK for OAuth to work!**
