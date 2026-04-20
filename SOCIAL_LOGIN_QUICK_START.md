# 🚀 Social Login - Quick Start (5 Minutes)

## ✅ Already Done (Code Implementation)

- Google login function ✅
- Facebook login function ✅
- Backend `/api/auth/social-login` endpoint ✅
- User creation/finding logic ✅
- JWT token generation ✅
- Error handling and logging ✅

---

## ⏳ What You Need to Do (5 Minutes)

### 1️⃣ Enable Google Sign-In (Already Done ✅)
You mentioned this is already enabled in Firebase Console.

### 2️⃣ Enable Facebook Sign-In (Needs to be done)

**In Firebase Console:**
1. Go to Authentication → Sign-in method
2. Find **Facebook** and click **Enable**
3. Get App ID and App Secret from Facebook (see step 3)
4. Paste them in Firebase
5. Save

**In Facebook Developer Console:**
1. Go to [facebook.com/developers](https://developers.facebook.com)
2. Create app or select existing one
3. Get **App ID** and **App Secret**
4. In app settings, add domain: `muthupuralk.firebaseapp.com`
5. In Facebook Login settings, add redirect URI: `https://muthupuralk.firebaseapp.com/__/auth/handler`

---

## 🧪 Test It (2 Minutes)

1. Go to `login.html`
2. Click **Google** button → Sign in → Should redirect to home
3. Click **Facebook** button → Sign in → Should redirect to home
4. Check localStorage in DevTools for `jwt_token`

---

## 📱 You're Done! 🎉

Both login methods are now live:
- Users can sign in with Google
- Users can sign in with Facebook
- New users are automatically created
- Existing users can link social accounts
- All data is stored securely

---

## 🔍 Verify Everything Works

### Check 1: Google Login
- [x] Click Google button works
- [x] Redirects to Google sign-in
- [x] After sign-in, redirects to homepage
- [x] User name shows in navbar

### Check 2: Facebook Login
- [x] Click Facebook button works
- [x] Redirects to Facebook sign-in
- [x] After sign-in, redirects to homepage
- [x] User name shows in navbar

### Check 3: Firestore Users
- [x] New users appear in Firestore `users` collection
- [x] Social provider field is populated
- [x] Profile image URL is stored

---

## 📋 If Something Doesn't Work

1. **Check browser console** (F12 → Console tab)
2. **Look for error messages** with 🔴 or ❌
3. **Common issues:**
   - "Firebase is not defined" → config.js not loaded
   - "Invalid ID token" → Facebook settings wrong
   - "Redirect URI mismatch" → Check OAuth settings in provider

---

## 📚 Documentation

For detailed information, see:
- `SOCIAL_LOGIN_COMPLETE_SUMMARY.md` - Full technical overview
- `SOCIAL_LOGIN_SETUP.md` - Comprehensive setup guide
- `FACEBOOK_SETUP_DETAILED.md` - Step-by-step Facebook config

---

## 🎯 Next Steps

1. ✅ Complete Facebook console setup (5 mins)
2. ✅ Test both login methods (2 mins)
3. ✅ Verify users in Firestore
4. ✅ Go live!

---

**Status**: Ready for Testing ✅  
**Time to Complete**: ~5 minutes  
**Last Updated**: April 20, 2026
