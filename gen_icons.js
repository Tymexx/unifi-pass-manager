const fs = require('fs');
const path = require('path');
const { createCanvas, Image } = require('canvas');

const publicDir = process.argv[2];
const svgPath = path.join(publicDir, 'bastion-icon-filled.svg');

const svgContent = fs.readFileSync(svgPath, 'utf8');

const sizes = [
  { name: 'favicon-16.png', size: 16 },
  { name: 'favicon-32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 }
];

sizes.forEach(({ name, size }) => {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');
  
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, size, size);
    const outPath = path.join(publicDir, name);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outPath, buffer);
    console.log(`Created ${name} (${size}x${size})`);
  };
  img.onerror = err => { throw err; };
  img.src = Buffer.from(svgContent, 'utf8');
});
