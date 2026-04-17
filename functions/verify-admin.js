/**
 * Verify and fix admin account in Firestore
 */

/** Firebase Admin SDK */
const admin = require("firebase-admin");
const {Firestore} = require("@google-cloud/firestore");
const path = require("path");

const serviceAccountPath = path.join(__dirname, "..", "Backend", "service-account.json");
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`,
  storageBucket: `${serviceAccount.project_id}.appspot.com`,
});

/**
 * Verify admin account
 */
async function verifyAdmin() {
  try {
    console.log("🔧 Verifying admin account...\n");

    const email = "admin@muthupura.lk";

    // Get Firebase Auth user
    console.log("1️⃣  Getting Firebase Auth user...");
    const authUser = await admin.auth().getUserByEmail(email);
    console.log(`✅ Found: ${authUser.uid}\n`);

    // Check Firestore user document using direct Firestore client
    console.log("2️⃣  Checking Firestore user document in muthupuralk...");
    const db = new Firestore({
      projectId: serviceAccount.project_id,
      credentials: serviceAccount,
      databaseId: "muthupuralk",
    });

    const userDoc = await db.collection("users").doc(authUser.uid).get();

    if (userDoc.exists) {
      console.log(`✅ User document exists:`);
      console.log(JSON.stringify(userDoc.data(), null, 2));
    } else {
      console.log(`⚠️  User document NOT found. Creating...\n`);

      await db.collection("users").doc(authUser.uid).set({
        email,
        name: "System Admin",
        password: "", // Secured in Firebase Auth
        firebaseUid: authUser.uid,
        role: "admin",
        verified: true,
        profileImageUrl: "",
        phone: "",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log(`✅ User document created!\n`);
    }

    console.log("✅ Admin account verified!");
    console.log(`\n📝 Credentials:`);
    console.log(`   Email: ${email}`);
    console.log(`   Password: muthupuraadmin123`);
    console.log(`   UID: ${authUser.uid}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:");
    console.error(error.message);
    process.exit(1);
  }
}

verifyAdmin();

verifyAdmin();
