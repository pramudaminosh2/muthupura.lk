# Firebase Functions - Quick Reference

## 📁 Project Structure

```
functions/
├── index.js                    # Main entry point - Express app
├── package.json                # Dependencies
├── .env.local                  # Environment variables (copy from .env.local.template)
├── .env.local.template         # Template for env vars
├── .eslintrc.js                # ESLint config
├── middleware/
│   └── auth.js                 # JWT verification, admin checks
├── routes/
│   ├── auth.js                 # Register, login, firebase-auth
│   ├── vehicles.js             # CRUD for vehicles
│   ├── profile.js              # User profile management
│   └── admin.js                # Admin dashboard
└── utils/
    └── helpers.js              # Validation, file path extraction
```

---

## 🚀 Quick Start Commands

### Deploy Functions
```bash
cd d:\My Coding\Muthupura.lk
firebase deploy --only functions
```

### Run Emulator Locally
```bash
cd d:\My Coding\Muthupura.lk
firebase emulators:start
```

### View Logs
```bash
firebase functions:log
```

### Set Environment Variables
```bash
firebase functions:config:set jwt.secret="your-secret"
firebase functions:config:set jwt.refresh="your-refresh"
```

---

## 🔗 API Endpoints

### Base URL (After Deployment)
```
https://us-central1-muthupuralk.cloudfunctions.net/api
```

### Authentication
```
POST   /api/auth/register              - Register new user
POST   /api/auth/login                 - Login with email/password
POST   /api/auth/firebase-auth         - Exchange Firebase token for JWT
POST   /api/auth/send-verification-email - Send verification email
POST   /api/auth/refresh-token         - Refresh JWT token
```

### Vehicles
```
POST   /api/vehicles/add               - Add new vehicle (requires auth)
GET    /api/vehicles/all               - Get all vehicles
GET    /api/vehicles/:id               - Get single vehicle
PUT    /api/vehicles/:id               - Update vehicle (owner only)
DELETE /api/vehicles/:id               - Delete vehicle (owner only)
GET    /api/vehicles/user/:userId      - Get user's vehicles
GET    /api/vehicles/search?q=term     - Search vehicles
```

### Profile
```
GET    /api/profile/me                 - Get current user (requires auth)
GET    /api/profile/:userId            - Get user public profile
PUT    /api/profile/update             - Update profile (requires auth)
PUT    /api/profile/password           - Change password (requires auth)
```

### Admin
```
GET    /api/admin/users                - Get all users (admin only)
GET    /api/admin/vehicles             - Get all vehicles (admin only)
PUT    /api/admin/vehicle/:id/feature  - Toggle featured (admin only)
DELETE /api/admin/vehicle/:id          - Delete vehicle (admin only)
PUT    /api/admin/user/:uid/role       - Update user role (admin only)
GET    /api/admin/stats                - Dashboard stats (admin only)
```

---

## 🔐 Authentication

### JWT Bearer Token
All protected endpoints require:
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Example Protected Request
```javascript
const response = await fetch('https://us-central1-muthupuralk.cloudfunctions.net/api/profile/me', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

---

## 📝 Firestore Collections

### users/
- `email` (string, unique)
- `name` (string)
- `phone` (string)
- `password` (hashed)
- `firebaseUid` (string)
- `role` (string: "user" or "admin")
- `profileImageUrl` (string)
- `verified` (boolean)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### vehicles/
- `userId` (string, reference to user)
- `title` (string)
- `description` (string)
- `price` (number)
- `brand` (string)
- `model` (string)
- `year` (number)
- `mileage` (number)
- `condition` (string: "new" or "used")
- `transmission` (string)
- `fuelType` (string)
- `images` (array of URLs)
- `features` (array: ["power mirror", "power window", ...]) ⭐ NEW
- `views` (number)
- `featured` (boolean)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

---

## ⚠️ Important Notes

### Environment Variables (.env.local)
```
FIREBASE_PROJECT_ID=muthupuralk
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@muthupuralk.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_STORAGE_BUCKET=muthupuralk.firebasestorage.app
JWT_SECRET=your-secret-key-here-change-this
JWT_REFRESH=your-refresh-key-here-change-this
NODE_ENV=production
```

### Rate Limiting
- Removed from Cloud Functions (use Cloud Armor or API Gateway if needed)
- Implement at frontend if required

### File Uploads
- Images uploaded from frontend directly to Firebase Storage
- API receives only image URLs
- No multipart/form-data handling needed in functions

---

## 🧪 Testing Endpoints

### Test Health Check
```bash
curl https://us-central1-muthupuralk.cloudfunctions.net/api/health
```

### Test Registration
```bash
curl -X POST https://us-central1-muthupuralk.cloudfunctions.net/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"password123",
    "name":"Test User"
  }'
```

### Test Get Vehicles
```bash
curl https://us-central1-muthupuralk.cloudfunctions.net/api/vehicles/all
```

---

## 🐛 Debugging

### Check Function Logs
```bash
firebase functions:log
```

### Emulate Locally
```bash
firebase emulators:start --only functions
# Then test at http://localhost:5001/muthupuralk/us-central1/api
```

### Common Issues

**"Admin SDK initialization failed"**
- Check .env.local has correct Firebase credentials
- Restart emulator after changing .env.local

**"Firestore permission denied"**
- Check Firestore security rules are set correctly
- Make sure authenticated user has permission

**"Storage file not found"**
- Verify image URL format: `https://storage.googleapis.com/muthupuralk.firebasestorage.app/...`
- Check file exists in Firebase Storage console

---

## 📚 Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Express.js Guide](https://expressjs.com/)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Admin SDK](https://firebase.google.com/docs/reference/admin)

---

## 🔄 Migration Checklist

- [ ] Run data migration: `node Backend/migrate-data.js`
- [ ] Verify data in Firestore Console
- [ ] Deploy functions: `firebase deploy --only functions`
- [ ] Update Frontend config.js with API URL
- [ ] Update all API endpoints in Frontend
- [ ] Test authentication flow
- [ ] Test vehicle CRUD operations
- [ ] Test admin functions
- [ ] Deploy frontend: `firebase deploy --only hosting`
- [ ] Monitor Firebase usage and costs

---

Generated: April 16, 2026
