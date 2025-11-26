import sharp from 'sharp';
import pngToIco from 'png-to-ico';
import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const staticDir = join(rootDir, 'static');
const iconSvg = join(staticDir, 'icon.svg');
const iconIco = join(staticDir, 'icon.ico');

async function generateIco() {
  try {
    console.log('Generating .ico from', iconSvg);
    const svgBuffer = readFileSync(iconSvg);

    // Resize to 256x256 PNG buffer
    const pngBuffer = await sharp(svgBuffer)
      .resize(256, 256, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toBuffer();

    // Convert to .ico
    const icoBuffer = await pngToIco(pngBuffer);
    writeFileSync(iconIco, icoBuffer);

    console.log('✅ Generated', iconIco);
  } catch (error) {
    console.error('❌ Error generating .ico:', error);
    process.exit(1);
  }
}

generateIco();
