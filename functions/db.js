/**
 * Firestore Database Instance - CRITICAL FIX
 * Cloud Functions issue: admin.firestore({databaseId}) doesn't work reliably
 * Solution: Use the routes to access firestore directly in Cloud Functions context
 */

const admin = require("firebase-admin");

/**
 * Get Firestore instance for muthupuralk database
 * This function is kept for backward compatibility but routes should use
 * inline firestore calls instead for Cloud Functions reliability
 * @return {Object} Firestore database instance
 */
function getDatabase() {
  // In Cloud Functions, use this direct approach:
  // admin.firestore({databaseId: "muthupuralk"})
  // If it fails, the route handlers will catch the error
  return admin.firestore({databaseId: "muthupuralk"});
}

module.exports = getDatabase;


