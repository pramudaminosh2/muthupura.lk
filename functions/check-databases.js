/**
 * Script to list available Firestore databases
 * Run with: node check-databases.js
 */

const admin = require("firebase-admin");
const path = require("path");

console.log("🔧 Initializing Firebase Admin SDK...");

const serviceAccountPath = path.resolve(__dirname, "..", "Backend", "service-account.json");
console.log("   Service account path:", serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
  storageBucket: "muthupuralk.firebasestorage.app",
});

/**
 * Check available databases
 * @return {Promise<void>}
 */
async function checkDatabases() {
  try {
    console.log("\n📋 Checking available Firestore databases...\n");

    // ✅ Get Firestore instance - use named database if available
    let firestoreAdmin;
    try {
      // Try to access named database "muthupuralk"
      firestoreAdmin = admin.firestore({databaseId: "muthupuralk"});
      console.log("✅ Using named database: muthupuralk");
    } catch (err) {
      console.log("⚠️  Named database not available, trying default");
      firestoreAdmin = admin.firestore();
    }

    // Try to get collection names
    console.log("\n1️⃣  Checking Firestore database...");
    try {
      const collections = await firestoreAdmin.listCollections();
      console.log("✅ Database is accessible");
      console.log(`   Collections: ${collections.length}`);
      collections.forEach((col) => {
        console.log(`   - ${col.id}`);
      });
    } catch (err) {
      console.log("❌ Database error:", err.message);
    }

    // Try to access using Project ID
    console.log("\n2️⃣  Checking project info...");
    const projectId = admin.app().options.projectId;
    if (projectId) {
      console.log("✅ Project ID:", projectId);
    } else {
      const cred = admin.app().options.credential;
      if (cred && cred.cert) {
        console.log("✅ Project ID (from cert):", cred.cert.project_id);
      }
    }

    console.log("\n3️⃣  Attempt to query database...");
    try {
      const users = await firestoreAdmin.collection("users").limit(1).get();
      console.log("✅ Users collection found, count:", users.size);
    } catch (err) {
      console.log("⚠️  Could not access users collection:", err.message);
    }

    console.log("\n✅ System check complete!");
  } catch (error) {
    console.error("❌ Error:", error.message);
    console.error("\nFull error:");
    console.error(error);
  } finally {
    await admin.app().delete();
    process.exit(0);
  }
}

checkDatabases();
