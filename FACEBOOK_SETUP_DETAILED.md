# 📘 Facebook Login Setup - Detailed Instructions

## 🎯 Goal
Enable Facebook Sign-In for Muthupura.lk by linking your Facebook App to Firebase.

---

## Step 1: Create or Select a Facebook App

### Option A: Create New Facebook App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps** → **Create App**
3. Choose **Consumer** as app type
4. Fill in:
   - **App Name**: Muthupura.lk
   - **App Contact Email**: info@muthupura.lk
   - **App Purpose**: Choose "E-commerce" or "Marketplace"
5. Create the app

### Option B: Use Existing App
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Click **My Apps**
3. Select your existing app

---

## Step 2: Get App ID and App Secret

1. From your app dashboard, click **Settings** → **Basic**
2. You'll see:
   - **App ID** (copy this)
   - **App Secret** (copy this, keep it private!)
3. Keep this page open - you'll need these values

---

## Step 3: Configure App Domains

1. Still in **Settings** → **Basic**
2. Scroll down to **App Domains**
3. Add your domains:
   ```
   muthupuralk.firebaseapp.com
   ```
   (If you have a custom domain, add that too)
4. Click **Save Changes**

---

## Step 4: Add Facebook Login Product

1. From app dashboard, click **+ Add Product**
2. Search for **Facebook Login**
3. Click **Setup** button

### In the Facebook Login setup:
1. Choose **Web** as platform
2. Answer setup questions
3. Click through to **Settings**

---

## Step 5: Configure OAuth Redirect URI

1. Go to **Products** → **Facebook Login** → **Settings**
2. Under **Valid OAuth Redirect URIs**, add:
   ```
   https://muthupuralk.firebaseapp.com/__/auth/handler
   ```
3. If you have a custom domain, also add:
   ```
   https://your-custom-domain.com/__/auth/handler
   ```
4. Click **Save Changes**

---

## Step 6: Add Firebase to Facebook Console

1. Go back to **Settings** → **Basic**
2. Note down:
   - App ID
   - App Secret

---

## Step 7: Configure Firebase Console

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project **muthupuralk**
3. Go to **Authentication** → **Sign-in method**
4. Click on **Facebook**
5. Toggle **Enable** to ON
6. Paste:
   - **App ID**: (from Facebook)
   - **App Secret**: (from Facebook)
7. Click **Save**

Firebase will show you the OAuth Redirect URI:
```
https://muthupuralk.firebaseapp.com/__/auth/handler
```

This must match what you set in Facebook console.

---

## Step 8: Test the Setup

### Local Testing (if needed):
1. In Firebase Console → Authentication → Sign-in method → Facebook
2. Copy the **Redirect URI**
3. Add to Facebook Valid OAuth Redirect URIs if testing locally

### Production Testing:
1. Go to [your-site]/login.html
2. Click **Facebook** button
3. Should open Facebook login popup
4. Sign in and grant permissions
5. Should redirect to homepage

---

## ✅ Verification Checklist

- [ ] Facebook app created
- [ ] App ID copied
- [ ] App Secret copied
- [ ] App domains configured (muthupuralk.firebaseapp.com)
- [ ] Valid OAuth Redirect URI configured
- [ ] Facebook credentials pasted in Firebase Console
- [ ] Facebook Sign-In enabled in Firebase Console
- [ ] Facebook button on login.html works

---

## 🔐 Permissions

Firebase will request these permissions by default:
- `email` - To get user's email
- `public_profile` - To get name and profile picture

You can adjust permissions in Facebook Console if needed:
1. **Settings** → **Facebook Login** → **Permissions**
2. Add/remove permissions as needed

---

## 🐛 Troubleshooting

### "Invalid OAuth redirect URI"
- [ ] Check Facebook console Valid OAuth Redirect URIs
- [ ] Ensure it matches Firebase's OAuth Redirect URI exactly
- [ ] No extra spaces or characters

### "App not configured"
- [ ] Verify app is in development or live mode
- [ ] Check app is not pending review
- [ ] Verify app credentials in Firebase Console

### "Permission denied"
- [ ] User may have denied permissions
- [ ] Check app permissions settings
- [ ] User can change privacy settings on Facebook account

### "Redirect URI mismatch"
- [ ] Copy Firebase's exact OAuth Redirect URI
- [ ] Paste in Facebook Valid OAuth Redirect URIs
- [ ] Must match exactly (including protocol and slashes)

---

## 📋 Values Reference

Keep these handy for Firebase Console:

```
App ID: ________________
App Secret: ________________
Valid OAuth Redirect URI: https://muthupuralk.firebaseapp.com/__/auth/handler
```

---

## 🚀 After Setup

Once configured:
1. Users can click Facebook button on login.html
2. Firebase handles the OAuth flow
3. User data is automatically stored
4. User is logged in with JWT token

---

## 📱 Testing with Test Users

To test with specific accounts:
1. Go to **Roles** → **Test Users**
2. Create test users
3. Can use these for testing before going live

---

## 🔄 Refreshing Tokens

Tokens are valid for 7 days (JWT expiration).
Frontend automatically handles token refresh if needed.

---

**Status**: Ready for Configuration ✅  
**Time to Setup**: ~10 minutes  
**Last Updated**: April 20, 2026
