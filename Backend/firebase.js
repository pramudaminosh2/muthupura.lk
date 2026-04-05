const admin = require('firebase-admin');

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET || 'muthupuralk.firebasestorage.app';

if (!projectId || !clientEmail || !privateKey) {
  throw new Error('Firebase Admin requires FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.');
}

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
console.log(`🔥 Firebase Storage bucket initialized: ${storageBucket}`);
module.exports = bucket;