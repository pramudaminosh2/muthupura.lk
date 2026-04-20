# Social Login Setup Guide (Google & Facebook)

## ✅ Completed Implementation

Your social login system for Google and Facebook has been set up! Here's what was done:

### Frontend Changes
- **File**: `Frontend/login.html`
- Added Firebase Auth initialization
- Implemented `loginWithGoogle()` function with Firebase Google provider
- Implemented `loginWithFacebook()` function with Firebase Facebook provider
- Both functions handle the complete OAuth flow and JWT token exchange

### Backend Changes
- **File**: `functions/routes/auth.js`
- Added new endpoint: `POST /api/auth/social-login`
- Verifies Firebase ID tokens
- Creates or finds users in Firestore
- Exchanges Firebase tokens for JWT tokens
- Stores social provider information for future reference

---

## 🔧 Firebase Console Configuration

### 1. **Google Sign-In Setup**

#### In Firebase Console:
1. Go to **Authentication** → **Sign-in method** → **Google**
2. Click **Enable**
3. Enter your **Support email** (required)
4. Project name should be auto-filled
5. Click **Save**

#### In Google Cloud Console:
1. Go to **APIs & Services** → **Credentials**
2. Create a new **OAuth 2.0 Client ID**
3. Select **Web application**
4. Add authorized redirect URIs:
   - `https://muthupuralk.firebaseapp.com/__/auth/handler`
   - Your deployment domain (if different)
5. Copy the **Client ID** and **Client Secret** (for reference, Firebase handles this internally)

### 2. **Facebook Sign-In Setup**

#### In Firebase Console:
1. Go to **Authentication** → **Sign-in method** → **Facebook**
2. Click **Enable**
3. You'll need a Facebook App ID and App Secret

#### In Facebook Developer Console:
1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app or use existing one
3. Add **Facebook Login** product
4. In **Settings** → **Basic**, copy:
   - **App ID**
   - **App Secret**
5. In **Settings** → **Basic** → **App Domains**, add:
   - `muthupuralk.firebaseapp.com`
   - Your deployment domain
6. Go to **Products** → **Facebook Login** → **Settings**
7. In **Valid OAuth Redirect URIs**, add:
   - `https://muthupuralk.firebaseapp.com/__/auth/handler`
   - Your deployment domain's auth handler

#### Back in Firebase Console:
1. Paste the **App ID** and **App Secret** from Facebook
2. Click **Save**

---

## 🚀 Testing Social Login Locally

### Prerequisites:
- Firebase emulator running (if testing locally)
- Social provider apps configured
- Backend server running on `https://api-soez2bw2ma-uc.a.run.app`

### Test Flow:
1. Open `Frontend/login.html` in your browser
2. Click **Google** button → Sign in with your Google account
3. Or click **Facebook** button → Sign in with your Facebook account
4. You should be redirected to `index.html` on success
5. Check browser console for detailed logs

---

## 📋 Authorized Redirect URIs

The following URIs should be configured in your OAuth provider settings:

### For Development:
- `http://localhost:5000` (if testing locally)
- `http://127.0.0.1:5000`

### For Production:
- `https://muthupuralk.firebaseapp.com/__/auth/handler`
- `https://your-production-domain.com`

---

## 🔐 How It Works

### Step-by-Step Flow:

1. **User clicks Social Login Button**
   - Frontend calls `loginWithGoogle()` or `loginWithFacebook()`

2. **Firebase Sign-In Popup Opens**
   - Firebase SDK handles the OAuth flow
   - User authenticates with Google/Facebook

3. **Firebase Returns ID Token**
   - Frontend receives user data and Firebase ID token

4. **Frontend Sends ID Token to Backend**
   - Calls `POST /api/auth/social-login`
   - Sends: `{idToken, provider, email, displayName, photoURL}`

5. **Backend Verifies ID Token**
   - Uses `admin.auth().verifyIdToken()`
   - Ensures token is valid and not tampered with

6. **Backend Creates/Finds User**
   - Checks if user exists in Firestore
   - Creates new user if first-time login
   - Updates Firebase UID if user already exists

7. **Backend Issues JWT Token**
   - Generates JWT with user data
   - Returns JWT to frontend

8. **Frontend Stores JWT & Redirects**
   - Stores JWT in `localStorage`
   - Redirects to `index.html`
   - User is now logged in!

---

## 📱 User Data Captured

When a user signs in via social login, the following data is stored:

```json
{
  "email": "user@example.com",
  "name": "User Name",
  "firebaseUid": "firebase_uid",
  "socialProvider": "google" | "facebook",
  "profileImageUrl": "https://...",
  "phone": "",
  "role": "user",
  "verified": false,
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

---

## 🐛 Troubleshooting

### "Firebase is not defined"
- Ensure `config.js` loads before social login functions
- Check that Firebase scripts are loaded from CDN:
  ```html
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
  ```

### "Invalid ID token"
- Token may have expired (Firebase tokens expire in ~1 hour)
- Verify token was obtained from Firebase auth
- Check backend console logs for verification errors

### "Social login exchange failed"
- Backend endpoint `/api/auth/social-login` may not be deployed
- Verify API_BASE_URL in `config.js` is correct
- Check backend is running and accessible

### "CORS error"
- Backend must allow cross-origin requests from frontend domain
- Add CORS headers or configure Firebase CORS settings

### "Redirect URI mismatch"
- Ensure authorized redirect URIs match exactly
- Check trailing slashes and protocol (http vs https)
- Firebase uses `/__/auth/handler` as the default handler

---

## 🔄 Backend Environment Variables

Ensure these are set in your Firebase Cloud Functions environment:

```bash
JWT_SECRET=your-secret-key-here
JWT_REFRESH=your-refresh-key-here
```

---

## 📚 References

- [Firebase Google Authentication](https://firebase.google.com/docs/auth/web/google-signin)
- [Firebase Facebook Authentication](https://firebase.google.com/docs/auth/web/facebook-login)
- [Firebase ID Token Verification](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Facebook Login Integration](https://developers.facebook.com/docs/facebook-login)

---

## ✨ What's Next

1. **Test both Google and Facebook logins** with test accounts
2. **Monitor console logs** to verify the flow
3. **Set up analytics** to track social login usage
4. **Add more social providers** if needed (GitHub, Apple, Microsoft, etc.)
5. **Implement account linking** to allow users to connect multiple providers

---

**Status**: ✅ Implementation Complete  
**Last Updated**: April 20, 2026
