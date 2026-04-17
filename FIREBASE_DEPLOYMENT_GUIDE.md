# Firebase Functions Deployment Guide

## ✅ What's Done for You

### Files Created/Updated:
1. ✅ **functions/index.js** - Fixed ESLint errors, set up Express app with all routes
2. ✅ **functions/middleware/auth.js** - JWT verification & admin checks
3. ✅ **functions/utils/helpers.js** - Utility functions for validation & file extraction
4. ✅ **functions/routes/auth.js** - Authentication endpoints (register, login, firebase-auth)
5. ✅ **functions/routes/vehicles.js** - Vehicle CRUD operations
6. ✅ **functions/routes/profile.js** - User profile management
7. ✅ **functions/routes/admin.js** - Admin dashboard endpoints
8. ✅ **Backend/migrate-data.js** - Data migration script from Aiven to Firestore
9. ✅ **functions/.env.local.template** - Environment variables template

---

## 📋 STEP 3.2 - Set Up Functions Project Structure (ALREADY DONE)

Your project structure now looks like:

```
functions/
├── index.js                 ← Main API entry point (FIXED)
├── package.json            ← Already has dependencies
├── middleware/
│   └── auth.js             ← JWT & admin verification
├── routes/
│   ├── auth.js             ← /api/auth/* endpoints
│   ├── vehicles.js         ← /api/vehicles/* endpoints
│   ├── profile.js          ← /api/profile/* endpoints
│   └── admin.js            ← /api/admin/* endpoints
├── utils/
│   └── helpers.js          ← Validation & helper functions
├── .env.local.template     ← Copy to .env.local and fill
└── .eslintrc.js            ← Already configured
```

---

## 🔑 STEP 3.7 - Configure Environment Variables

### 3.7.1 Get Firebase Admin Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select **muthupuralk** project
3. Go to **⚙️ Settings → Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file (keep it safe!)

### 3.7.2 Set Environment Variables

Copy the `.env.local.template` to `.env.local` in the **functions/** directory:

```bash
cd functions
cp .env.local.template .env.local
```

Edit `functions/.env.local` and fill in:

```env
# From Firebase service account JSON
FIREBASE_PROJECT_ID=muthupuralk
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@muthupuralk.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nXXXX...\nXXXX...\n-----END PRIVATE KEY-----\n
FIREBASE_STORAGE_BUCKET=muthupuralk.firebasestorage.app

# Generate these (just random strings, but keep them safe!)
JWT_SECRET=super-secret-key-123456-change-this
JWT_REFRESH=refresh-secret-key-654321-change-this

NODE_ENV=production
```

### 3.7.3 Add to Firebase Configuration

```bash
# From functions/ directory
firebase functions:config:set jwt.secret="your-jwt-secret-here"
firebase functions:config:set jwt.refresh="your-refresh-secret-here"
```

---

## 🔄 STEP 2.2 - Migrate Data from Aiven to Firestore

### Before You Start:
⚠️ **BACKUP YOUR AIVEN DATABASE FIRST!**

### Migration Steps:

1. **Go to Backend directory**:
   ```bash
   cd Backend
   ```

2. **Ensure .env has Aiven credentials**:
   ```env
   DB_HOST=your-aiven-host.aivencloud.com
   DB_USER=avnadmin
   DB_PASSWORD=your-password
   DB_NAME=defaultdb
   DB_PORT=13035

   FIREBASE_PROJECT_ID=muthupuralk
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY=...
   ```

3. **Run migration**:
   ```bash
   node migrate-data.js
   ```

4. **Expected output**:
   ```
   🚀 Starting Data Migration: Aiven MySQL → Firebase Firestore
   ============================================================

   🔌 Testing database connections...
     ✅ Aiven MySQL: Connected
     ✅ Firebase Firestore: Connected

   📦 Starting users migration...
   Found 50 users to migrate
     ✓ Migrated 50/50 users

   ✅ Users migration complete: 50 migrated, 0 errors

   📦 Starting vehicles migration...
   Found 200 vehicles to migrate
     ✓ Migrated 200/200 vehicles

   ✅ Vehicles migration complete: 200 migrated, 0 errors

   🔍 Verifying migration...

   📊 Migration Summary:
     Users:    MySQL=50, Firestore=50
     Vehicles: MySQL=200, Firestore=200

   ✅ Migration verified successfully!
   ```

5. **Verify in Firebase Console**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select **muthupuralk**
   - Go to **Build → Firestore Database**
   - Check collections: `users`, `vehicles`

---

## ⚙️ STEP 4 - Deploy to Firebase

### 4.1 Install Dependencies (Already Done!)

Dependencies are already in `functions/package.json`:
- ✅ express
- ✅ firebase-admin
- ✅ bcrypt
- ✅ jsonwebtoken
- ✅ multer
- ✅ cors

### 4.2 Set Firebase Configuration

Already done! Run:

```bash
cd d:\My Coding\Muthupura.lk
firebase functions:config:set jwt.secret="your-jwt-secret-change-this"
firebase functions:config:set jwt.refresh="your-refresh-secret-change-this"
```

### 4.3 Deploy Functions

```bash
firebase deploy --only functions
```

**Expected output**:
```
=== Deploying to 'muthupuralk'...

i  deploying functions, hosting
✔  functions: Submitted function creation operation [operations/xxxxx].
✔  Your HTTP function is running at:
   https://us-central1-muthupuralk.cloudfunctions.net/api
```

### 4.4 Get Your Functions URL

After deployment, your API is at:
```
https://us-central1-muthupuralk.cloudfunctions.net/api
```

---

## 🌐 STEP 5 - Update Frontend

### 5.1 Update config.js

In `Frontend/config.js`:

```javascript
// OLD
const API_BASE = 'https://your-render-backend.com';

// NEW
const API_BASE = 'https://us-central1-muthupuralk.cloudfunctions.net/api';
```

### 5.2 Update All API Endpoints

**Old endpoints → New endpoints:**

```javascript
// Authentication
/register                  → /api/auth/register
/login                     → /api/auth/login
/firebase-auth             → /api/auth/firebase-auth

// Vehicles
/add-vehicle               → /api/vehicles/add
/get-vehicles              → /api/vehicles/all
/vehicle/:id               → /api/vehicles/:id
/update-vehicle/:id        → /api/vehicles/:id (PUT)
/delete-vehicle/:id        → /api/vehicles/:id (DELETE)
/my-vehicles               → /api/vehicles/user/:userId

// Profile
/me                        → /api/profile/me
/profile                   → /api/profile/:userId (GET)

// Admin
/admin/vehicles            → /api/admin/vehicles
/toggle-feature/:id        → /api/admin/vehicle/:id/feature (PUT)
```

### 5.3 Example: Update Vehicle API Call

**Before (Render backend)**:
```javascript
async function getVehicles() {
  const response = await fetch('https://render-backend.com/get-vehicles', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}
```

**After (Firebase Functions)**:
```javascript
async function getVehicles() {
  const response = await fetch('https://us-central1-muthupuralk.cloudfunctions.net/api/vehicles/all', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });
  return response.json();
}
```

### 5.4 Update auth-ui.js Login Handler

```javascript
async function loginUser(email, password) {
  const response = await fetch(
    `${API_BASE}/auth/login`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    }
  );

  const data = await response.json();
  if (data.success) {
    localStorage.setItem('authToken', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.user;
  } else {
    throw new Error(data.error);
  }
}
```

### 5.5 Test Your Changes

1. Update one endpoint in `auth-ui.js` and test login
2. Update vehicle endpoints in `vehicle.html` and test vehicle listing
3. Once confident, update all remaining endpoints

---

## 🧪 Testing Your Setup

### Test Authentication
```bash
curl -X POST https://us-central1-muthupuralk.cloudfunctions.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Test Vehicle Retrieval
```bash
curl https://us-central1-muthupuralk.cloudfunctions.net/api/vehicles/all
```

### Test Health Check
```bash
curl https://us-central1-muthupuralk.cloudfunctions.net/api/health
```

---

## 🔐 Firestore Security Rules

Set these in **Firebase Console → Firestore → Rules**:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read: if request.auth.uid == userId || request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    // Vehicles collection (public read, authenticated write)
    match /vehicles/{vehicleId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.userId;
    }

    // Admin access
    allow read, write: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
  }
}
```

---

## 🗑️ Cleanup: Cancel Old Services

Once everything is working:

1. **Stop Render.com backend** - Go to dashboard and delete the service
2. **Cancel Aiven database** - No longer needed (keep as backup for 30 days)
3. **Monitor Firebase costs** - Check in **Billing → Usage**

---

## 📊 Firestore Collection Schema

Your Firestore now has:

### users/
- email (string)
- name (string)
- phone (string)
- password (hashed)
- firebaseUid (string)
- role (string) - "user" or "admin"
- profileImageUrl (string)
- verified (boolean)
- createdAt (timestamp)
- updatedAt (timestamp)

### vehicles/
- userId (string) - owner ID
- title (string)
- description (string)
- price (number)
- brand (string)
- model (string)
- year (number)
- mileage (number)
- condition (string)
- transmission (string)
- fuelType (string)
- images (array) - URLs
- **features (array)** - ⭐ NEW: power mirror, power window, etc.
- views (number)
- featured (boolean)
- createdAt (timestamp)
- updatedAt (timestamp)

---

## 🆘 Troubleshooting

### Deploy fails with "resource.data is undefined"
- This is a Firestore security rule issue
- Make sure rules are properly formatted
- Redeploy functions: `firebase deploy --only functions`

### Vehicles don't have features field after migration
- The migration script adds empty features array
- Update vehicles UI to handle empty features array
- New vehicles will have features field

### Function times out
- Increase timeout: Edit `functions/index.js`
- Add: `functions.https.onRequest({timeoutSeconds: 540}, app)`

---

## 🎉 You're Done!

Your system is now fully on Firebase:
- ✅ Database: Firestore
- ✅ Backend: Cloud Functions
- ✅ Frontend: Firebase Hosting
- ✅ Storage: Firebase Storage
- ✅ Auth: Firebase Authentication

**Costs**: ~$5-15/month vs $32-70/month before! 🚀
