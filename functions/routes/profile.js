const express = require("express");
const admin = require("firebase-admin");
const {getFirestore} = require("firebase-admin/firestore");
const {authenticate} = require("../middleware/auth");

const router = express.Router();

// ✅ Add JSON parser locally for profile routes
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
 * GET /api/profile/me
 * Get current user profile
 */
router.get("/me", authenticate, async (req, res) => {
  try {
    const {uid} = req.user;

    const userDoc = await getDb().collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({error: "User not found"});
    }

    const userData = userDoc.data();

    // Don't send password hash
    delete userData.password;

    res.json({
      success: true,
      user: {
        uid,
        ...userData,
      },
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * GET /api/profile/:userId
 * Get user profile by ID
 */
router.get("/:userId", async (req, res) => {
  try {
    const {userId} = req.params;

    const userDoc = await getDb().collection("users").doc(userId).get();

    if (!userDoc.exists) {
      return res.status(404).json({error: "User not found"});
    }

    const userData = userDoc.data();

    // Only return public info
    const publicData = {
      name: userData.name,
      profileImageUrl: userData.profileImageUrl,
      createdAt: userData.createdAt,
    };

    res.json({
      success: true,
      user: {
        uid: userId,
        ...publicData,
      },
    });
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * PUT /api/profile/update
 * Update current user profile
 */
router.put("/update", authenticate, async (req, res) => {
  try {
    const {uid} = req.user;
    const {name, phone, profileImageUrl} = req.body;

    const updateData = {};

    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (profileImageUrl) updateData.profileImageUrl = profileImageUrl;

    updateData.updatedAt = admin.firestore.FieldValue.serverTimestamp();

    await getDb().collection("users").doc(uid).update(updateData);

    res.json({
      success: true,
      message: "Profile updated",
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * PUT /api/profile/password
 * Update user password
 */
router.put("/password", authenticate, async (req, res) => {
  try {
    const {uid} = req.user;
    const {currentPassword, newPassword} = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({error: "Both passwords required"});
    }

    if (newPassword.length < 8) {
      return res.status(400).json({error: "New password must be at least 8 characters"});
    }

    const userDoc = await getDb().collection("users").doc(uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({error: "User not found"});
    }

    // Note: Password verification should be done via Firebase Auth
    // This is a simplified example

    res.json({
      success: true,
      message: "Password update initiated. Check Firebase Auth.",
    });
  } catch (error) {
    console.error("Password update error:", error);
    res.status(500).json({error: error.message});
  }
});

module.exports = router;
