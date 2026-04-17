const express = require("express");
const admin = require("firebase-admin");
const {getFirestore} = require("firebase-admin/firestore");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const {verifyFirebaseToken, authenticate} = require("../middleware/auth");
const {validateRegistration} = require("../utils/helpers");

const router = express.Router();

// ✅ Add JSON parser locally for auth routes
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

const JWT_SECRET = process.env.JWT_SECRET || "muthupura-secret-key";
const JWT_REFRESH = process.env.JWT_REFRESH || "muthupura-refresh-key";

/**
 * POST /api/auth/register
 * Register new user
 */
router.post("/register", async (req, res) => {
  try {
    const {email, password, name} = req.body;

    // Validate input
    const errors = validateRegistration({email, password, name});
    if (errors.length > 0) {
      return res.status(400).json({errors});
    }

    // Check if user exists
    const existingUsers = await getDb().collection("users")
      .where("email", "==", email)
      .get();

    if (!existingUsers.empty) {
      return res.status(400).json({error: "Email already exists"});
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create Firebase user
    const firebaseUser = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    // Save to Firestore
    await getDb().collection("users").doc(firebaseUser.uid).set({
      email,
      name,
      password: hashedPassword,
      firebaseUid: firebaseUser.uid,
      role: "user",
      verified: false,
      profileImageUrl: "",
      phone: "",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Create JWT
    const token = jwt.sign(
      {uid: firebaseUser.uid, email, name, role: "user"},
      JWT_SECRET,
      {expiresIn: "7d"}
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        uid: firebaseUser.uid,
        email,
        name,
        role: "user",
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post("/login", async (req, res) => {
  try {
    const {email, password} = req.body;

    if (!email || !password) {
      return res.status(400).json({error: "Email and password required"});
    }

    // Get user from Firestore
    const userQuery = await getDb().collection("users")
      .where("email", "==", email)
      .get();

    if (userQuery.empty) {
      return res.status(401).json({error: "Invalid credentials"});
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Verify password
    const passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) {
      return res.status(401).json({error: "Invalid credentials"});
    }

    // Create JWT
    const token = jwt.sign(
      {uid: userDoc.id, email: userData.email, name: userData.name, role: userData.role},
      JWT_SECRET,
      {expiresIn: "7d"}
    );

    res.json({
      success: true,
      token,
      user: {
        uid: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * POST /api/auth/firebase-auth
 * Exchange Firebase ID token for JWT
 */
router.post("/firebase-auth", verifyFirebaseToken, async (req, res) => {
  try {
    const firebaseUser = req.firebaseUser;
    const {email, name, uid} = firebaseUser;

    // Find or create user in Firestore
    const userQuery = await getDb().collection("users")
      .where("email", "==", email)
      .get();

    let userDoc;

    if (userQuery.empty) {
      // Create new user
      const newUserRef = getDb().collection("users").doc(uid);
      await newUserRef.set({
        email,
        name: name || email.split("@")[0],
        firebaseUid: uid,
        role: "user",
        verified: false,
        password: "",
        profileImageUrl: "",
        phone: "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      userDoc = await newUserRef.get();
    } else {
      // Update existing user if needed
      userDoc = userQuery.docs[0];
      const userData = userDoc.data();

      if (!userData.firebaseUid) {
        await userDoc.ref.update({firebaseUid: uid});
      }
    }

    const userData = userDoc.data();

    // Create JWT
    const token = jwt.sign(
      {uid: userDoc.id, email: userData.email, name: userData.name, role: userData.role},
      JWT_SECRET,
      {expiresIn: "7d"}
    );

    res.json({
      success: true,
      token,
      user: {
        uid: userDoc.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
      },
    });
  } catch (error) {
    console.error("Firebase auth error:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * POST /api/auth/verify-email
 * Send verification email
 */
router.post("/send-verification-email", authenticate, async (req, res) => {
  try {
    const {uid} = req.user;

    // In production, send actual email
    // For now, generate token
    const verificationToken = jwt.sign({uid}, JWT_SECRET, {expiresIn: "1h"});

    res.json({
      success: true,
      message: "Verification email sent",
      token: verificationToken,
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * POST /api/auth/refresh-token
 * Refresh JWT token
 */
router.post("/refresh-token", async (req, res) => {
  try {
    const {refreshToken} = req.body;

    if (!refreshToken) {
      return res.status(400).json({error: "Refresh token required"});
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH);
    const {uid, email, name, role} = decoded;

    const newToken = jwt.sign(
      {uid, email, name, role},
      JWT_SECRET,
      {expiresIn: "7d"}
    );

    res.json({
      success: true,
      token: newToken,
    });
  } catch (error) {
    res.status(401).json({error: "Invalid refresh token"});
  }
});

module.exports = router;
