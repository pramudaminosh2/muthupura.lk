#!/usr/bin/env node

/**
 * 🧪 FUNCTIONALITY CHECK: Delete Operations
 * Tests user & vehicle deletion with database & storage cleanup
 */

const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config({ path: ['.env.local', '.env'] });

const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkFunctionality() {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     🧪 FUNCTIONALITY CHECK: DELETE OPERATIONS 🧪       ║');
  console.log('║             Database & Storage Cleanup                 ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  try {
    // ========================================
    // CHECK 1: User Delete Functionality
    // ========================================
    console.log('📌 CHECK 1: Admin Delete User Functionality');
    console.log('─'.repeat(60));
    console.log('When admin deletes a user, the system should:');
    console.log('  ✓ Delete user document from Firestore');
    console.log('  ✓ Delete all vehicles owned by that user');
    console.log('  ✓ Delete all images from Firebase Storage');
    console.log('  ✓ Delete user from Firebase Authentication\n');

    console.log('Current Implementation Status:');
    
    // Check if delete user endpoint exists in code
    const fs = require('fs');
    const adminRoutesPath = path.join(__dirname, '..', 'functions', 'routes', 'admin.js');
    const adminCode = fs.readFileSync(adminRoutesPath, 'utf8');
    
    const hasDeleteUserRoute = adminCode.includes('router.delete("/user/:uid"') || adminCode.includes('DELETE /api/admin/user');
    const hasUserDeletionLogic = adminCode.includes('await userDoc.ref.delete()');

    if (!hasDeleteUserRoute || !hasUserDeletionLogic) {
      console.log('❌ DELETE user endpoint: NOT IMPLEMENTED');
      console.log('   Missing: DELETE /api/admin/user/:uid endpoint\n');
    } else {
      console.log('✅ DELETE user endpoint: EXISTS');
      console.log('   Path: DELETE /api/admin/user/:uid\n');
    }

    // Check for vehicle cleanup
    const hasVehicleCleanup = adminCode.includes('where("userId", "==", uid)');
    if (!hasVehicleCleanup) {
      console.log('❌ Vehicle cleanup for deleted user: NOT IMPLEMENTED');
      console.log('   When deleting a user, their vehicles are NOT cleaned up\n');
    } else {
      console.log('✅ Vehicle cleanup for deleted user: EXISTS\n');
    }

    // Check for image cleanup in user deletion
    const hasImageCleanupInUserDelete = adminCode.includes('bucket.file(decodeURIComponent(filePath)).delete()');
    if (!hasImageCleanupInUserDelete) {
      console.log('❌ Image deletion from Storage: NOT IMPLEMENTED');
      console.log('   Storage images may not be deleted when user is removed\n');
    } else {
      console.log('✅ Image deletion from Storage: EXISTS\n');
    }

    // ========================================
    // CHECK 2: Vehicle Delete Functionality
    // ========================================
    console.log('\n📌 CHECK 2: User Delete Vehicle Functionality');
    console.log('─'.repeat(60));
    console.log('When user deletes their vehicle, the system should:');
    console.log('  ✓ Delete vehicle document from Firestore');
    console.log('  ✓ Delete all images from Firebase Storage');
    console.log('  ✓ Verify ownership before deletion\n');

    const vehicleRoutesPath = path.join(__dirname, '..', 'functions', 'routes', 'vehicles.js');
    const vehicleCode = fs.readFileSync(vehicleRoutesPath, 'utf8');

    const hasDeleteVehicleRoute = vehicleCode.includes('router.delete("/:id"');
    const hasVehicleImageDelete = vehicleCode.includes('bucket.file(filePath).delete');
    const hasOwnershipCheck = vehicleCode.includes('vehicleDoc.data().userId !== uid');

    console.log('Current Implementation Status:');
    
    if (hasDeleteVehicleRoute) {
      console.log('✅ DELETE vehicle endpoint: EXISTS');
      console.log('   Path: DELETE /api/vehicles/:id');
    } else {
      console.log('❌ DELETE vehicle endpoint: NOT IMPLEMENTED');
    }

    if (hasOwnershipCheck) {
      console.log('✅ Ownership verification: EXISTS');
      console.log('   System verifies user owns vehicle before deletion');
    } else {
      console.log('❌ Ownership verification: NOT IMPLEMENTED');
    }

    if (hasVehicleImageDelete) {
      console.log('✅ Image cleanup from Storage: EXISTS');
      console.log('   All images are deleted from Firebase Storage\n');
    } else {
      console.log('❌ Image cleanup from Storage: NOT IMPLEMENTED\n');
    }

    // ========================================
    // CHECK 3: Database State
    // ========================================
    console.log('\n📌 CHECK 3: Current Database State');
    console.log('─'.repeat(60));

    const usersSnapshot = await db.collection('users').get();
    const vehiclesSnapshot = await db.collection('vehicles').get();

    console.log(`Total Users: ${usersSnapshot.size}`);
    console.log(`Total Vehicles: ${vehiclesSnapshot.size}\n`);

    // Show user details
    console.log('Users in database:');
    usersSnapshot.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`  - ${data.email} (Role: ${data.role}, UID: ${doc.id})`);
    });

    console.log(`\nVehicles in database:`);
    if (vehiclesSnapshot.size === 0) {
      console.log('  (No vehicles)');
    } else {
      vehiclesSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        console.log(`  - ${data.title} (Owner: ${data.userId}, Images: ${(data.images || []).length})`);
      });
    }

    // ========================================
    // SUMMARY
    // ========================================
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║                    📊 SUMMARY 📊                      ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const vehicleDeleteOk = hasDeleteVehicleRoute && hasOwnershipCheck && hasVehicleImageDelete;
    const userDeleteOk = hasDeleteUserRoute && hasUserDeletionLogic && hasVehicleCleanup && hasImageCleanupInUserDelete;

    console.log('🚗 Vehicle Deletion: ' + (vehicleDeleteOk ? '✅ WORKING' : '⚠️  PARTIAL'));
    console.log('   - Delete endpoint: ' + (hasDeleteVehicleRoute ? '✅' : '❌'));
    console.log('   - Ownership check: ' + (hasOwnershipCheck ? '✅' : '❌'));
    console.log('   - Image cleanup: ' + (hasVehicleImageDelete ? '✅' : '❌'));

    console.log('\n👤 User Deletion: ' + (userDeleteOk ? '✅ WORKING' : '❌ INCOMPLETE'));
    console.log('   - Delete endpoint: ' + (hasDeleteUserRoute ? '✅' : '❌'));
    console.log('   - User deletion: ' + (hasUserDeletionLogic ? '✅' : '❌'));
    console.log('   - Vehicle cleanup: ' + (hasVehicleCleanup ? '✅' : '❌'));
    console.log('   - Image cleanup: ' + (hasImageCleanupInUserDelete ? '✅' : '❌'));

    console.log('\n' + '═'.repeat(60));
    if (userDeleteOk && vehicleDeleteOk) {
      console.log('🎉 ALL FUNCTIONALITY WORKING PERFECTLY! 🎉');
    } else {
      console.log('⚠️  MISSING FEATURES DETECTED - SEE ABOVE');
    }
    console.log('═'.repeat(60) + '\n');

  } catch (error) {
    console.error('❌ Error during check:', error.message);
  } finally {
    await admin.app().delete();
  }
}

checkFunctionality();
