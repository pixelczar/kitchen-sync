# 🔧 Google Photos Picker Scope Fix

## The Problem
You're getting "Request had insufficient authentication scopes" (403 error) because the Google Photos Picker API requires a specific scope that's not configured in your OAuth consent screen.

## 🚨 **Critical Steps to Fix**

### **Step 1: Update OAuth Consent Screen**
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **OAuth consent screen**
3. Click **"EDIT APP"** (or "Add or remove scopes")
4. Click **"ADD OR REMOVE SCOPES"**

### **Step 2: Add the Required Scope**
Search for and add this EXACT scope:
- ✅ `https://www.googleapis.com/auth/photospicker.mediaitems.readonly`

### **Step 3: Verify All Required Scopes**
Your OAuth consent screen should now have ALL of these scopes:
- ✅ `https://www.googleapis.com/auth/photoslibrary.readonly`
- ✅ `https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata`
- ✅ `https://www.googleapis.com/auth/photospicker.mediaitems.readonly` ← **NEW**

### **Step 4: Save and Wait**
1. Click **"UPDATE"**
2. Click **"SAVE"**
3. **Wait 5-10 minutes** for changes to propagate

### **Step 5: Clear and Re-authenticate**
1. **Clear browser storage** (DevTools → Application → Storage → Clear storage)
2. **Go to Settings** → Click "Disconnect Google Photos"
3. **Click "Connect to Google Photos"** again
4. **Complete OAuth flow** with the new scopes
5. **Try selecting photos** - should work now!

## 🎯 **What Should Happen**

After adding the scope:
- ✅ **No more 403 "insufficient authentication scopes" errors**
- ✅ **Google Photos Picker API works**
- ✅ **Can create picker sessions**
- ✅ **Can select photos**

## 🚨 **If Still Getting 403 Errors**

### **Check These Things:**

1. **Scope is added** - Make sure `photospicker.mediaitems.readonly` is in your consent screen
2. **App is published** - If in "Testing" mode, make sure your email is in "Test users"
3. **Wait a few minutes** - Changes can take time to propagate
4. **Clear all storage** - Make sure you're using a fresh token
5. **Re-authenticate** - You MUST disconnect and reconnect to get the new scopes

### **Debug Commands:**
- In console, type: `debugGooglePhotos()` to test your token
- In console, type: `resetGooglePhotos()` to clear everything

## 📝 **Your OAuth Consent Screen Should Look Like:**

**Scopes:**
- `https://www.googleapis.com/auth/photoslibrary.readonly` ✅
- `https://www.googleapis.com/auth/photoslibrary.readonly.appcreateddata` ✅
- `https://www.googleapis.com/auth/photospicker.mediaitems.readonly` ✅ ← **NEW**

**Test Users (if in Testing mode):**
- Your Google account email ✅
