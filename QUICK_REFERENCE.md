# 🚀 Quick Reference Commands & Cheatsheet

**Muthupura.lk Firebase Migration**

---

## Terminal Commands Quick Copy

### Setup Phase

```bash
# Navigate to project
cd d:\My Coding\Muthupura.lk

# Copy env template
cd functions
cp .env.local.template .env.local

# Edit .env.local (fill in Firebase credentials)
# Open functions/.env.local in editor
```

### Deployment Phase

```bash
# Deploy Cloud Functions
cd d:\My Coding\Muthupura.lk
firebase deploy --only functions

# Check deployment status
firebase functions:log

# Deploy hosting (after frontend updates)
firebase deploy --only hosting

# Deploy everything
firebase deploy
```

### Data Migration Phase

```bash
# Navigate to Backend
cd Backend

# Run migration
node migrate-data.js

# Check migration logs
node migrate-data.js 2>&1 | tee migration.log
```

### Local Testing Phase

```bash
# Start emulator
firebase emulators:start

# Start only functions emulator
firebase emulators:start --only functions

# Check if emulator is running
curl http://localhost:5001/muthupuralk/us-central1/api/health
```

### Debugging Phase

```bash
# View function logs
firebase functions:log

# Real-time function logs
firebase functions:log --follow

# Check config
firebase functions:config:get

# Set env variables
firebase functions:config:set jwt.secret="your-secret"
firebase functions:config:set jwt.refresh="your-refresh"
```

---

## API Testing Commands (curl)

### Health Check
```bash
curl https://us-central1-muthupuralk.cloudfunctions.net/api/health
```

### Register User
```bash
curl -X POST https://us-central1-muthupuralk.cloudfunctions.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123",
    "name":"Test User"
  }'
```

### Login User
```bash
curl -X POST https://us-central1-muthupuralk.cloudfunctions.net/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123"
  }'
```

### Get All Vehicles
```bash
curl https://us-central1-muthupuralk.cloudfunctions.net/api/vehicles/all
```

### Get Single Vehicle
```bash
curl https://us-central1-muthupuralk.cloudfunctions.net/api/vehicles/101
```

### Add Vehicle (Requires JWT)
```bash
curl -X POST https://us-central1-muthupuralk.cloudfunctions.net/api/vehicles/add \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "title":"2020 Honda Civic",
    "brand":"Honda",
    "model":"Civic",
    "year":2020,
    "price":15000,
    "mileage":45000,
    "condition":"used",
    "transmission":"automatic",
    "fuelType":"petrol",
    "features":["power mirror","AC"],
    "images":["url1","url2"]
  }'
```

### Get Current User Profile
```bash
curl https://us-central1-muthupuralk.cloudfunctions.net/api/profile/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Admin: Get All Users
```bash
curl https://us-central1-muthupuralk.cloudfunctions.net/api/admin/users \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

### Admin: Get Dashboard Stats
```bash
curl https://us-central1-muthupuralk.cloudfunctions.net/api/admin/stats \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN"
```

---

## JavaScript Code Snippets

### Frontend: Login Function
```javascript
async function login(email, password) {
  const response = await fetch(
    'https://us-central1-muthupuralk.cloudfunctions.net/api/auth/login',
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
    return true;
  }
  return false;
}
```

### Frontend: Authenticated Request
```javascript
async function getProfile() {
  const token = localStorage.getItem('authToken');
  const response = await fetch(
    'https://us-central1-muthupuralk.cloudfunctions.net/api/profile/me',
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    }
  );
  
  return await response.json();
}
```

### Frontend: Get Vehicles
```javascript
async function getVehicles() {
  const response = await fetch(
    'https://us-central1-muthupuralk.cloudfunctions.net/api/vehicles/all'
  );
  
  const data = await response.json();
  return data.vehicles;
}
```

### Frontend: Add Vehicle
```javascript
async function addVehicle(vehicleData) {
  const token = localStorage.getItem('authToken');
  const response = await fetch(
    'https://us-central1-muthupuralk.cloudfunctions.net/api/vehicles/add',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(vehicleData)
    }
  );
  
  return await response.json();
}
```

---

## Find & Replace Patterns

### In Frontend Files

```
Find:  /register
Replace: /api/auth/register

Find: /login
Replace: /api/auth/login

Find: /firebase-auth
Replace: /api/auth/firebase-auth

Find: /add-vehicle
Replace: /api/vehicles/add

Find: /get-vehicles
Replace: /api/vehicles/all

Find: /update-vehicle/
Replace: /api/vehicles/

Find: /delete-vehicle/
Replace: /api/vehicles/

Find: /my-vehicles
Replace: /api/vehicles/user/

Find: /me
Replace: /api/profile/me

Find: /profile
Replace: /api/profile/

Find: /admin/vehicles
Replace: /api/admin/vehicles

Find: /toggle-feature/
Replace: /api/admin/vehicle/ ... /feature
```

---

## Environment Variables

### .env.local for Functions

```env
FIREBASE_PROJECT_ID=muthupuralk
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@muthupuralk.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_STORAGE_BUCKET=muthupuralk.firebasestorage.app
JWT_SECRET=your-jwt-secret-key-here
JWT_REFRESH=your-refresh-secret-key-here
NODE_ENV=production
```

---

## File Locations

```
Project Root: d:\My Coding\Muthupura.lk

Frontend Files:
- d:\My Coding\Muthupura.lk\Frontend\config.js ← Update API_BASE
- d:\My Coding\Muthupura.lk\Frontend\auth-ui.js ← Update endpoints
- d:\My Coding\Muthupura.lk\Frontend\vehicle.html ← Update endpoints

Backend Files:
- d:\My Coding\Muthupura.lk\functions\index.js
- d:\My Coding\Muthupura.lk\functions\.env.local ← Create this!
- d:\My Coding\Muthupura.lk\Backend\migrate-data.js

Documentation:
- START_HERE.md ← READ FIRST
- IMPLEMENTATION_SUMMARY.md
- FIREBASE_DEPLOYMENT_GUIDE.md
- FIRESTORE_SCHEMA.md
- DEPLOYMENT_CHECKLIST.md
```

---

## Debugging Tips

### Function Won't Deploy
```bash
# Check for errors
firebase functions:log

# Check .env.local exists
ls functions/.env.local

# Check syntax
npm --prefix functions run lint

# Redeploy
firebase deploy --only functions
```

### Login Fails
```bash
# Check Firestore has users collection
# Check security rules in Firebase Console
# Check .env.local has correct Firebase credentials
# Check JWT_SECRET is set
```

### Vehicles Don't Show
```bash
# Check Firestore has vehicles collection
# Check migration ran successfully
# Check browser network tab for API errors
# Check response status codes
```

### Migration Stuck
```bash
# Check Aiven connection
# Check Firebase connection
# Kill and restart: Ctrl+C then run again
# Check error logs in console
```

---

## Firestore Console Navigation

```
https://console.firebase.google.com/
  └── muthupuralk project
      └── Build
          └── Firestore Database
              ├── collections
              │   ├── users (check documents)
              │   └── vehicles (check documents)
              └── Rules (set security rules)
```

## Firebase Functions Console

```
https://console.firebase.google.com/
  └── muthupuralk project
      └── Build
          └── Functions
              ├── api (your main function)
              ├── Logs (real-time logs)
              └── Settings (memory, timeout)
```

## Cloud Storage Console

```
https://console.firebase.google.com/
  └── muthupuralk project
      └── Build
          └── Storage
              ├── vehicles/ (folder with images)
              └── Rules (set security rules)
```

---

## Status Check Commands

### Is Firebase Project Ready?
```bash
firebase projects:list
firebase project:info muthupuralk
```

### Is Firestore Ready?
```bash
firebase firestore:indexes:list
```

### Are Functions Deployed?
```bash
firebase functions:list
```

### What's the API URL?
```
https://us-central1-muthupuralk.cloudfunctions.net/api
```

---

## NPM Commands in Functions

```bash
cd functions

# Install dependencies
npm install

# Run linter
npm run lint

# Fix lint errors
npm run lint -- --fix

# Start emulator
npm run serve

# View logs
npm run logs
```

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| "Module not found" | Run `npm install` in functions/ |
| "Permission denied" | Check Firestore security rules |
| "Invalid token" | Check JWT_SECRET in .env.local |
| "Feature field missing" | Re-run migration: `node migrate-data.js` |
| "CORS error" | Check CORS origin in index.js |
| "400 Bad Request" | Check request payload format |
| "401 Unauthorized" | Verify JWT token is correct |
| "403 Forbidden" | Check user role for admin endpoints |
| "404 Not Found" | Check endpoint URL spelling |
| "500 Server Error" | Check function logs: `firebase functions:log` |

---

## Performance Check

### Test API Speed
```bash
# Install Apache Bench (ab) if needed
# npm install -g ab

ab -n 10 -c 1 https://us-central1-muthupuralk.cloudfunctions.net/api/health

# Should see < 500ms per request
```

---

## Before Going Live

- [ ] Test all login methods
- [ ] Test vehicle CRUD operations
- [ ] Test admin functions
- [ ] Check mobile responsiveness
- [ ] Test image uploads
- [ ] Test search functionality
- [ ] Monitor Firebase console
- [ ] Check cost estimates
- [ ] Verify security rules
- [ ] Test error handling

---

## After Going Live

- [ ] Monitor Firebase usage
- [ ] Monitor error rates
- [ ] Monitor cost
- [ ] Collect user feedback
- [ ] Check performance metrics
- [ ] Plan optimizations
- [ ] Schedule maintenance

---

**Generated:** April 16, 2026  
**Version:** 1.0 - Ready for Production
