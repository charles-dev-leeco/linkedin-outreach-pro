// Simple script to create placeholder icons
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const iconsDir = path.join(__dirname, 'dist/icons');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create simple SVG icons and save as PNG equivalent data
sizes.forEach(size => {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#0a66c2"/>
  <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="${size/3}" font-family="Arial, sans-serif" font-weight="bold">LI</text>
</svg>`;
  
  fs.writeFileSync(path.join(iconsDir, `icon${size}.svg`), svg);
  console.log(`Created icon${size}.svg`);
});

console.log('\n✅ Icon placeholders created!');
console.log('Note: For production, replace these with proper PNG icons.');
