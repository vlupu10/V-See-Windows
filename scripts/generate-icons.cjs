// Author: Viorel LUPU
// Date: 2026-02-17
// Purpose: Generate valid placeholder icons for Tauri Windows build (RC-compatible ICO)

const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pngToIco = require('png-to-ico').default || require('png-to-ico');

const iconsDir = path.join(__dirname, '..', 'src-tauri', 'icons');
if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

function bufferFromStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);
  });
}

async function main() {
  // Create a 32x32 PNG (solid color) - Windows RC expects a proper multi-size or 32x32 ICO
  const size = 32;
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (size * y + x) << 2;
      png.data[i] = 0x40;
      png.data[i + 1] = 0x60;
      png.data[i + 2] = 0xa0;
      png.data[i + 3] = 255;
    }
  }
  const pngBuffer = await bufferFromStream(png.pack());
  const icoBuffer = await pngToIco(pngBuffer);
  fs.writeFileSync(path.join(iconsDir, 'icon.ico'), icoBuffer);
  console.log('Created src-tauri/icons/icon.ico (32x32, RC-compatible)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
