# Firestore Collection Structure & Data Model

## 📊 Updated Collections (Post-Migration)

### 1. USERS Collection

**Document ID:** User's custom ID (originally MySQL id)

```json
{
  "id": "1",
  "email": "user@example.com",
  "name": "User Name",
  "password": "bcrypt_hashed_password",
  "phone": "+1234567890",
  "firebaseUid": "firebase-auth-uid",
  "role": "user",           // "user" or "admin"
  "profileImageUrl": "https://storage.googleapis.com/...",
  "verified": false,
  "verificationToken": "token-123",
  "createdAt": {            // Firestore Timestamp
    "_seconds": 1713264000,
    "_nanoseconds": 0
  },
  "updatedAt": {
    "_seconds": 1713264000,
    "_nanoseconds": 0
  }
}
```

**Indexes Created:**
- `email` (unique)
- `role`
- `createdAt` (descending)

---

### 2. VEHICLES Collection

**Document ID:** Vehicle's custom ID (originally MySQL id)

```json
{
  "id": "101",
  "userId": "1",                    // Reference to user who posted
  "title": "2020 Honda Civic",
  "description": "Well maintained...",
  "price": 15000,
  "brand": "Honda",
  "model": "Civic",
  "year": 2020,
  "mileage": 45000,
  "condition": "used",              // "new" or "used"
  "transmission": "automatic",
  "fuelType": "petrol",
  
  // ⭐ NEW: Features Array
  "features": [
    "power mirror",
    "power window",
    "air conditioning",
    "power steering",
    "leather seats",
    "sunroof"
  ],
  
  // Image URLs (uploaded via Firebase Storage)
  "images": [
    "https://storage.googleapis.com/muthupuralk.firebasestorage.app/vehicles/car1.jpg",
    "https://storage.googleapis.com/muthupuralk.firebasestorage.app/vehicles/car2.jpg"
  ],
  
  "views": 42,
  "featured": false,
  
  "createdAt": {
    "_seconds": 1713264000,
    "_nanoseconds": 0
  },
  "updatedAt": {
    "_seconds": 1713264000,
    "_nanoseconds": 0
  }
}
```

**Indexes Created:**
- `userId` (ascending)
- `featured` (ascending)
- `createdAt` (descending)
- `brand` (ascending)
- `price` (ascending & descending for range queries)

---

## 🔄 Data Flow Examples

### Adding a New Vehicle

```
Frontend (vehicle.html)
    ↓
1. Upload images to Firebase Storage
   ← Get image URLs
    ↓
2. POST /api/vehicles/add
   {
     title: "2021 Toyota",
     brand: "Toyota",
     price: 20000,
     images: [url1, url2, url3],
     features: ["power mirror", "AC"]    ← NEW!
   }
    ↓
Cloud Function (routes/vehicles.js)
    ↓
3. Validate data with validateVehicleData()
    ↓
4. Create document in Firestore
   vehicles/{vehicleId}
    ↓
Response: { vehicleId: "xyz" }
    ↓
Frontend: Show "Vehicle added!"
```

### Searching Vehicles

```
Frontend (vehicle.html)
    ↓
1. GET /api/vehicles/all?brand=Honda
    ↓
Cloud Function (routes/vehicles.js)
    ↓
2. Query Firestore:
   db.collection("vehicles")
     .where("brand", "==", "Honda")
     .orderBy("createdAt", "desc")
     .limit(100)
    ↓
3. Return documents as array
    ↓
Frontend: Display results
```

### User Authentication

```
Frontend (login.html)
    ↓
1. GET Firebase ID Token
   (via Firebase Client SDK)
    ↓
2. POST /api/auth/firebase-auth
   {
     Authorization: "Bearer FIREBASE_ID_TOKEN"
   }
    ↓
Cloud Function (routes/auth.js)
    ↓
3. Verify token with Firebase Admin SDK
    ↓
4. Look up user in Firestore by email
    ↓
5. If not exists → Create user document
    ↓
6. Create JWT token
    ↓
Response: { token: "JWT_TOKEN", user: {...} }
    ↓
Frontend: Save JWT to localStorage
         Use for future requests
```

---

## 📝 Key Field Definitions

| Field | Type | Usage | Notes |
|-------|------|-------|-------|
| `email` | String | Authentication | Unique, indexed |
| `password` | String | Auth backup | Bcrypt hashed |
| `firebaseUid` | String | Firebase linking | Unique when set |
| `role` | String | Authorization | "user" or "admin" |
| `features` | Array | Vehicle details | Newly added ⭐ |
| `images` | Array | Gallery | Storage URLs |
| `views` | Number | Analytics | Incremented on view |
| `featured` | Boolean | Promotion | Admin toggle |
| `createdAt` | Timestamp | Sorting | Server timestamp |
| `updatedAt` | Timestamp | Sorting | Server timestamp |

---

## 🔗 Relationships

### One-to-Many (User → Vehicles)

```
users/
├── "1"
│   ├── email: "user1@example.com"
│   └── name: "User 1"

vehicles/
├── "101" → userId: "1"
├── "102" → userId: "1"
├── "103" → userId: "1"
└── ...
```

**Query:** `db.collection("vehicles").where("userId", "==", "1")`

---

## 🔐 Access Control

### By User Type

**Public (No Auth):**
- GET /api/vehicles/all
- GET /api/vehicles/:id
- GET /api/vehicles/search

**Authenticated User:**
- POST /api/vehicles/add (own vehicle)
- PUT /api/vehicles/:id (own vehicle)
- DELETE /api/vehicles/:id (own vehicle)
- GET /api/profile/me
- PUT /api/profile/update

**Admin Only:**
- GET /api/admin/users
- GET /api/admin/vehicles
- PUT /api/admin/vehicle/:id/feature
- DELETE /api/admin/vehicle/:id (any vehicle)
- PUT /api/admin/user/:uid/role

---

## 📈 Scalability Considerations

### Current Setup
- **Users:** Firestore optimized for 1-10M+ documents
- **Vehicles:** Same - scales automatically
- **Features array:** Stores up to 1MB per document

### If You Need to Scale Further

1. **Search:** Use Algolia for full-text search (optional)
2. **Indexes:** Firestore auto-creates needed indexes
3. **Performance:** Document reads/writes are instant

---

## 🔄 Changes from MySQL to Firestore

| Feature | MySQL | Firestore | Notes |
|---------|-------|-----------|-------|
| Auto-increment IDs | ✅ | ⚠️ Manual | Use doc IDs |
| Transactions | ✅ | ✅ | Same functionality |
| Relationships | Foreign keys | Document refs | More flexible |
| Timestamps | DATETIME | Timestamp | Auto-conversion |
| Arrays | JSON/VARCHAR | Native array | Native support ⭐ |
| Storage | Disk-based | Cloud-based | Automatic sync |

---

## 💾 Backup & Recovery

### Firestore Backup
- Auto-backup: Enabled by default
- Manual backup: Via Firebase Console
- Recovery: Restore to any point in time

### How to Backup
```
Firebase Console → Firestore Database → Backups → Create Backup
```

---

## ✅ Verification Checklist

After migration, verify:

- [ ] `users` collection exists
- [ ] `vehicles` collection exists
- [ ] All users migrated (count matches)
- [ ] All vehicles migrated (count matches)
- [ ] `features` field exists in vehicles
- [ ] `password` field exists in users
- [ ] Timestamps converted properly
- [ ] Images URLs valid
- [ ] No `approved` or `status` fields in vehicles

---

## 📚 Firestore Query Examples

### Get all featured vehicles
```javascript
db.collection("vehicles")
  .where("featured", "==", true)
  .orderBy("createdAt", "desc")
  .get()
```

### Get user's vehicles
```javascript
db.collection("vehicles")
  .where("userId", "==", userId)
  .orderBy("createdAt", "desc")
  .get()
```

### Get vehicles by brand and sort by price
```javascript
db.collection("vehicles")
  .where("brand", "==", "Honda")
  .where("condition", "==", "used")
  .orderBy("price", "asc")
  .get()
```

### Search by multiple conditions
```javascript
db.collection("vehicles")
  .where("brand", "==", "Honda")
  .where("year", ">=", 2018)
  .where("price", "<=", 20000)
  .orderBy("year", "desc")
  .limit(50)
  .get()
```

---

Generated: April 16, 2026
