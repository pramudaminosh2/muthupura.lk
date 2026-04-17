/**
 * Firebase status check and admin account creation
 */

const admin = require("firebase-admin");
const bcrypt = require("bcrypt");
const path = require("path");

console.log("🔧 Initializing Firebase Admin SDK...\n");

admin.initializeApp({
  credential: admin.credential.cert(
    path.resolve(__dirname, "..", "Backend", "service-account.json")
  ),
  storageBucket: "muthupuralk.appspot.com",
});

/**
 * Main setup function
 * @return {Promise<void>}
 */
async function main() {
  try {
    // Test Firestore - try default first
    console.log("1️⃣  Testing default Firestore database...");
    try {
      const db = admin.firestore();
      const snap = await db.collection("users").limit(1).get();
      console.log("✅ Default database works! Found", snap.size, "documents");

      // Create admin account
      await createAdminInDatabase(db);
    } catch (err) {
      if (err.message.includes("NOT_FOUND") || err.code === 5) {
        console.log("❌ Default database error: NOT_FOUND (code 5)");
        console.log("\n📌 IMPORTANT: Please check your Firebase Console:");
        console.log("   1. Go to: https://console.firebase.google.com/project/muthupuralk/firestore");
        console.log("   2. Check what databases you have:");
        console.log("      - Is there a (default) database?");
        console.log("      - Is there a database named 'muthupuralk'?");
        console.log("   3. If only 'muthupuralk' exists (no default), reply with that name");
        console.log("   4. If there's a default but it's empty, we can use that\n");
      } else {
        console.log("❌ Database error:", err.message);
      }
    }
  } catch (error) {
    console.error("❌ Fatal error:", error.message);
  } finally {
    await admin.app().delete();
    process.exit(0);
  }
}

/**
 * Create admin account in the given database
 */
async function createAdminInDatabase(db) {
  try {
    console.log("\n3️⃣  Creating admin account...");
    const adminEmail = "admin@muthupura.lk";
    const adminPassword = "muthupuraadmin123";

    // Check if exists
    const existing = await db.collection("users")
      .where("email", "==", adminEmail)
      .get();

    if (!existing.empty) {
      console.log("✅ Admin already exists in database!");
      return;
    }

    // Create Firebase Auth user
    const firebaseUser = await admin.auth().createUser({
      email: adminEmail,
      password: adminPassword,
      displayName: "Admin",
    });

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Save to Firestore
    await db.collection("users").doc(firebaseUser.uid).set({
      email: adminEmail,
      name: "Admin",
      password: hashedPassword,
      firebaseUid: firebaseUser.uid,
      role: "admin",
      verified: true,
      profileImageUrl: "",
      phone: "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log("✅ Admin account created successfully!");
    console.log("\n📧 Admin Credentials:");
    console.log("   Email: " + adminEmail);
    console.log("   Password: " + adminPassword);
    console.log("   Role: admin");
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
  }
}

main();
