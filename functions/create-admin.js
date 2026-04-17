/**
 * Create admin account in Firestore
 * Usage: node create-admin.js
 */

/** Firebase Admin SDK */
const admin = require("firebase-admin");
const {Firestore} = require("@google-cloud/firestore");
const path = require("path");

// Initialize Firebase Admin SDK
const serviceAccountPath = path.join(__dirname, "..", "Backend", "service-account.json");
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  storageBucket: `${serviceAccount.project_id}.appspot.com`,
});

/**
 * Create admin account
 */
async function createAdmin() {
  try {
    console.log("🔧 Initializing Firebase Admin SDK...\n");

    const email = "admin@muthupura.lk";
    const password = "muthupuraadmin123";

    // Step 1: Try to get existing admin user
    console.log("1️⃣  Checking if admin user already exists...");
    try {
      const existingUser = await admin.auth().getUserByEmail(email);
      console.log(`⚠️  Admin user already exists: ${existingUser.uid}`);
      return;
    } catch (err) {
      if (err.code !== "auth/user-not-found") {
        throw err;
      }
      console.log("✅ No existing admin found, creating new...\n");
    }

    // Step 2: Create Firebase Auth user
    console.log("2️⃣  Creating Firebase Auth user...");
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: "System Admin",
    });
    console.log(`✅ Firebase Auth user created: ${firebaseUser.uid}\n`);

    // Step 3: Create Firestore user document in muthupuralk database
    console.log("3️⃣  Creating Firestore user document...");
    const db = new Firestore({
      projectId: serviceAccount.project_id,
      credentials: serviceAccount,
      databaseId: "muthupuralk",
    });

    await db.collection("users").doc(firebaseUser.uid).set({
      email,
      name: "System Admin",
      password: "", // Already secured in Firebase Auth
      firebaseUid: firebaseUser.uid,
      role: "admin",
      verified: true,
      profileImageUrl: "",
      phone: "",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log(`✅ Firestore user document created\n`);

    // Step 4: Verify
    console.log("4️⃣  Verifying admin account...");
    const adminDoc = await db.collection("users").doc(firebaseUser.uid).get();
    if (adminDoc.exists) {
      const data = adminDoc.data();
      console.log(`✅ Admin verified in muthupuralk database:`);
      console.log(`   Email: ${data.email}`);
      console.log(`   Role: ${data.role}`);
      console.log(`   UID: ${firebaseUser.uid}\n`);
    }

    console.log("✅ Admin account created successfully!\n");
    console.log("📝 Login credentials:");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}\n`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating admin account:");
    console.error(error);
    process.exit(1);
  }
}

createAdmin();
