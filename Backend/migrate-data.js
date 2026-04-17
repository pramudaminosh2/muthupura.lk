/**
 * Data Migration Script: Aiven MySQL to Firebase Firestore
 * 
 * Usage: node migrate-data.js
 * 
 * IMPORTANT: 
 * 1. Set up .env file with Aiven and Firebase credentials
 * 2. Backup your Aiven database before running this script
 * 3. This script is one-way - verify data in Firestore before deleting MySQL
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");

const admin = require("firebase-admin");
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

// Initialize Firebase Admin SDK
let firebaseConfig;

// Try to load from service account JSON file first
const serviceAccountPath = path.join(__dirname, "service-account.json");
if (fs.existsSync(serviceAccountPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
  admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
  });
  console.log("✅ Using service-account.json from Backend folder");
} else {
  // Fall back to environment variables
  admin.initializeApp({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
  console.log("✅ Using Firebase credentials from environment variables");
}

const db = admin.firestore();

// Create MySQL connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 3306,
  ssl: {rejectUnauthorized: false},
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Utility to convert MySQL timestamp to Firestore timestamp
function toFirestoreTimestamp(mysqlDate) {
  if (!mysqlDate) return admin.firestore.FieldValue.serverTimestamp();
  return admin.firestore.Timestamp.fromDate(new Date(mysqlDate));
}

/**
 * Migrate users from MySQL to Firestore
 */
async function migrateUsers() {
  console.log("\n📦 Starting users migration...");
  try {
    const connection = await pool.getConnection();

    const [users] = await connection.query("SELECT * FROM users");
    connection.release();

    console.log(`Found ${users.length} users to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const docId = user.id.toString();

        // Generate Firebase UID if not exists
        const firebaseUid = user.firebase_uid || `migrated_${docId}`;

        await db.collection("users").doc(docId).set({
          email: user.email,
          name: user.name || "",
          phone: user.phone || "",
          password: user.password || "", // Already hashed in MySQL
          role: user.role || "user",
          firebaseUid: firebaseUid,
          profileImageUrl: user.profile_image_url || "",
          verified: user.email_verified === 1,
          verificationToken: user.verification_token || "",
          createdAt: toFirestoreTimestamp(user.created_at),
          updatedAt: toFirestoreTimestamp(user.updated_at),
        });

        migratedCount++;

        if (migratedCount % 10 === 0) {
          console.log(`  ✓ Migrated ${migratedCount}/${users.length} users`);
        }
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error migrating user ${user.id}:`, error.message);
      }
    }

    console.log(`\n✅ Users migration complete: ${migratedCount} migrated, ${errorCount} errors`);
    return migratedCount;
  } catch (error) {
    console.error("❌ Users migration failed:", error);
    throw error;
  }
}

/**
 * Migrate vehicles from MySQL to Firestore
 */
async function migrateVehicles() {
  console.log("\n📦 Starting vehicles migration...");
  try {
    const connection = await pool.getConnection();

    const [vehicles] = await connection.query("SELECT * FROM vehicles");
    connection.release();

    console.log(`Found ${vehicles.length} vehicles to migrate`);

    let migratedCount = 0;
    let errorCount = 0;

    for (const vehicle of vehicles) {
      try {
        const docId = vehicle.id.toString();

        // Parse images - handle comma-separated or JSON array
        let images = [];
        if (vehicle.images) {
          if (vehicle.images.startsWith("[")) {
            try {
              images = JSON.parse(vehicle.images);
            } catch (e) {
              images = vehicle.images.split(",").filter((img) => img.trim());
            }
          } else {
            images = vehicle.images.split(",").filter((img) => img.trim());
          }
        }

        // Parse features - handle JSON array or comma-separated
        let features = [];
        if (vehicle.features) {
          if (vehicle.features.startsWith("[")) {
            try {
              features = JSON.parse(vehicle.features);
            } catch (e) {
              features = vehicle.features.split(",").filter((f) => f.trim());
            }
          } else {
            features = vehicle.features.split(",").filter((f) => f.trim());
          }
        }

        await db.collection("vehicles").doc(docId).set({
          userId: vehicle.user_id.toString(),
          title: vehicle.title,
          description: vehicle.description || "",
          price: parseFloat(vehicle.price),
          brand: vehicle.brand,
          model: vehicle.model,
          year: parseInt(vehicle.year),
          mileage: parseInt(vehicle.mileage) || 0,
          condition: vehicle.condition,
          transmission: vehicle.transmission || "",
          fuelType: vehicle.fuel_type || "",
          images: images,
          features: features,
          featured: vehicle.featured === 1,
          views: vehicle.views || 0,
          createdAt: toFirestoreTimestamp(vehicle.created_at),
          updatedAt: toFirestoreTimestamp(vehicle.updated_at),
        });

        migratedCount++;

        if (migratedCount % 10 === 0) {
          console.log(`  ✓ Migrated ${migratedCount}/${vehicles.length} vehicles`);
        }
      } catch (error) {
        errorCount++;
        console.error(`  ✗ Error migrating vehicle ${vehicle.id}:`, error.message);
      }
    }

    console.log(`\n✅ Vehicles migration complete: ${migratedCount} migrated, ${errorCount} errors`);
    return migratedCount;
  } catch (error) {
    console.error("❌ Vehicles migration failed:", error);
    throw error;
  }
}

/**
 * Verify migration by comparing counts
 */
async function verifyMigration() {
  console.log("\n🔍 Verifying migration...");
  try {
    const connection = await pool.getConnection();

    const [[{mysqlUsers}]] = await connection.query("SELECT COUNT(*) as mysqlUsers FROM users");
    const [[{mysqlVehicles}]] = await connection.query("SELECT COUNT(*) as mysqlVehicles FROM vehicles");

    connection.release();

    const firestoreUsersSnapshot = await db.collection("users").count().get();
    const firestoreVehiclesSnapshot = await db.collection("vehicles").count().get();

    const firestoreUsers = firestoreUsersSnapshot.data().count;
    const firestoreVehicles = firestoreVehiclesSnapshot.data().count;

    console.log("\n📊 Migration Summary:");
    console.log(`  Users:    MySQL=${mysqlUsers}, Firestore=${firestoreUsers}`);
    console.log(`  Vehicles: MySQL=${mysqlVehicles}, Firestore=${firestoreVehicles}`);

    if (mysqlUsers === firestoreUsers && mysqlVehicles === firestoreVehicles) {
      console.log("\n✅ Migration verified successfully!");
      return true;
    } else {
      console.log("\n⚠️  Warning: Count mismatch detected!");
      return false;
    }
  } catch (error) {
    console.error("❌ Verification failed:", error);
    return false;
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log("🚀 Starting Data Migration: Aiven MySQL → Firebase Firestore");
  console.log("=" .repeat(60));

  try {
    // Test connections
    console.log("\n🔌 Testing database connections...");

    const mysqlConnection = await pool.getConnection();
    await mysqlConnection.ping();
    mysqlConnection.release();
    console.log("  ✅ Aiven MySQL: Connected");

    // Test Firestore
    await db.collection("_test").doc("_test").set({test: true});
    await db.collection("_test").doc("_test").delete();
    console.log("  ✅ Firebase Firestore: Connected");

    // Run migrations
    const userCount = await migrateUsers();
    const vehicleCount = await migrateVehicles();

    // Verify
    const verified = await verifyMigration();

    console.log("\n" + "=" .repeat(60));
    if (verified) {
      console.log("✅ Migration completed successfully!");
    } else {
      console.log("⚠️  Migration completed with warnings - please verify manually");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run migration
main();
