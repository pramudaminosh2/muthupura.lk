/**
 * Set IAM Permissions for Cloud Function
 * Makes the API publicly accessible
 */

const {exec} = require('child_process');
const {promisify} = require('util');

const execPromise = promisify(exec);

async function setIAMPermissions() {
  try {
    console.log('🔐 Setting IAM Permissions for Cloud Function...\n');
    
    const project = 'muthupuralk';
    const region = 'us-central1';
    const functionName = 'api';
    
    // Set members to allUsers with invoker role
    const command = `gcloud functions add-iam-policy-binding ${functionName} \
      --region=${region} \
      --member="allUsers" \
      --role="roles/cloudfunctions.invoker" \
      --project=${project}`;
    
    console.log('Running command...\n');
    const {stdout, stderr} = await execPromise(command);
    
    if (stderr) {
      console.log('⚠️  Output:\n', stderr);
    }
    
    console.log('✅ Output:\n', stdout);
    console.log('\n✅ IAM Permissions set successfully!');
    console.log('🌍 API is now publicly accessible!\n');
    
  } catch (error) {
    console.error('❌ Error setting IAM permissions:', error.message);
    console.log('\n📖 Manual Fix:');
    console.log('1. Open: https://console.firebase.google.com/project/muthupuralk/functions');
    console.log('2. Click function "api" → Click "Permissions" tab');
    console.log('3. Click "Grant Access"');
    console.log('4. Add "allUsers" with role "Cloud Functions Invoker"');
    console.log('5. Click Save\n');
  }
}

// Run it
setIAMPermissions();
