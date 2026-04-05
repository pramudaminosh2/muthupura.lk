const admin = require('firebase-admin');
const path = require('path');

// Use service account key file instead of environment variables
const serviceAccount = require(path.join(__dirname, 'serviceAccountKey.json'));
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'muthupuralk.firebasestorage.app';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket,
  });
}

const bucket = admin.storage().bucket();
console.log(`🔥 Firebase Storage bucket initialized: ${storageBucket}`);
module.exports = bucket;