import dotenv from 'dotenv';
import path from 'path';

// Load environment variables with explicit path
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

console.log('\n🔍 CLOUDINARY CONFIGURATION CHECK\n');
console.log('================================\n');

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('Cloud Name:');
console.log(`  Raw value: ${JSON.stringify(cloudName)}`);
console.log(`  Length: ${cloudName?.length || 0}`);
console.log(`  Has quotes: ${cloudName?.startsWith('"') || cloudName?.endsWith('"')}`);
console.log('');

console.log('API Key:');
console.log(`  Raw value: ${JSON.stringify(apiKey)}`);
console.log(`  Length: ${apiKey?.length || 0}`);
console.log(`  Has quotes: ${apiKey?.startsWith('"') || apiKey?.endsWith('"')}`);
console.log('');

console.log('API Secret:');
console.log(`  Raw value: ${JSON.stringify(apiSecret)}`);
console.log(`  Length: ${apiSecret?.length || 0}`);
console.log(`  Has quotes: ${apiSecret?.startsWith('"') || apiSecret?.endsWith('"')}`);
console.log('');

console.log('================================\n');

if (!cloudName || !apiKey || !apiSecret) {
  console.log('❌ MISSING VALUES!');
  console.log('   One or more Cloudinary values are undefined.\n');
} else if (cloudName.startsWith('"') || apiKey.startsWith('"') || apiSecret.startsWith('"')) {
  console.log('❌ QUOTES DETECTED!');
  console.log('   Your .env file still has quotes around the values.');
  console.log('   Please remove them and restart the server.\n');
  console.log('   Example:');
  console.log('   ❌ CLOUDINARY_API_KEY="378168273153864"');
  console.log('   ✅ CLOUDINARY_API_KEY=378168273153864\n');
} else {
  console.log('✅ CONFIGURATION LOOKS GOOD!');
  console.log('   All values are present and have no quotes.\n');
  console.log('   Expected values:');
  console.log(`   Cloud Name: dkcui067d (actual: ${cloudName})`);
  console.log(`   API Key: 378168273153864 (actual: ${apiKey})`);
  console.log(`   API Secret: WVD6FI43h62qKFjCFKxUAYEL4XE (actual: ${apiSecret?.substring(0, 5)}...)\n`);
}
