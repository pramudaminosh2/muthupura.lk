/**
 * Extract file path from Firebase Storage URL
 */
function extractFilePathFromUrl(imageUrl) {
  try {
    if (!imageUrl || typeof imageUrl !== "string") {
      return null;
    }

    // NEW LOGIC: Handle Google Cloud Storage URLs
    // Format: https://storage.googleapis.com/muthupuralk.firebasestorage.app/vehicles/filename.jpg
    const bucketPrefix = "https://storage.googleapis.com/muthupuralk.firebasestorage.app/";

    if (imageUrl.startsWith(bucketPrefix)) {
      const filePath = imageUrl.substring(bucketPrefix.length);
      return decodeURIComponent(filePath);
    }

    // Fallback: Try old Firebase /o/ format for backward compatibility
    const urlObj = new URL(imageUrl);
    const pathname = urlObj.pathname;

    // Extract path after /o/ and before any query parameters
    const filePathMatch = pathname.match(/\/o\/(.+)$/);
    if (filePathMatch && filePathMatch[1]) {
      return decodeURIComponent(filePathMatch[1]);
    }

    // Fallback: regex method for problematic URLs
    const regexMatch = imageUrl.match(/\/o\/([^?]+)/);
    if (regexMatch && regexMatch[1]) {
      return decodeURIComponent(regexMatch[1]);
    }

    return null;
  } catch (error) {
    console.warn("Error extracting file path from URL:", error.message);
    return null;
  }
}

/**
 * Validate vehicle data
 */
function validateVehicleData(data) {
  const errors = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push("Title is required");
  }

  if (!data.brand || data.brand.trim().length === 0) {
    errors.push("Brand is required");
  }

  if (!data.model || data.model.trim().length === 0) {
    errors.push("Model is required");
  }

  if (!data.price || isNaN(parseFloat(data.price)) || parseFloat(data.price) <= 0) {
    errors.push("Valid price is required");
  }

  if (!data.year || isNaN(parseInt(data.year)) || parseInt(data.year) < 1900) {
    errors.push("Valid year is required");
  }

  if (!data.condition || !["new", "used"].includes(data.condition)) {
    errors.push("Condition must be 'new' or 'used'");
  }

  return errors;
}

/**
 * Validate user registration data
 */
function validateRegistration(data) {
  const errors = [];

  if (!data.email || !data.email.includes("@")) {
    errors.push("Valid email is required");
  }

  if (!data.password || data.password.length < 8) {
    errors.push("Password must be at least 8 characters");
  }

  if (!data.name || data.name.trim().length === 0) {
    errors.push("Name is required");
  }

  return errors;
}

module.exports = {
  extractFilePathFromUrl,
  validateVehicleData,
  validateRegistration,
};
