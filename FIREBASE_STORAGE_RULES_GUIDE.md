# Firebase Storage Security Rules - Testing Guide

## ✅ Current Rules Summary

```
📁 /vehicles/{userId}/* 
├── ✅ ALLOW: write (upload/delete) - authenticated users who own the folder
├── ✅ ALLOW: delete - explicitly authenticated users who own the folder  
├── ✅ ALLOW: read - anyone (public image delivery)
└── ❌ DENY: all other operations
```

---

## 🧪 Testing Delete Operation in Firebase Console

### Correct Simulation Type for Testing DELETE:

**Simulation Type: `delete`** ✅ **This is correct!**

---

## 📋 Test Scenario Setup

### STEP 1: Open Firebase Storage Rules Simulator

1. Go to Firebase Console → Project → Storage → Rules tab
2. Click **"Rules Simulator"** button

### STEP 2: Test DELETE Permission (Will Pass)

**Configuration:**
```
Request Type:        delete  ✅
Authentication:      Authenticated user
Custom Claims:       (empty)
Reference Path:      vehicles/USER_UID_HERE/timestamp-0-image.jpg
```

**Expected Result:** ✅ **ALLOW**
```
Message: "Simulator indicates that this request would be allowed."
Reason: Authenticated user matches the userId in path
```

### STEP 3: Test DELETE Without Auth (Will Fail)

**Configuration:**
```
Request Type:        delete
Authentication:      Unauthenticated
Reference Path:      vehicles/USER_UID_HERE/timestamp-0-image.jpg
```

**Expected Result:** ❌ **DENY**
```
Message: "Simulator indicates that this request would be denied."
Reason: No authentication provided
```

### STEP 4: Test DELETE With Wrong User (Will Fail)

**Configuration:**
```
Request Type:        delete
Authentication:      Authenticated user (DIFFERENT_UID)
Custom Claims:       (empty)
Reference Path:      vehicles/DIFFERENT_USER_UID/timestamp-0-image.jpg
```

**Expected Result:** ❌ **DENY**
```
Message: "Simulator indicates that this request would be denied."
Reason: request.auth.uid doesn't match userId in path
```

---

## 📊 All Valid Simulation Types

| Type | Purpose | Used For |
|------|---------|----------|
| `read` | Reading files | GET image requests |
| `write` | Uploading files | POST/multipart uploads |
| `delete` | Deleting files | DELETE requests |
| `list` | Listing files | Directory listing |

---

## ✅ Production Rules Checklist

- [x] Users can upload images: `allow write: if request.auth.uid == userId`
- [x] Users can delete images: `allow delete: if request.auth.uid == userId`
- [x] Images are publicly readable: `allow read: if true`
- [x] Other operations are blocked: Default deny all
- [x] Custom paths have restrictions: Only authenticated owners

---

## 🔐 Security Best Practices

✅ **IMPLEMENTED:**
- ✅ Authentication required for write/delete
- ✅ User ID verification (can only modify own files)
- ✅ Public read access for image delivery
- ✅ Default deny policy (secure by default)

✅ **NOT NEEDED FOR YOUR USE CASE:**
- ❌ User metadata validation (already have uid)
- ❌ File size restrictions (backend compression handles this)
- ❌ File type validation (handled on client before upload)

---

## 🚀 Deployment

The updated rules have been automatically applied to Firebase Storage.

**To redeploy if needed:**
```bash
firebase deploy --only storage
```

---

## 📝 Backend Context

When backend deletes images:
1. ✅ Gets vehicle document from Firestore
2. ✅ Extracts image URLs from document
3. ✅ Authenticates user (middleware)
4. ✅ Verifies user owns the vehicle (backend check)
5. ✅ Extracts file paths from URLs
6. ✅ Calls `bucket.file(path).delete()` 
7. ✅ Firebase Storage checks these rules
8. ✅ Backend has service account (admin privileges)

**Note:** Backend service account bypasses these rules automatically!
Only frontend/client-side operations are restricted by these rules.

---

## ❓ FAQ

**Q: Why does backend DELETE work but I set rules to deny?**  
A: Firebase Admin SDK (used in Cloud Functions) bypasses security rules!  
It has full admin access. Rules only apply to client-side requests.

**Q: Is "delete" the correct simulation type?**  
A: ✅ YES! `delete` is the correct simulation type for testing file deletion.

**Q: Why allow public read but restrict write?**  
A: 
- Read: Users need to view images on public listing pages
- Write/Delete: Only file owners should modify their own files

**Q: Can I test from browser console?**  
A: Yes! Use Firebase SDK to test:
```javascript
const storage = getStorage();
const fileRef = ref(storage, 'vehicles/userId/image.jpg');
await deleteObject(fileRef);  // This will be checked against rules
```

