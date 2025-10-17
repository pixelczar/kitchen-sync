# 🔧 Fix OAuth Scopes - Step by Step

## The Problem
You're getting "Request had insufficient authentication scopes" because your OAuth consent screen doesn't have the Google Photos scope configured.

## 🚨 **Critical Steps to Fix**

### **Step 1: Go to OAuth Consent Screen**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **OAuth consent screen**
3. Click **"EDIT APP"** (or "Add or remove scopes")

### **Step 2: Add the Required Scope**
1. Click **"ADD OR REMOVE SCOPES"**
2. **Search for**: `photoslibrary`
3. **Find and check**: `https://www.googleapis.com/auth/photoslibrary.readonly`
4. Click **"UPDATE"**
5. Click **"SAVE"**

### **Step 3: Verify Your Scopes**
Your OAuth consent screen should show:
- ✅ `https://www.googleapis.com/auth/photoslibrary.readonly`
- ✅ Any other scopes you need

### **Step 4: Test the Fix**
1. **Clear browser storage** (DevTools → Application → Storage → Clear storage)
2. **Go to Settings** → Click "Connect to Google Photos"
3. **Complete OAuth flow**
4. **Check console** - should see no more 403 errors

## 🎯 **What Should Happen**

After adding the scope:
- ✅ **No more 403 errors**
- ✅ **Can access Google Photos API**
- ✅ **Can find "Kitchen Sync" album**
- ✅ **Can fetch photos**

## 🚨 **If Still Getting 403 Errors**

### **Check These Things:**

1. **Scope is added** - Make sure `photoslibrary.readonly` is in your consent screen
2. **App is published** - If in "Testing" mode, make sure your email is in "Test users"
3. **Wait a few minutes** - Changes can take time to propagate
4. **Clear all storage** - Make sure you're using a fresh token

### **Debug Commands:**
- In console, type: `debugGooglePhotos()` to test your token
- In console, type: `resetGooglePhotos()` to clear everything

## 📝 **Your OAuth Consent Screen Should Look Like:**

**Scopes:**
- `https://www.googleapis.com/auth/photoslibrary.readonly` ✅

**Test Users (if in Testing mode):**
- Your Google account email ✅

**Publishing Status:**
- Testing or Published ✅

**The scope is the key missing piece!** 🎯
