#!/usr/bin/env node

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Read the SVG file
const svgPath = path.join(__dirname, '..', 'brand', 'logo-black.svg');
const outputPath = path.join(__dirname, '..', 'brand', 'logo-black.png');

// Check if SVG exists
if (!fs.existsSync(svgPath)) {
  console.error('SVG file not found:', svgPath);
  process.exit(1);
}

// Use sharp to convert SVG to PNG with white background
(async () => {
  try {
    // Read the SVG content and get its buffer
    const svgBuffer = fs.readFileSync(svgPath);
    
    // Create white background
    const whiteBackground = sharp({
      create: {
        width: 180,
        height: 60,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 0 } // Transparent
      }
    });
    
    // Overlay the SVG onto the background
    await sharp(svgBuffer)
      .resize(180, 60, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(outputPath);
    
    console.log('Logo created successfully:', outputPath);
    console.log('Size: 180x60px');
  } catch (error) {
    console.error('Error creating logo:', error.message);
    process.exit(1);
  }
})();