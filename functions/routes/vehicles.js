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
 * Delete vehicle (images remain in Firebase Storage)
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

    // Note: Images remain in Firebase Storage (can be cleaned up by Cloud Storage lifecycle)
    await vehicleDoc.ref.delete();

    res.json({success: true, message: "Vehicle deleted"});
  } catch (error) {
    console.error("Delete vehicle error:", error);
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
