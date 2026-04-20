# 🚀 Social Login Setup - Quick Checklist

## ✅ What's Already Done (Code)

- [x] Frontend: Added Firebase Auth initialization
- [x] Frontend: Implemented Google login function
- [x] Frontend: Implemented Facebook login function
- [x] Backend: Added `/api/auth/social-login` endpoint
- [x] Backend: Integrated Firebase ID token verification
- [x] Backend: User creation/finding logic
- [x] Backend: JWT token generation for social users

## 📋 What You Need to Do (Firebase Console)

### Step 1: Enable Google Sign-In
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Go to **Project Settings** → Select your project
3. Navigate to **Authentication** → **Sign-in method**
4. Find **Google** → Click **Enable**
5. Add support email (required)
6. Click **Save**

**Status**: ✅ You mentioned this is already done

### Step 2: Enable Facebook Sign-In
1. In Firebase Console → **Authentication** → **Sign-in method**
2. Find **Facebook** → Click **Enable**
3. Go to [Facebook Developers](https://developers.facebook.com/)
4. Create/Select your app
5. Get your **App ID** and **App Secret**
6. Return to Firebase and paste these credentials
7. Click **Save**

**Status**: ⏳ Need to complete

### Step 3: Configure Redirect URIs

**In Google Cloud Console:**
- APIs & Services → Credentials
- Edit the Web OAuth client
- Add authorized redirect URIs:
  - `https://muthupuralk.firebaseapp.com/__/auth/handler`

**In Facebook App:**
- Settings → Basic (add App Domains)
- Settings → Facebook Login → Valid OAuth Redirect URIs

---

## 🧪 Testing (After Setup)

1. **Go to**: `https://your-domain/login.html` (or local dev)
2. **Click**: Google or Facebook button
3. **Sign in** with test account
4. **Should redirect** to home page with user logged in
5. **Check console**: Look for ✅ success messages

---

## 🔍 How to Verify It's Working

### Check Console Logs:
```
✅ Google sign-in successful: { user: 'your.email@gmail.com' }
✅ ID token obtained from Firebase
✅ Backend authentication successful
✅ Auth data stored successfully
```

### Check LocalStorage:
Open browser DevTools → Application → LocalStorage:
- `jwt_token` - Should contain a token
- `user_name` - Should contain your display name
- `user_role` - Should be "user"

---

## 🐛 If Something Goes Wrong

### "Google login not working"
- [ ] Verify Google is enabled in Firebase Console
- [ ] Check console for errors (F12 → Console tab)
- [ ] Confirm authorized redirect URIs are correct

### "Facebook login not working"
- [ ] Verify Facebook is enabled in Firebase Console
- [ ] Check App ID and App Secret are correct
- [ ] Ensure app domains are configured
- [ ] Check Facebook app is in development or live mode

### "Backend error: Invalid ID token"
- [ ] Check backend is running
- [ ] Verify API_BASE_URL in config.js is correct
- [ ] Check Cloud Functions are deployed

### "User not being created"
- [ ] Check Firestore `users` collection
- [ ] Verify Firebase Admin SDK is initialized
- [ ] Check backend logs in Cloud Functions

---

## 📞 Testing with Real Accounts

You can test with:
- **Google**: Any real Google account (Gmail, Google account, etc.)
- **Facebook**: Your Facebook test account or any real account

The system will:
1. Create user if first-time login
2. Log in existing user if returning
3. Store profile image (if available)
4. Update display name automatically

---

## 🎯 Next Steps

1. **Enable Facebook in Firebase** (only remaining manual step)
2. **Test both login flows**
3. **Verify user creation** in Firestore
4. **Check localStorage** for tokens
5. **Monitor backend logs** for any issues

---

## 📱 Features Included

✅ Google OAuth 2.0 Sign-In  
✅ Facebook Login  
✅ Automatic user creation  
✅ Profile image storage  
✅ JWT session tokens  
✅ Error handling  
✅ Loading states  
✅ Success notifications  

---

**Last Updated**: April 20, 2026  
**Status**: Ready for Testing ✅
