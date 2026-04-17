const admin = require("firebase-admin");
const jwt = require("jsonwebtoken");

/**
 * Verify authentication middleware
 * Handles both Firebase ID tokens and JWT tokens
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("❌ No authorization header found");
      return res.status(401).json({error: "No auth token provided"});
    }

    const token = authHeader.split(" ")[1];
    console.log("🔐 Token received, attempting verification...");

    // Try Firebase ID token first
    try {
      console.log("🔄 Attempting Firebase token verification...");
      const decodedToken = await admin.auth().verifyIdToken(token);
      console.log("✅ Firebase token verified, uid:", decodedToken.uid);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        provider: decodedToken.firebase?.sign_in_provider || "firebase",
      };
      return next();
    } catch (firebaseErr) {
      console.log("⚠️  Firebase token verification failed:", firebaseErr.message);
    }

    // Try JWT token as fallback
    try {
      console.log("🔄 Attempting JWT token verification...");
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "muthupura-secret-key");
      console.log("✅ JWT token verified, uid:", decoded.uid);
      req.user = decoded;
      return next();
    } catch (jwtErr) {
      console.log("⚠️  JWT token verification failed:", jwtErr.message);
    }

    // Both failed
    console.error("❌ Both Firebase and JWT verification failed");
    return res.status(401).json({error: "Invalid or expired token"});
  } catch (error) {
    console.error("❌ Authentication error:", error);
    res.status(401).json({error: "Authentication failed"});
  }
}

/**
 * Verify Firebase ID token (alias for authenticate)
 */
async function verifyFirebaseToken(req, res, next) {
  return authenticate(req, res, next);
}

/**
 * Verify admin role
 */
async function requireAdmin(req, res, next) {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({error: "Not authenticated"});
    }

    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(req.user.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({error: "User not found"});
    }

    const userData = userDoc.data();
    if (userData.role !== "admin") {
      return res.status(403).json({error: "Admin access required"});
    }

    next();
  } catch (error) {
    res.status(403).json({error: "Authorization check failed"});
  }
}

module.exports = {authenticate, verifyFirebaseToken, requireAdmin};
