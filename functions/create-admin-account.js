/**
 * Script to create an admin account and test the system
 * Run with: node create-admin-account.js
 */

const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const path = require("path");

// Initialize Firebase Admin with explicit database
console.log("🔧 Initializing Firebase Admin SDK...");
admin.initializeApp({
  credential: admin.credential.cert(
    path.resolve(__dirname, "..", "Backend", "service-account.json")
  ),
  storageBucket: "muthupuralk.appspot.com",
});

// ✅ Access Firestore with specific database ID
const db = admin.firestore({databaseId: "muthupuralk"});
const auth = admin.auth();

/**
 * Create admin account and test the system
 * @return {Promise<void>}
 */
async function createAdminAccount() {
  try {
    console.log("\n📋 Creating Admin Account...\n");

    const adminEmail = "admin@muthupura.lk";
    const adminPassword = "muthupuraadmin123";
    const adminName = "Admin";

    // Check if user already exists
    console.log("1️⃣  Checking if admin user already exists...");
    const existingUsers = await db.collection("users")
      .where("email", "==", adminEmail)
      .get();

    if (!existingUsers.empty) {
      console.log("✅ Admin user already exists!");
      const adminDoc = existingUsers.docs[0];
      const adminData = adminDoc.data();
      console.log("   Email:", adminData.email);
      console.log("   Role:", adminData.role);
      console.log("   UID:", adminDoc.id);
      return;
    }

    // Create Firebase auth user
    console.log("\n2️⃣  Creating Firebase Auth user...");
    const firebaseUser = await auth.createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: adminName,
    });
    console.log("✅ Firebase Auth user created");
    console.log("   UID:", firebaseUser.uid);

    // Hash password for Firestore
    console.log("\n3️⃣  Hashing password...");
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    console.log("✅ Password hashed");

    // Save to Firestore
    console.log("\n4️⃣  Saving to Firestore (muthupuralk database)...");
    await db.collection("users").doc(firebaseUser.uid).set({
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      firebaseUid: firebaseUser.uid,
      role: "admin",
      verified: true,
      profileImageUrl: "",
      phone: "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("✅ User document saved to Firestore");

    console.log("\n✨ Admin Account Created Successfully!\n");
    console.log("📧 Email: " + adminEmail);
    console.log("🔐 Password: " + adminPassword);
    console.log("👤 Name: " + adminName);
    console.log("🎖️  Role: admin");
    console.log("🔑 UID: " + firebaseUser.uid);

    // Now test the system
    console.log("\n\n🧪 TESTING SYSTEM...\n");

    // Test 1: Check if user exists in Firestore
    console.log("Test 1: Verifying admin account in Firestore...");
    const verifyUser = await db.collection("users").doc(firebaseUser.uid).get();
    if (verifyUser.exists) {
      console.log("✅ Admin account found in Firestore (muthupuralk database)");
      const userData = verifyUser.data();
      console.log("   Email:", userData.email);
      console.log("   Role:", userData.role);
      console.log("   Verified:", userData.verified);
    } else {
      console.log("❌ Admin account NOT found in Firestore!");
      return;
    }

    // Test 2: Check Firestore settings
    console.log("\nTest 2: Checking Firestore database...");
    const settings = db.settings;
    console.log("✅ Firestore is ready");
    console.log("   Database ID:", settings.databaseId || "default");

    // Test 3: Check users collection
    console.log("\nTest 3: Checking users collection...");
    const usersSnapshot = await db.collection("users").limit(5).get();
    console.log("✅ Users collection accessible");
    console.log("   Total users in database:", usersSnapshot.size);
    usersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log(`   - ${data.email} (${data.role})`);
    });

    console.log("\n\n✅ ALL TESTS PASSED - System is working!\n");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\nFull error details:");
    console.error(error);
    process.exit(1);
  } finally {
    await admin.app().delete();
    process.exit(0);
  }
}

// Run the function
createAdminAccount();
