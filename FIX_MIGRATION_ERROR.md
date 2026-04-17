# 🔧 Fix Migration Script - Firebase Credentials Setup

**Problem:** Migration script needs Firebase credentials to connect to Firestore

**Error:** `Could not load the default credentials`

**Solution:** Download service account JSON and place it in Backend folder

---

## Step 1: Get Service Account JSON

1. Go to: https://console.firebase.google.com/project/muthupuralk/settings/serviceaccounts/adminsdk
2. Click **"Generate New Private Key"** button
3. A JSON file will download (keep it safe!)
4. The filename will look like: `muthupuralk-firebase-adminsdk-xxxxx.json`

---

## Step 2: Copy to Backend Folder

1. Go to: `d:\My Coding\Muthupura.lk\Backend\`
2. Paste the downloaded JSON file there
3. **Rename it to:** `service-account.json` (important!)

**Result:**
```
d:\My Coding\Muthupura.lk\Backend\service-account.json  ← Should exist
```

---

## Step 3: Run Migration Again

```bash
cd d:\My Coding\Muthupura.lk\Backend
node migrate-data.js
```

**Expected output:**
```
✅ Using service-account.json from Backend folder
🚀 Starting Data Migration: Aiven MySQL → Firebase Firestore
...
✅ Migration verified successfully!
```

---

## That's It!

Once you place the `service-account.json` file in the Backend folder, the migration will work! 🎉

---

## Security Note ⚠️

**Keep this file safe!** It contains your Firebase admin credentials.

✅ DO:
- Keep it in Backend folder only
- Add to .gitignore (don't commit to Git)

❌ DON'T:
- Share it publicly
- Upload to GitHub
- Email it to anyone

---

**Ready to migrate? Download the JSON file and run the script!**
