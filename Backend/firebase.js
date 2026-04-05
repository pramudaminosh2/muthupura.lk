const admin = require('firebase-admin');

// Use environment variables for Firebase Admin credentials
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'muthupuralk.firebasestorage.app';

// Validate required environment variables
if (!projectId || !clientEmail || !privateKey) {
  throw new Error('Firebase Admin requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.');
}

// Handle private key formatting (replace escaped newlines)
const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId,
      clientEmail,
      privateKey: formattedPrivateKey,
    }),
    storageBucket,
  });
}

const bucket = admin.storage().bucket();
console.log(`🔥 Firebase Admin initialized successfully - Storage bucket: ${storageBucket}`);
module.exports = bucket;