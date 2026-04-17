const express = require("express");
const admin = require("firebase-admin");
const {getFirestore} = require("firebase-admin/firestore");
const {authenticate} = require("../middleware/auth");
const {validateVehicleData, extractFilePathFromUrl} = require("../utils/helpers");

// ✅ Helper to access muthupuralk database using modular SDK
const getDb = () => {
  try {
    return getFirestore("muthupuralk");
  } catch (err) {
    console.error("❌ Database access error:", err.message);
    throw new Error(`Cannot access Firestore database: ${err.message}`);
  }
};

const bucket = admin.storage().bucket();

// Wrapper to handle multer errors gracefully
const handleMulterError = (middleware) => {
  return (req, res, next) => {
    middleware(req, res, (err) => {
      if (err) {
        console.error("🔴 Multer middleware error:", err.message);
        console.error("   Error name:", err.name);
        console.error("   Error code:", err.code);

        // Check for specific errors
        if (err.message && err.message.includes("Unexpected end of form")) {
          console.error("   This is a multipart boundary parsing error");
          console.error("   Possible causes:");
          console.error("   - Request stream was interrupted");
          console.error("   - Content-Length mismatch");
          console.error("   - Incomplete file upload");
          console.error("   - Network timeout");

          return res.status(400).json({
            error: "Multipart form incomplete",
            message: "The form data was incomplete. This often happens with slow " +
              "connections or large files. Please try again.",
            code: "INCOMPLETE_MULTIPART",
          });
        }

        // Other multer errors
        return res.status(400).json({
          error: "File upload error",
          message: err.message,
          code: err.code || "UNKNOWN",
        });
      }
      next();
    });
  };
};

// Export a function that takes upload middleware
module.exports = (upload) => {
  const router = express.Router();

  /**
   * POST /api/vehicles/add
   * Add new vehicle (with file uploads from frontend FormData)
   */
  router.post("/add", handleMulterError(upload.array("images", 10)), authenticate, async (req, res) => {
    try {
      // ✅ Set response timeout to prevent hanging
      res.setTimeout(300000); // 5 minutes

      console.log("🚀 POST /api/vehicles/add - Request received");
      console.log("📊 Request details:", {
        contentType: req.headers["content-type"],
        contentLength: req.headers["content-length"] || "Unknown",
        transferEncoding: req.headers["transfer-encoding"],
      });
      console.log("📄 Files received:", req.files ? `${req.files.length} files` : "❌ No files");
      console.log("👤 User ID:", req.user?.uid);
      console.log("📝 Body keys:", Object.keys(req.body));

      const {
        make,
        model,
        year,
        price,
        condition,
        transmission,
        fuel_type: fuelType,
        mileage,
        description,
        engine_capacity: engineCapacity,
        seller_name: sellerName,
        phone,
        city,
      } = req.body;

      const uid = req.user.uid;

      // Map form values to API format
      const title = `${make} ${model} (${year})`;
      const brand = make;

      // Validate data
      const errors = validateVehicleData({
        title,
        brand,
        model,
        price,
        year,
        condition,
      });
      if (errors.length > 0) {
        console.log("❌ Validation failed:", errors);
        return res.status(400).json({errors});
      }

      // Upload images to Firebase Storage
      const imageUrls = [];
      const uploadErrors = [];

      if (req.files && req.files.length > 0) {
        console.log(`📸 Uploading ${req.files.length} images to Firebase Storage`);
        console.log(`🪣 Bucket name: ${bucket.name}`);

        for (let i = 0; i < req.files.length; i++) {
          try {
            const file = req.files[i];
            const fileName = `vehicles/${uid}/${Date.now()}-${i}-${file.originalname}`;

            console.log(`📤 Uploading image ${i + 1}/${req.files.length}: ${fileName} (${file.size} bytes)`);

            // Upload to Firebase Storage
            const fileObj = bucket.file(fileName);
            await fileObj.save(file.buffer, {
              metadata: {
                contentType: file.mimetype,
              },
            });

            // Get public URL
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
            imageUrls.push(publicUrl);

            console.log(`✅ Image uploaded: ${fileName}`);
          } catch (uploadErr) {
            console.error(`❌ Image upload error (${i}):`, uploadErr);
            console.error(`   Error message: ${uploadErr.message}`);
            console.error(`   Error code: ${uploadErr.code}`);
            uploadErrors.push(`Image ${i + 1} upload failed: ${uploadErr.message}`);
          }
        }

        if (uploadErrors.length > 0 && imageUrls.length === 0) {
          console.error("❌ All image uploads failed");
          return res.status(400).json({
            error: "Failed to upload images",
            details: uploadErrors,
          });
        }
      }

      // Parse features
      const featuresArray = req.body.features ?
        req.body.features.split(",").map((f) => f.trim()).filter((f) => f) :
        [];

      // Create vehicle document
      const vehicleRef = getDb().collection("vehicles").doc();

      console.log(`💾 Creating Firestore document: ${vehicleRef.id}`);

      await vehicleRef.set({
        userId: uid,
        title,
        description: description || "",
        price: parseFloat(price),
        brand,
        model,
        year: parseInt(year),
        mileage: parseInt(mileage) || 0,
        condition,
        transmission: transmission || "",
        fuelType: fuelType || "",
        engineCapacity: parseInt(engineCapacity) || 0,
        sellerName: sellerName || "",
        phone: phone || "",
        city: city || "",
        images: imageUrls,
        features: featuresArray,
        views: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`✅ Vehicle posted successfully: ${vehicleRef.id}`);

      res.status(201).json({
        success: true,
        vehicleId: vehicleRef.id,
        vehicle: {
          id: vehicleRef.id,
          userId: uid,
          title,
          brand,
          model,
          imagesUploaded: imageUrls.length,
        },
      });
    } catch (error) {
      console.error("❌ Add vehicle error:", error);
      console.error("   Error name:", error.name);
      console.error("   Error message:", error.message);
      console.error("   Error stack:", error.stack);
      res.status(500).json({
        error: error.message,
        details: "An error occurred while posting the vehicle. Check server logs.",
      });
    }
  });

  /**
   * GET /api/vehicles/all
   * Get all approved vehicles
   */
  router.get("/all", async (req, res) => {
    try {
      // eslint-disable-next-line no-unused-vars
      const {limit = 100, offset = 0, brand = "", model = "", minPrice, maxPrice} = req.query;

      let query = getDb().collection("vehicles");

      // Apply filters if provided
      if (brand) {
        query = query.where("brand", "==", brand);
      }

      // Note: Firestore has limitations with multiple range filters
      // For price range, you might need to filter client-side or use Algolia

      query = query
        .orderBy("createdAt", "desc")
        .limit(parseInt(limit));

      const snapshot = await query.get();

      const vehicles = snapshot.docs
        .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

      res.json({
        success: true,
        vehicles,
        total: snapshot.size,
      });
    } catch (error) {
      console.error("Get vehicles error:", error);
      res.status(500).json({error: error.message});
    }
  });

  /**
   * GET /api/vehicles/:id
   * Get single vehicle by ID
   */
  router.get("/:id", async (req, res) => {
    try {
      const {id} = req.params;

      const vehicleDoc = await getDb().collection("vehicles").doc(id).get();

      if (!vehicleDoc.exists) {
        return res.status(404).json({error: "Vehicle not found"});
      }

      // Increment views
      await vehicleDoc.ref.update({
        views: admin.firestore.FieldValue.increment(1),
      });

      res.json({
        success: true,
        vehicle: {
          id: vehicleDoc.id,
          ...vehicleDoc.data(),
        },
      });
    } catch (error) {
      console.error("Get vehicle error:", error);
      res.status(500).json({error: error.message});
    }
  });

  /**
   * PUT /api/vehicles/:id
   * Update vehicle
   */
  router.put("/:id", authenticate, async (req, res) => {
    try {
      const {id} = req.params;
      const uid = req.user.uid;

      const vehicleDoc = await getDb().collection("vehicles").doc(id).get();

      if (!vehicleDoc.exists) {
        return res.status(404).json({error: "Vehicle not found"});
      }

      if (vehicleDoc.data().userId !== uid && req.user.role !== "admin") {
        return res.status(403).json({error: "Not authorized to update"});
      }

      // Validate data if title/brand/etc are being updated
      if (req.body.title || req.body.brand || req.body.model || req.body.price || req.body.year) {
        const errors = validateVehicleData({
          title: req.body.title || vehicleDoc.data().title,
          brand: req.body.brand || vehicleDoc.data().brand,
          model: req.body.model || vehicleDoc.data().model,
          price: req.body.price || vehicleDoc.data().price,
          year: req.body.year || vehicleDoc.data().year,
          condition: req.body.condition || vehicleDoc.data().condition,
        });
        if (errors.length > 0) {
          return res.status(400).json({errors});
        }
      }

      await vehicleDoc.ref.update({
        ...req.body,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.json({success: true, vehicleId: id});
    } catch (error) {
      console.error("Update vehicle error:", error);
      res.status(500).json({error: error.message});
    }
  });

  /**
   * DELETE /api/vehicles/:id
   * Delete vehicle and its images
   */
  router.delete("/:id", authenticate, async (req, res) => {
    try {
      const {id} = req.params;
      const uid = req.user.uid;

      const vehicleDoc = await getDb().collection("vehicles").doc(id).get();

      if (!vehicleDoc.exists) {
        return res.status(404).json({error: "Vehicle not found"});
      }

      if (vehicleDoc.data().userId !== uid && req.user.role !== "admin") {
        return res.status(403).json({error: "Not authorized to delete"});
      }

      // Delete images from storage
      const images = vehicleDoc.data().images || [];
      for (const imageUrl of images) {
        const filePath = extractFilePathFromUrl(imageUrl);
        if (filePath) {
          await bucket.file(filePath).delete().catch(() => {
            console.log(`Failed to delete ${filePath}`);
          });
        }
      }

      await vehicleDoc.ref.delete();

      res.json({success: true, message: "Vehicle deleted"});
    } catch (error) {
      console.error("Delete vehicle error:", error);
      res.status(500).json({error: error.message});
    }
  });

  /**
   * GET /api/vehicles/user/:userId
   * Get vehicles by user
   */
  router.get("/user/:userId", async (req, res) => {
    try {
      const {userId} = req.params;

      const snapshot = await getDb().collection("vehicles")
        .where("userId", "==", userId)
        .orderBy("createdAt", "desc")
        .get();

      const vehicles = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      res.json({success: true, vehicles});
    } catch (error) {
      console.error("Get user vehicles error:", error);
      res.status(500).json({error: error.message});
    }
  });

  /**
   * GET /api/vehicles/search
   * Search vehicles by title, brand, model
   */
  router.get("/search", async (req, res) => {
    try {
      const {q = ""} = req.query;

      if (q.length < 2) {
        return res.json({success: true, vehicles: []});
      }

      // Firestore text search is limited; consider using Algolia
      // For now, fetch all and filter client-side
      const snapshot = await getDb().collection("vehicles")
        .limit(100)
        .get();

      const vehicles = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((v) =>
          v.title.toLowerCase().includes(q.toLowerCase()) ||
          v.brand.toLowerCase().includes(q.toLowerCase()) ||
          v.model.toLowerCase().includes(q.toLowerCase())
        );

      res.json({success: true, vehicles});
    } catch (error) {
      console.error("Search vehicles error:", error);
      res.status(500).json({error: error.message});
    }
  });

  return router;
};
