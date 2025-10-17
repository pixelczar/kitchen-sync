# 🔧 Google Cloud Console Setup

Now that we've created the privacy policy and home page, here's how to complete your Google Cloud Console setup:

## 📄 **Files Created:**

1. **Privacy Policy**: `/public/privacy-policy.html`
2. **Home Page**: `/public/home.html`

## 🌐 **URLs to Use in Google Cloud Console:**

### **For Local Development:**
- **Application home page**: `http://localhost:5173/home.html`
- **Privacy policy link**: `http://localhost:5173/privacy-policy.html`

### **For Production (when you deploy):**
- **Application home page**: `https://your-domain.com/home.html`
- **Privacy policy link**: `https://your-domain.com/privacy-policy.html`

## 🔧 **Steps to Complete in Google Cloud Console:**

1. **Go to OAuth consent screen** → **Branding**
2. **Fill in the required fields:**
   - ✅ **App name**: Kitchen Sync (already filled)
   - ✅ **User support email**: willisvt@gmail.com (already filled)
   - ✅ **Application home page**: `http://localhost:5173/home.html`
   - ✅ **Application privacy policy link**: `http://localhost:5173/privacy-policy.html`
   - ✅ **Developer contact information**: willisvt@gmail.com (already filled)

3. **Click "Save"**

## 🚀 **Next Steps:**

1. **Save the branding information** in Google Cloud Console
2. **Start the verification process** (click "Go to verification center")
3. **Test your OAuth flow** again

## 🧪 **Test Your Setup:**

1. **Start your dev server**: `npm run dev`
2. **Visit**: `http://localhost:5173/home.html` (should show your home page)
3. **Visit**: `http://localhost:5173/privacy-policy.html` (should show privacy policy)
4. **Test OAuth**: Try connecting to Google Photos again

## 📝 **What This Fixes:**

- ✅ **Application home page** error will be resolved
- ✅ **Privacy policy link** requirement will be met
- ✅ **Verification process** can begin
- ✅ **100-user cap** should be removed after verification

## 🎯 **Expected Results:**

After completing these steps:
1. **No more "Application home page must not be empty" error**
2. **Privacy policy link** will be accessible
3. **Verification process** can be started
4. **OAuth flow** should work without 403 errors (after verification)

## 🚨 **Important Notes:**

- **For production**, you'll need to update these URLs to your actual domain
- **Verification process** can take several days to weeks
- **In the meantime**, you can still test with the 100-user cap limit

The privacy policy and home page are now ready to use in your Google Cloud Console setup! 🎉
