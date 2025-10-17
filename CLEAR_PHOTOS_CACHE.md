# 🔄 Clear Photos Cache

## To see your new "Kitchen Sync" album photos:

### **Option 1: Clear Browser Storage (Recommended)**
1. **Open Chrome DevTools** (F12)
2. **Go to Application tab**
3. **Click "Storage" in the left sidebar**
4. **Click "Clear storage"**
5. **Click "Clear site data"**
6. **Refresh the page**

### **Option 2: Manual Clear**
1. **Open Chrome DevTools** (F12)
2. **Go to Application tab**
3. **Click "Local Storage" → "http://localhost:5173"**
4. **Delete the `googlePhotosToken` entry**
5. **Refresh the page**

### **Option 3: Hard Refresh**
1. **Press Ctrl+Shift+R** (or Cmd+Shift+R on Mac)
2. **This forces a complete reload**

## After clearing the cache:

1. **Go to Settings**
2. **Click "Connect to Google Photos"** again
3. **The app will now look for your "Kitchen Sync" album**
4. **Your album photos should appear!**

## 🎯 **What Should Happen:**

- **Dashboard**: Shows a photo from your "Kitchen Sync" album
- **Screensaver**: Cycles through all photos in your "Kitchen Sync" album
- **Fallback**: If no album found, uses recent photos

Try clearing the cache and reconnecting to Google Photos! 🎉
