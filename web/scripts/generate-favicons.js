const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function main() {
  const svgPath = path.join(__dirname, '..', 'public', 'favicon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  // Generate PNG sizes
  const sizes = [16, 32, 48, 180, 192, 512];
  const pngBuffers = {};

  for (const size of sizes) {
    const buf = await sharp(svgBuffer, { density: 300 })
      .resize(size, size)
      .png()
      .toBuffer();
    pngBuffers[size] = buf;
  }

  // Write Apple Touch Icon and PWA Icons
  const publicDir = path.join(__dirname, '..', 'public');
  const appDir = path.join(__dirname, '..', 'src', 'app');

  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngBuffers[180]);
  fs.writeFileSync(path.join(appDir, 'apple-icon.png'), pngBuffers[180]);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), pngBuffers[192]);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), pngBuffers[512]);

  console.log('PNG icons written successfully.');

  // Build standard multi-resolution .ico file (16x16, 32x32, 48x48)
  const icoSizes = [16, 32, 48];
  const count = icoSizes.length;
  
  // Header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type = 1 (Icon)
  header.writeUInt16LE(count, 4); // Number of images

  // Directory entries: 16 bytes per image
  let currentOffset = 6 + (16 * count);
  const dirEntries = [];
  const imageBuffers = [];

  for (const s of icoSizes) {
    const imgData = pngBuffers[s];
    const entry = Buffer.alloc(16);
    entry.writeUInt8(s === 256 ? 0 : s, 0); // Width
    entry.writeUInt8(s === 256 ? 0 : s, 1); // Height
    entry.writeUInt8(0, 2); // Color count
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(imgData.length, 8); // Size of image data
    entry.writeUInt32LE(currentOffset, 12); // Offset
    
    dirEntries.push(entry);
    imageBuffers.push(imgData);
    currentOffset += imgData.length;
  }

  const icoBuffer = Buffer.concat([header, ...dirEntries, ...imageBuffers]);

  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  fs.writeFileSync(path.join(appDir, 'favicon.ico'), icoBuffer);

  console.log('PostMatic favicon.ico generated and placed in public/ and src/app/! Size:', icoBuffer.length, 'bytes');
}

main().catch(err => {
  console.error('Error generating favicons:', err);
  process.exit(1);
});
