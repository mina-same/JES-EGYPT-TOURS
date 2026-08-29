/**
 * Swap the site-wide image placeholder in one safe step.
 *
 * The target path is referenced by TWO constants — TOUR_IMAGE_PLACEHOLDER
 * (client/src/lib/images/placeholders.ts) and SEED_IMAGE_PLACEHOLDER
 * (server/src/seeds/seedImages.ts) — so the filename is deliberately kept
 * stable: replacing the bytes changes every placeholder on the site without
 * touching a line of code.
 *
 * Because the URL does not change, Next's image optimizer would happily keep
 * serving the OLD optimized variants out of .next/cache/images. Clearing that
 * cache is part of the swap, not an afterthought.
 *
 *   node scripts/replaceTourPlaceholder.mjs <source-image> [--dry] [--target <path>]
 */
import { promises as fs } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const argv = process.argv.slice(2);
const dry = argv.includes('--dry');
const tIdx = argv.indexOf('--target');
const src = argv.find((a, i) => !a.startsWith('--') && !(tIdx !== -1 && i === tIdx + 1));
const target = tIdx !== -1 ? argv[tIdx + 1] : 'public/images/resources/tour-placeholder.png';
const cacheDir = '.next/cache/images';

if (!src) { console.error('usage: node scripts/replaceTourPlaceholder.mjs <source-image> [--dry]'); process.exit(1); }

const kb = n => `${(n / 1024).toFixed(1)} KB`;

const before = await fs.stat(target).then(s => s.size).catch(() => null);
const beforeMeta = before ? await sharp(target).metadata() : null;

const input = await fs.readFile(src);
const meta = await sharp(input).metadata();
console.log(`source : ${src}`);
console.log(`         ${meta.format} ${meta.width}x${meta.height} ${kb(input.length)}${meta.hasAlpha ? ' (alpha)' : ''}`);
if (beforeMeta) console.log(`current: ${beforeMeta.format} ${beforeMeta.width}x${beforeMeta.height} ${kb(before)}`);

// Always emit PNG at the target path, whatever came in — the extension in the
// two constants is `.png`, and a JPEG's bytes under a .png name would be served
// with the wrong Content-Type.
let pipeline = sharp(input);
if (meta.width > 1600) { pipeline = pipeline.resize({ width: 1600, withoutEnlargement: true }); console.log('note   : downscaled to 1600px wide (placeholder never renders larger)'); }
// Palette PNG (256 colours) is dramatically smaller for flat artwork and
// dramatically WRONG for a photograph or a gradient. Rather than guess from
// the file type, encode both and measure the actual pixel error: keep the
// small one only when the eye could not tell the difference.
const base = pipeline.clone();
const [full, paletted] = await Promise.all([
  base.clone().png({ compressionLevel: 9 }).toBuffer(),
  base.clone().png({ compressionLevel: 9, palette: true }).toBuffer(),
]);
const raw = b => sharp(b).raw().toBuffer({ resolveWithObject: true });
const [a, b2] = await Promise.all([raw(full), raw(paletted)]);
let maxErr = 0;
if (a.data.length === b2.data.length) {
  for (let i = 0; i < a.data.length; i++) {
    const d = Math.abs(a.data[i] - b2.data[i]);
    if (d > maxErr) maxErr = d;
  }
} else { maxErr = 255; }
const usePalette = maxErr <= 2 && paletted.length < full.length;
console.log(`encode : full ${kb(full.length)} | palette ${kb(paletted.length)} (max pixel error ${maxErr}) -> ${usePalette ? 'palette' : 'full colour'}`);
const out = usePalette ? paletted : full;
const outMeta = await sharp(out).metadata();
console.log(`result : png ${outMeta.width}x${outMeta.height} ${kb(out.length)}`);

if (dry) { console.log('\n--dry: nothing written.'); process.exit(0); }

const backup = `${target}.bak`;
if (before !== null) { await fs.copyFile(target, backup); console.log(`backup : ${backup}`); }
await fs.writeFile(target, out);
console.log(`written: ${target}`);

const cleared = await fs.rm(cacheDir, { recursive: true, force: true }).then(() => true).catch(() => false);
console.log(`cache  : ${cleared ? `cleared ${cacheDir}` : `could not clear ${cacheDir}`}`);
console.log('\nDone. Restart `next start` (or hard-refresh in dev) to see it.');
