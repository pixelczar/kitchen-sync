# 🔍 Debug Token Issue - Step by Step

## The Problem
Even though the scope is properly configured in Google Cloud Console, you're still getting 403 "insufficient authentication scopes" errors.

## 🚨 **Debug Steps**

### **Step 1: Clear Everything and Start Fresh**
1. **Open DevTools** (F12)
2. **Application tab** → **Storage** → **Clear storage**
3. **Click "Clear site data"**
4. **Refresh the page**

### **Step 2: Test the Debug Function**
1. **In the console, type**: `debugGooglePhotos()`
2. **Look for the output** - it will show exactly what's wrong

### **Step 3: Check Your Token**
The debug function will show:
- ✅ **Token found**: Should show your token (first 20 characters)
- ✅ **Albums API**: Should return 200 OK
- ✅ **Search API**: Should return 200 OK
- ✅ **Kitchen Sync album**: Should be found

### **Step 4: If Still Getting 403 Errors**

#### **Option A: Check OAuth Consent Screen**
1. **Google Cloud Console** → **APIs & Services** → **OAuth consent screen**
2. **Make sure**:
   - ✅ **User Type**: External
   - ✅ **Publishing Status**: Testing (or Published)
   - ✅ **Scopes**: `https://www.googleapis.com/auth/photoslibrary.readonly`
   - ✅ **Test Users**: Your email (if in Testing mode)

#### **Option B: Check Your OAuth Client**
1. **APIs & Services** → **Credentials**
2. **Find your OAuth 2.0 Client ID**
3. **Make sure**:
   - ✅ **Application type**: Web application
   - ✅ **Authorized JavaScript origins**: `http://localhost:5173`
   - ✅ **Authorized redirect URIs**: `http://localhost:5173/google-auth-callback.html`

#### **Option C: Try a Different Approach**
If the above doesn't work, try:
1. **Delete your current OAuth client**
2. **Create a new one** with the same settings
3. **Update your .env.local** with the new Client ID
4. **Test again**

### **Step 5: Check the Token Details**
The debug function will show you:
- **Token format**: Should be a long string
- **API responses**: Should be 200 OK, not 403
- **Error details**: Will show exactly what's failing

## 🎯 **Most Likely Issues**

1. **Old token cached** - Clear storage and reconnect
2. **OAuth consent screen not published** - Make sure it's in Testing or Published mode
3. **Wrong OAuth client** - Make sure you're using the right Client ID
4. **Token expired** - Get a fresh token

## 🚀 **Quick Fix**

Try this sequence:
1. **Clear storage** (DevTools → Application → Storage → Clear storage)
2. **Run debug**: `debugGooglePhotos()` in console
3. **If still 403**: `resetGooglePhotos()` then reconnect
4. **Check OAuth consent screen** is published and has the scope

**The debug function will tell us exactly what's wrong!** 🔍
