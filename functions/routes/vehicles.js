const express = require("express");
const admin = require("firebase-admin");
const {getFirestore} = require("firebase-admin/firestore");
const {authenticate} = require("../middleware/auth");
const {validateVehicleData} = require("../utils/helpers");

// ✅ Helper to access muthupuralk database using modular SDK
const getDb = () => {
  try {
    return getFirestore("muthupuralk");
  } catch (err) {
    console.error("❌ Database access error:", err.message);
    throw new Error(`Cannot access Firestore database: ${err.message}`);
  }
};

// ✅ Helper to get Firebase Storage bucket
const getStorageBucket = () => {
  try {
    const bucket = admin.storage().bucket();
    console.log(`🔥 Storage bucket initialized:`, bucket.name);
    return bucket;
  } catch (err) {
    console.error("❌ Storage access error:", err.message);
    throw new Error(`Cannot access Firebase Storage: ${err.message}`);
  }
};

// ✅ Helper to extract storage path from URL
const extractPathFromUrl = (url) => {
  try {
    console.log(`📝 Extracting path from URL: ${url.substring(0, 80)}...`);

    // Try multiple URL patterns
    let filePath = null;

    // Pattern 1: URL encoded - /o/path%2Fto%2Ffile
    const match1 = url.match(/\/o\/([^?]+)\?/);
    if (match1 && match1[1]) {
      filePath = decodeURIComponent(match1[1]);
      console.log(`✅ Path extracted (Pattern 1): ${filePath}`);
      return filePath;
    }

    // Pattern 2: Direct path - /o/path/to/file?...
    const match2 = url.match(/\/o\/(.+)/);
    if (match2 && match2[1]) {
      filePath = match2[1].split("?")[0];
      console.log(`✅ Path extracted (Pattern 2): ${filePath}`);
      return filePath;
    }

    console.warn(`⚠️ Could not extract path from URL: ${url}`);
    return null;
  } catch (err) {
    console.error("❌ Error extracting path from URL:", err.message);
    return null;
  }
};

// ✅ Delete images from Firebase Storage
const deleteImagesFromStorage = async (imageUrls) => {
  console.log(`\n📸 deleteImagesFromStorage called with ${imageUrls?.length || 0} URLs`);

  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    console.log(`⏭️ No images to delete`);
    return {deleted: 0, errors: []};
  }

  let bucket;
  try {
    bucket = getStorageBucket();
  } catch (err) {
    console.error("❌ Failed to get storage bucket:", err.message);
    return {deleted: 0, errors: [{error: "Failed to access storage bucket"}]};
  }

  let deletedCount = 0;
  const errors = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    console.log(`\n🔄 Processing image ${i + 1}/${imageUrls.length}`);

    try {
      console.log(`   📍 URL: ${url.substring(0, 100)}...`);

      const filePath = extractPathFromUrl(url);
      if (!filePath) {
        console.warn(`   ⚠️ Could not extract path - skipping`);
        errors.push({url: url.substring(0, 50) + "...", error: "Could not extract path"});
        continue;
      }

      console.log(`   🗑️ Attempting to delete: ${filePath}`);
      const file = bucket.file(filePath);

      // Check if file exists first
      const exists = await file.exists();
      console.log(`   ✔️ File exists check: ${exists[0]}`);

      if (!exists[0]) {
        console.warn(`   ⚠️ File doesn't exist in storage: ${filePath}`);
        continue;
      }

      // Delete the file
      await file.delete();
      console.log(`   ✅ Successfully deleted: ${filePath}`);
      deletedCount++;
    } catch (err) {
      console.error(`   ❌ Error deleting image:`, err.message);
      console.error(`   Full error:`, err);
      errors.push({url: url.substring(0, 50) + "...", error: err.message});
    }
  }

  console.log(`\n📊 Deletion summary: ${deletedCount} deleted, ${errors.length} errors\n`);
  return {deleted: deletedCount, errors};
};

const router = express.Router();

/**
 * POST /api/vehicles/add
 * Add new vehicle with image URLs from Firebase Storage
 *
 * Expected request body (JSON):
 * {
 *   seller_name: string,
 *   phone: string,
 *   city: string,
 *   vehicle_type: string,
 *   condition: string,
 *   make: string,
 *   model: string,
 *   year: string,
 *   price: string,
 *   transmission: string,
 *   fuel_type: string,
 *   engine_capacity: string (optional),
 *   mileage: string,
 *   description: string (optional),
 *   features: string (comma-separated),
 *   images: string[] (Firebase Storage URLs)
 * }
 */
router.post("/add", authenticate, async (req, res) => {
  try {
    console.log("🚀 POST /api/vehicles/add - Request received");
    console.log("👤 User ID:", req.user?.uid);
    console.log("📝 Body keys:", Object.keys(req.body));

    const {
      make,
      model,
      year,
      price,
      condition,
      vehicle_type: vehicleType,
      transmission,
      fuel_type: fuelType,
      mileage,
      description,
      engine_capacity: engineCapacity,
      seller_name: sellerName,
      phone,
      city,
      features: featuresString,
      images: imageUrls
    } = req.body;

    const uid = req.user.uid;

    // ✅ Validate images were provided
    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      console.error("❌ No images provided");
      return res.status(400).json({
        error: "Images required",
        message: "At least one image URL must be provided"
      });
    }

    console.log(`📸 Images provided: ${imageUrls.length}`);
    imageUrls.forEach((url, i) => {
      console.log(`   ${i + 1}. ${url.substring(0, 50)}...`);
    });

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
      vehicleType,
      transmission,
      fuelType,
    });
    if (errors.length > 0) {
      console.log("❌ Validation failed:", errors);
      return res.status(400).json({errors});
    }

    // Parse features
    const featuresArray = featuresString ?
      featuresString.split(",").map((f) => f.trim()).filter((f) => f) :
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
      vehicleType,
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
      message: "Vehicle posted successfully",
      vehicle: {
        id: vehicleRef.id,
        userId: uid,
        title,
        brand,
        model,
        imagesCount: imageUrls.length,
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

    query = query.limit(parseInt(limit) + parseInt(offset));

    const snapshot = await query.get();

    const vehicles = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      // Sort by createdAt descending (newest first)
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      })
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit));

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
 * Delete vehicle AND all associated images from Firebase Storage
 */
router.delete("/:id", authenticate, async (req, res) => {
  try {
    const {id} = req.params;
    const uid = req.user.uid;

    console.log(`\n${"=".repeat(60)}`);
    console.log(`🗑️ DELETE REQUEST - Vehicle ID: ${id}`);
    console.log(`👤 User ID: ${uid}`);
    console.log(`${"=".repeat(60)}\n`);

    const vehicleDoc = await getDb().collection("vehicles").doc(id).get();

    if (!vehicleDoc.exists) {
      console.log(`❌ Vehicle not found: ${id}`);
      return res.status(404).json({error: "Vehicle not found"});
    }

    const vehicleData = vehicleDoc.data();
    console.log(`📋 Vehicle found:`, {
      title: vehicleData.title,
      userId: vehicleData.userId,
      images: vehicleData.images?.length || 0
    });

    if (vehicleData.userId !== uid && req.user.role !== "admin") {
      console.log(`❌ Not authorized to delete - userId mismatch`);
      return res.status(403).json({error: "Not authorized to delete"});
    }

    // 🎯 STEP 1: Log image URLs
    if (vehicleData.images && vehicleData.images.length > 0) {
      console.log(`\n📸 IMAGES TO DELETE (${vehicleData.images.length} total):`);
      vehicleData.images.forEach((url, idx) => {
        console.log(`   ${idx + 1}. ${url.substring(0, 100)}...`);
      });
    }

    // 🎯 STEP 2: Delete images from Firebase Storage
    console.log(`\n🔄 STEP 1: Deleting ${vehicleData.images?.length || 0} images from Firebase Storage...`);
    const deleteResult = await deleteImagesFromStorage(vehicleData.images || []);
    console.log(`✅ Storage deletion complete:`, {
      deleted: deleteResult.deleted,
      failed: deleteResult.errors.length
    });

    if (deleteResult.errors.length > 0) {
      console.warn(`⚠️ Some images failed to delete:`, deleteResult.errors);
    }

    // 🎯 STEP 3: Delete vehicle document from Firestore
    console.log(`\n🔄 STEP 2: Deleting vehicle document from Firestore...`);
    await vehicleDoc.ref.delete();
    console.log(`✅ Vehicle document deleted`);

    console.log(`\n✅ COMPLETE: Vehicle and ${deleteResult.deleted} images deleted successfully`);
    console.log(`${"=".repeat(60)}\n`);

    res.json({
      success: true,
      message: "Vehicle and images deleted successfully",
      imagesDeleted: deleteResult.deleted,
      imageErrors: deleteResult.errors.length,
      imageErrorDetails: deleteResult.errors
    });
  } catch (error) {
    console.error("❌ Delete vehicle error:", error);
    console.error("Full error object:", error);
    res.status(500).json({error: error.message});
  }
});

/**
 * GET /api/vehicles/user/:userId
 * Get vehicles by user (sorted by createdAt descending)
 */
router.get("/user/:userId", async (req, res) => {
  try {
    const {userId} = req.params;

    // Query without orderBy to avoid requiring a composite index
    // Sort in JavaScript instead (more efficient for small datasets)
    const snapshot = await getDb().collection("vehicles")
      .where("userId", "==", userId)
      .get();

    const vehicles = snapshot.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      // Sort by createdAt descending (newest first)
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
        return dateB - dateA;
      });

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

module.exports = router;
