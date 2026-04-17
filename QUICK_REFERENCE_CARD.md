# ⚡ QUICK REFERENCE - FINAL 2 STEPS

## 🎯 YOU ARE 85% DONE - 15 MINUTES LEFT!

---

## STEP 1️⃣ - SET IAM PERMISSIONS (5 min)

**URL:** https://console.firebase.google.com/project/muthupuralk/functions

**Instructions:**
1. Find & click **`api`** function
2. Click **"Permissions"** tab
3. Click **"Grant Access"** button
4. Type: **`allUsers`**
5. Select role: **"Cloud Functions Invoker"**
6. Click **"Save"**
7. Click **"Allow"** when prompted

**Result:** API becomes publicly accessible ✅

---

## STEP 2️⃣ - DEPLOY FRONTEND (5 min)

**Command:**
```bash
firebase deploy --only hosting
```

**From:** `d:\My Coding\Muthupura.lk`

**Expected Output:**
```
✅ Deploy complete!
Hosting URL: https://muthupuralk.web.app
```

**Result:** Frontend goes live ✅

---

## STEP 3️⃣ - VERIFY EVERYTHING (5 min)

**Run Tests:**
```bash
node test-system.js
```

**Expected Result:** ✅ **6/6 PASSED**

**Open in Browser:**
```
https://muthupuralk.web.app
```

**Test Login:**
- Email: `test@example.com`
- Password: `test123`

---

## 🎉 WHEN ALL DONE

You'll have:
- ✅ Serverless backend (Cloud Functions)
- ✅ NoSQL database (Firestore)  
- ✅ Live frontend (Firebase Hosting)
- ✅ 4 migrated users
- ✅ 23 working API endpoints
- ✅ 60%+ cost savings

---

## 📊 CURRENT STATUS

| Component | Status |
|-----------|--------|
| Backend | ✅ Deployed |
| Database | ✅ Migrated |
| Frontend | ✅ Updated |
| IAM | ⏳ **TODO** |
| Deploy | ⏳ **TODO** |
| Tests | ⏳ **TODO** |

---

## 🆘 QUICK HELP

**API still 403?**
→ Wait 2 min for IAM to propagate, then refresh

**Frontend shows error?**
→ Check browser console (F12), verify api-url

**Login fails?**
→ Use email: `test@example.com`, password: `test123`

---

## ✅ CHECKLIST

- [ ] Step 1: IAM permissions set
- [ ] Step 2: Frontend deployed  
- [ ] Step 3: Tests run (6/6 pass)
- [ ] Opened website in browser
- [ ] Logged in successfully

**Check all = 100% COMPLETE!** 🎊

---

**Start with Step 1 now!** 👉 https://console.firebase.google.com/project/muthupuralk/functions
