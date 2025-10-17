# 🚨 OAuth Consent Screen Debug Guide

The 403 "insufficient authentication scopes" error is persisting even after adding scopes. Let's debug the OAuth consent screen configuration.

## 🔍 **Step 1: Verify OAuth Consent Screen Status**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **APIs & Services** → **OAuth consent screen**
3. Check the **Publishing status** at the top:
   - ✅ **Published** = Good
   - ❌ **Testing** = Problem (needs to be published)

## 🔍 **Step 2: Check User Type**

1. In OAuth consent screen, look for **User type**:
   - ✅ **External** = Good (anyone can use)
   - ❌ **Internal** = Problem (only your organization)

## 🔍 **Step 3: Verify Scopes Are Actually Added**

1. In OAuth consent screen, scroll to **Scopes**
2. Click **Add or Remove Scopes**
3. Search for "photoslibrary"
4. Make sure BOTH are checked:
   - ✅ `https://www.googleapis.com/auth/photoslibrary.readonly`
   - ✅ `https://www.googleapis.com/auth/photoslibrary`

## 🔍 **Step 4: Check Test Users (if in Testing mode)**

1. If status is "Testing", scroll to **Test users**
2. Make sure your Google account email is added
3. Click **Add users** if not present

## 🔍 **Step 5: Verify OAuth Client Configuration**

1. Go to **APIs & Services** → **Credentials**
2. Click on your OAuth 2.0 Client ID
3. Verify:
   - ✅ **Application type**: Web application
   - ✅ **Authorized redirect URIs**: `http://localhost:5173/google-auth-callback.html`
   - ✅ **Authorized JavaScript origins**: `http://localhost:5173`

## 🔍 **Step 6: Check API Enablement**

1. Go to **APIs & Services** → **Library**
2. Search for "Photos Library API"
3. Make sure it's **ENABLED**
4. Also check "Google+ API" is enabled

## 🧪 **Step 7: Test with Direct OAuth**

1. Open: `http://localhost:5173/test-direct-oauth.html`
2. Click **Test OAuth Flow**
3. Complete the OAuth flow
4. Check the results in the page

## 🚨 **Common Issues:**

### **Issue 1: Consent Screen Not Published**
- **Symptom**: 403 errors even with correct scopes
- **Fix**: Publish the OAuth consent screen

### **Issue 2: Wrong User Type**
- **Symptom**: 403 errors for external users
- **Fix**: Change to "External" user type

### **Issue 3: Scopes Not Actually Added**
- **Symptom**: 403 errors persist
- **Fix**: Re-add scopes and wait for propagation

### **Issue 4: API Not Enabled**
- **Symptom**: 403 errors
- **Fix**: Enable Photos Library API

## 🔄 **Reset Everything:**

If nothing works, try this nuclear option:

1. **Delete the OAuth client**:
   - Go to Credentials
   - Delete your OAuth 2.0 Client ID
   - Create a new one

2. **Reset OAuth consent screen**:
   - Go to OAuth consent screen
   - Click "Reset" (if available)
   - Reconfigure from scratch

3. **Wait 10 minutes** for changes to propagate

## 🧪 **Test Commands:**

```bash
# Test OAuth URL directly
curl -I "https://accounts.google.com/o/oauth2/v2/auth?client_id=80037989963-unq5ouh5o8smr8pb9j4s7uifg5foj7vf.apps.googleusercontent.com&redirect_uri=http%3A%2F%2Flocalhost%3A5173%2Fgoogle-auth-callback.html&scope=https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fphotoslibrary.readonly&response_type=code&access_type=offline&state=test123"

# Should return 302 (redirect) not 404
```

## 🎯 **Expected Results:**

- OAuth URL should return **302 redirect** (not 404)
- Token exchange should return **200 OK**
- API calls should return **200 OK** (not 403)

## 🚀 **Next Steps:**

1. **Check OAuth consent screen status** (most likely issue)
2. **Test with direct OAuth page**
3. **If still failing, try nuclear reset**

The 403 errors suggest the OAuth consent screen is either not published or has incorrect configuration.
