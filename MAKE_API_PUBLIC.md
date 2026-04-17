# 🔓 Making API Public - Quick Fix Guide

## Problem
✅ Backend Code: **WORKING**
✅ Cloud Functions: **DEPLOYED**  
❌ Public Access: **NEEDS PERMISSION**

Error: "The request was not authenticated. Either allow unauthenticated invocations or set the proper Authorization header."

---

## Solution (3 Steps - 2 minutes)

### Step 1: Open Firebase Console
1. Go to: https://console.firebase.google.com/project/muthupuralk/functions
2. Click on the `api` function (us-central1)

### Step 2: Go to Permissions Tab
1. Click the **"Permissions"** tab at the top
2. Click **"Grant Access"** button

### Step 3: Add Public Access
1. In "New principals" field, type: `allUsers`
2. In "Select a role", choose: **Cloud Functions > Cloud Functions Invoker**
3. Click **"Save"**
4. Click **"Allow public access"** when prompted

---

## Result
✅ Function becomes publicly accessible
✅ No authentication required
✅ Frontend can call API

---

## Verification (After Setting Permissions)

Run this to test:
```bash
node -e "const https = require('https'); https.get('https://api-soez2bw2ma-uc.a.run.app/api/health', (res) => { console.log('✅ Status:', res.statusCode); let data=''; res.on('data', c=>data+=c); res.on('end', ()=>console.log('Response:', data)); }).on('error', e => console.log('Error:', e.message));"
```

Should show: **Status: 200**

---

## Alternative: Using Cloud Console

If above doesn't work, use Google Cloud Console:

1. Go to: https://console.cloud.google.com/functions/details/us-central1/api?project=muthupuralk
2. Click the **"Permissions"** tab
3. Click **"Grant Access"**
4. Add `allUsers` with role `Cloud Functions Invoker`
5. Click **"Save"**

---

**After setting permissions, try testing the API again!**
