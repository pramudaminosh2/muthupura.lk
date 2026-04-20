const express = require("express");
const admin = require("firebase-admin");
const {getFirestore} = require("firebase-admin/firestore");
const {authenticate, requireAdmin} = require("../middleware/auth");

const router = express.Router();

// ✅ Add JSON parser locally for admin routes
router.use(express.json({limit: "10mb"}));

// ✅ Helper to access muthupuralk database using modular SDK
const getDb = () => {
  try {
    return getFirestore("muthupuralk");
  } catch (err) {
    console.error("❌ Database access error:", err.message);
    throw new Error(`Cannot access Firestore database: ${err.message}`);
  }
};

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
router.get("/users", authenticate, requireAdmin, async (req, res) => {
  try {
    console.log("📋 Fetching all users for admin...");
    const snapshot = await getDb().collection("users").limit(100).get();

    const users = snapshot.docs.map((doc) => {
      const userData = doc.data();
      delete userData.password; // Don't expose passwords
      return {
        uid: doc.id,
        ...userData,
      };
    });

    console.log(`✅ Retrieved ${users.length} users from database`);
    res.json({success: true, users, total: snapshot.size});
  } catch (error) {
    console.error("❌ Get users error:", error.message);
    res.status(500).json({error: error.message, details: "Failed to fetch users"});
  }
});

/**
 * GET /api/admin/vehicles
 * Get all vehicles with status (admin only)
 */
router.get("/vehicles", authenticate, requireAdmin, async (req, res) => {
  try {
    console.log("📋 Fetching all vehicles for admin...");
    const snapshot = await getDb().collection("vehicles")
      .orderBy("createdAt", "desc")
      .limit(100)
      .get();

    const vehicles = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    console.log(`✅ Retrieved ${vehicles.length} vehicles from database`);
    res.json({success: true, vehicles, total: snapshot.size});
  } catch (error) {
    console.error("❌ Get admin vehicles error:", error.message);
    res.status(500).json({error: error.message, details: "Failed to fetch vehicles"});
  }
});

/**
 * PUT /api/admin/vehicle/:id/feature
 * Toggle featured status
 */
router.put("/vehicle/:id/feature", authenticate, requireAdmin, async (req, res) => {
  try {
    const {id} = req.params;
    const {featured} = req.body;

    const vehicleDoc = await getDb().collection("vehicles").doc(id).get();

    if (!vehicleDoc.exists) {
      return res.status(404).json({error: "Vehicle not found"});
    }

    await vehicleDoc.ref.update({
      featured: Boolean(featured),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.json({
      success: true,
      message: `Vehicle ${featured ? "featured" : "unfeatured"}`,
    });
  } catch (error) {
    console.error("Toggle feature error:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * PUT /api/admin/user/:uid/verify
 * Verify a seller (set verified flag)
 */
router.put("/user/:uid/verify", authenticate, requireAdmin, async (req, res) => {
  try {
    const {uid} = req.params;
    console.log(`✅ Verifying seller: ${uid}`);

    const userDoc = await getDb().collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({error: "User not found"});
    }

    await userDoc.ref.update({
      verified: true,
      verifiedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Seller verified: ${userDoc.data().email}`);
    res.json({
      success: true,
      message: "Seller verified successfully",
      email: userDoc.data().email,
    });
  } catch (error) {
    console.error("❌ Verify seller error:", error);
    res.status(500).json({error: error.message, details: "Failed to verify seller"});
  }
});

/**
 * DELETE /api/admin/vehicle/:id
 * Delete vehicle (admin only)
 */
router.delete("/vehicle/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const {id} = req.params;

    const vehicleDoc = await getDb().collection("vehicles").doc(id).get();

    if (!vehicleDoc.exists) {
      return res.status(404).json({error: "Vehicle not found"});
    }

    // Delete images from storage
    const images = vehicleDoc.data().images || [];
    const bucket = admin.storage().bucket();

    for (const imageUrl of images) {
      try {
        const filePath = new URL(imageUrl).pathname.split("/o/")[1]?.split("?")[0];
        if (filePath) {
          await bucket.file(decodeURIComponent(filePath)).delete();
        }
      } catch (err) {
        console.log("Could not delete image:", imageUrl);
      }
    }

    await vehicleDoc.ref.delete();

    res.json({success: true, message: "Vehicle deleted by admin"});
  } catch (error) {
    console.error("Admin delete vehicle error:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * PUT /api/admin/user/:uid/role
 * Update user role
 */
router.put("/user/:uid/role", authenticate, requireAdmin, async (req, res) => {
  try {
    const {uid} = req.params;
    const {role} = req.body;

    console.log(`🔄 Updating user role for ${uid} to ${role}`);

    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({error: "Invalid role"});
    }

    const userDoc = await getDb().collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({error: "User not found"});
    }

    await userDoc.ref.update({
      role,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ User role updated: ${userDoc.data().email} to ${role}`);
    res.json({
      success: true,
      message: `User role updated to ${role}`,
    });
  } catch (error) {
    console.error("❌ Update user role error:", error.message);
    res.status(500).json({error: error.message, details: "Failed to update user role"});
  }
});

/**
 * DELETE /api/admin/user/:uid
 * Delete user, their vehicles, and all associated images (admin only)
 */
router.delete("/user/:uid", authenticate, requireAdmin, async (req, res) => {
  try {
    const {uid} = req.params;
    console.log(`🗑️  Starting user deletion process for: ${uid}`);

    // Step 1: Get user document
    const userDoc = await getDb().collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({error: "User not found"});
    }

    // Step 2: Find all vehicles owned by this user
    const vehiclesSnapshot = await getDb().collection("vehicles")
      .where("userId", "==", uid)
      .get();

    // Step 3: Delete all images from storage and then vehicles
    const bucket = admin.storage().bucket();

    for (const vehicleDoc of vehiclesSnapshot.docs) {
      const vehicleData = vehicleDoc.data();
      const images = vehicleData.images || [];

      // Delete each image from Firebase Storage
      for (const imageUrl of images) {
        try {
          const filePath = new URL(imageUrl).pathname.split("/o/")[1]?.split("?")[0];
          if (filePath) {
            await bucket.file(decodeURIComponent(filePath)).delete();
            console.log(`🗑️  Deleted image: ${filePath}`);
          }
        } catch (err) {
          console.log("Could not delete image:", imageUrl);
        }
      }

      // Delete vehicle document from Firestore
      await vehicleDoc.ref.delete();
      console.log(`🗑️  Deleted vehicle: ${vehicleData.title}`);
    }

    // Step 4: Delete user from Firestore
    await userDoc.ref.delete();
    console.log(`🗑️  Deleted user document: ${userDoc.data().email}`);

    // Step 5: Delete user from Firebase Authentication
    try {
      await admin.auth().deleteUser(uid);
      console.log(`🗑️  Deleted from Firebase Auth: ${uid}`);
    } catch (authError) {
      console.log("User not in Firebase Auth (OK):", uid);
    }

    res.json({
      success: true,
      message: "User deleted successfully",
      details: {
        userDeleted: userDoc.data().email,
        vehiclesDeleted: vehiclesSnapshot.size,
        imagesDeleted: vehiclesSnapshot.docs.reduce((sum, doc) => {
          return sum + (doc.data().images?.length || 0);
        }, 0),
      },
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * GET /api/admin/stats
 * Get dashboard statistics
 */
router.get("/stats", authenticate, requireAdmin, async (req, res) => {
  try {
    // Get user count
    const usersSnapshot = await getDb().collection("users").count().get();
    const userCount = usersSnapshot.data().count;

    // Get vehicle count
    const vehiclesSnapshot = await getDb().collection("vehicles").count().get();
    const vehicleCount = vehiclesSnapshot.data().count;

    // Get featured vehicles count
    const featuredSnapshot = await getDb().collection("vehicles")
      .where("featured", "==", true)
      .count()
      .get();
    const featuredCount = featuredSnapshot.data().count;

    res.json({
      success: true,
      stats: {
        users: userCount,
        vehicles: vehicleCount,
        featured: featuredCount,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({error: error.message});
  }
});

module.exports = router;
