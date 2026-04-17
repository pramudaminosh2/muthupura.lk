const {setGlobalOptions} = require("firebase-functions");
const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const multer = require("multer");

// ✅ Initialize Firebase Admin SDK
admin.initializeApp({
  storageBucket: "muthupuralk.appspot.com",
});

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

// ✅ Middleware to log multipart requests (before any body parsing)
app.use((req, res, next) => {
  const contentType = req.get("content-type") || "";
  if (contentType.includes("multipart/form-data")) {
    console.log("📦 Multipart request detected on:", req.path);
    console.log("   Content-Type:", contentType);
    console.log("   Content-Length:", req.get("content-length"), "bytes");

    // Extract boundary if present
    const boundaryMatch = contentType.match(/boundary=([^;]+)/);
    if (boundaryMatch) {
      const boundary = boundaryMatch[1];
      console.log("   Boundary:", boundary);
    }
  }
  next();
});

// ✅ CRITICAL: Do NOT use global body parsing middleware
// This prevents interference with multer's multipart handling
// Instead, express.json() will be applied selectively to routes that need it

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB per file
    files: 10, // Max 10 files
  },
  fileFilter: (req, file, cb) => {
    console.log(`📁 Multer file: ${file.fieldname} - ${file.originalname} (${file.size} bytes)`);
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

// Import routes
const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicles");
const profileRoutes = require("./routes/profile");
const adminRoutes = require("./routes/admin");

// Use routes
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes(upload));
app.use("/api/profile", profileRoutes);
app.use("/api/admin", adminRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({status: "ok", timestamp: new Date().toISOString()});
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("🔴 Error:", err);

  // Multer errors
  if (err.name === "MulterError") {
    console.error("📤 Multer error:", err.code, err.message);
    if (err.code === "FILE_TOO_LARGE") {
      return res.status(413).json({error: "File too large"});
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(413).json({error: "Too many files"});
    }
    return res.status(400).json({error: `File upload error: ${err.message}`});
  }

  // Multipart parsing errors
  if (err.message && err.message.includes("Unexpected end of form")) {
    console.error("⚠️  Multipart parsing error - malformed form data received");
    console.error("   This usually means: missing final boundary, incomplete upload, or connection issue");
    console.error("   Error:", err.message);
    return res.status(400).json({
      error: "Multipart form parsing failed",
      details: "The form data appears incomplete. Try uploading fewer or smaller files.",
    });
  }

  // Handle other multipart errors
  if (err.message && (err.message.includes("boundary") || err.message.includes("multipart"))) {
    console.error("⚠️  Multipart error:", err.message);
    return res.status(400).json({
      error: "Form data error",
      details: err.message,
    });
  }

  // Generic error
  console.error("❌ Unexpected error:", err.message);
  res.status(500).json({
    error: err.message || "Internal server error",
  });
});

// Export Cloud Function
exports.api = functions.https.onRequest(app);
