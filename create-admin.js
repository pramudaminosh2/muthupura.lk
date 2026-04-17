#!/usr/bin/env node

const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: [path.join(__dirname, 'Backend', '.env.local'), path.join(__dirname, 'Backend', '.env')] });

// Initialize Firebase Admin
const serviceAccountPath = path.join(__dirname, 'Backend', 'service-account.json');
const serviceAccount = require(serviceAccountPath);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const auth = admin.auth();

async function createAdminAccount(email, password, name = 'Admin User', phone = '+94701234567') {
  try {
    console.log('🔐 Creating Admin Account...\n');

    // Step 1: Hash the password
    console.log('1️⃣  Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('   ✅ Password hashed\n');

    // Step 2: Create user in Firestore
    console.log('2️⃣  Creating user in Firestore...');
    const uid = `admin-${Date.now()}`;
    
    const userDoc = {
      uid,
      email,
      password: hashedPassword,
      name,
      phone,
      role: 'admin',
      verified: true,
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now(),
      avatar: null,
      bio: null,
    };

    await db.collection('users').doc(uid).set(userDoc);
    console.log('   ✅ User created in Firestore\n');

    // Step 3: Create user in Firebase Auth (optional - for authentication)
    console.log('3️⃣  Creating user in Firebase Authentication...');
    try {
      await auth.createUser({
        uid,
        email,
        password,
        displayName: name,
      });
      console.log('   ✅ User created in Firebase Auth\n');
    } catch (authError) {
      if (authError.code === 'auth/email-already-exists') {
        console.log('   ⚠️  User already exists in Firebase Auth (OK)\n');
      } else {
        throw authError;
      }
    }

    // Step 4: Display success message
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║          ✅ ADMIN ACCOUNT CREATED SUCCESSFULLY! ✅      ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('📋 Admin Account Details:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   UID:      ${uid}`);
    console.log(`   Role:     admin`);
    console.log(`   Status:   Verified ✅\n`);

    console.log('🔗 Login at: https://muthupuralk.web.app');
    console.log('✨ All admin features now available!\n');

    return userDoc;
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message);
    throw error;
  } finally {
    await admin.app().delete();
  }
}

// Run
const email = 'admin@muthupura.lk';
const password = 'muthupuraadmin123';

createAdminAccount(email, password, 'Muthupura Admin', '+94701234567')
  .then(() => {
    console.log('🎉 Done! You can now login as admin.\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
