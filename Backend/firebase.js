const admin = require('firebase-admin');

// Load the service account key
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'muthupuralk.appspot.com'
});

const bucket = admin.storage().bucket();
module.exports = bucket;