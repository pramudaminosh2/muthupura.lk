const {setGlobalOptions} = require("firebase-functions");
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

// ✅ Initialize Firebase Admin SDK
admin.initializeApp();

// Set global options for Cloud Functions
setGlobalOptions({maxInstances: 10});

// Create Express app
const app = express();

// Middleware
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// ✅ Parse JSON requests (images now come from Firebase Storage)
app.use(express.json({limit: "50mb"})); // Allow up to 50MB JSON payloads for image URLs

// Import routes
const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicles");
const profileRoutes = require("./routes/profile");
const adminRoutes = require("./routes/admin");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({status: "ok", timestamp: new Date().toISOString()});
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("🔴 Error:", err);

  // JSON parsing errors
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    console.error("📝 JSON parsing error:", err.message);
    return res.status(400).json({error: "Invalid JSON in request body"});
  }

  // Generic error
  console.error("❌ Unexpected error:", err.message);
  res.status(500).json({
    error: err.message || "Internal server error",
  });
});

// Export Cloud Function
exports.api = functions.https.onRequest(app);
