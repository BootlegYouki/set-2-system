import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const staticDir = join(rootDir, 'static');
const iconSvg = join(staticDir, 'icon.svg');

const sizes = [192, 512];

async function generateIcons() {
	try {
		const svgBuffer = readFileSync(iconSvg);
		
		for (const size of sizes) {
			const outputPath = join(staticDir, `pwa-${size}x${size}.png`);
			await sharp(svgBuffer)
				.resize(size, size, {
					background: { r: 255, g: 255, b: 255, alpha: 1 }
				})
				.png()
				.toFile(outputPath);
			console.log(`✓ Generated ${outputPath}`);
		}
		
		console.log('\n✅ PWA icons generated successfully!');
	} catch (error) {
		console.error('❌ Error generating icons:', error);
		process.exit(1);
	}
}

generateIcons();

