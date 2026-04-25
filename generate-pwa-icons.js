#!/usr/bin/env node

/**
 * PWA Icon Generator
 * Generates required PWA icons from your logo
 * 
 * Usage: node generate-pwa-icons.js [source-image] [output-dir]
 * Example: node generate-pwa-icons.js Frontend/logo.PNG Frontend/icons
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available (for image processing)
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.error('❌ Error: "sharp" module not found.');
  console.log('\nTo generate icons, install sharp:');
  console.log('  npm install sharp');
  console.log('\nOr use an online tool: https://progressiveapp.design/pwaassetgenerator');
  process.exit(1);
}

const sourceImage = process.argv[2] || 'Frontend/logo.PNG';
const outputDir = process.argv[3] || 'Frontend/icons';

// Icon specifications
const icons = [
  { size: 192, name: 'icon-192.png', purpose: 'any' },
  { size: 192, name: 'icon-192-maskable.png', purpose: 'maskable', padding: 20 },
  { size: 512, name: 'icon-512.png', purpose: 'any' },
  { size: 512, name: 'icon-512-maskable.png', purpose: 'maskable', padding: 50 },
];

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`✓ Created directory: ${outputDir}`);
}

// Check if source image exists
if (!fs.existsSync(sourceImage)) {
  console.error(`❌ Error: Image file not found: ${sourceImage}`);
  process.exit(1);
}

console.log(`📱 Generating PWA icons from: ${sourceImage}\n`);

// Generate icons
(async () => {
  try {
    let successCount = 0;

    for (const icon of icons) {
      const outputPath = path.join(outputDir, icon.name);
      
      try {
        let pipeline = sharp(sourceImage);

        if (icon.purpose === 'maskable') {
          // For maskable icons, add padding and center
          const totalSize = icon.size + icon.padding * 2;
          pipeline = pipeline
            .resize(icon.size - 20, icon.size - 20, {
              fit: 'contain',
              background: { r: 0, g: 0, b: 0, alpha: 0 }
            })
            .extend({
              top: icon.padding,
              bottom: icon.padding,
              left: icon.padding,
              right: icon.padding,
              background: { r: 255, g: 255, b: 255, alpha: 0 }
            });
        } else {
          pipeline = pipeline.resize(icon.size, icon.size, {
            fit: 'cover',
            position: 'center'
          });
        }

        await pipeline.png().toFile(outputPath);
        console.log(`✓ Generated: ${icon.name} (${icon.size}x${icon.size}${icon.purpose === 'maskable' ? ' maskable' : ''})`);
        successCount++;
      } catch (err) {
        console.error(`✗ Failed to generate ${icon.name}: ${err.message}`);
      }
    }

    console.log(`\n✨ Successfully generated ${successCount}/${icons.length} icons!\n`);
    console.log('📍 Icons saved to:', outputDir);
    console.log('\n✅ Your PWA is ready to install!');
    console.log('   - Icons will appear on home screen');
    console.log('   - App will have a native app feel');
    console.log('   - Maskable icons support adaptive design');

  } catch (error) {
    console.error('❌ Error generating icons:', error.message);
    process.exit(1);
  }
})();
