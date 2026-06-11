/**
 * Favicon Generator
 *
 * Generates a complete favicon collection from a single source SVG.
 *
 * Usage:
 *   node scripts/generate-favicons.mjs [source.svg]
 *
 * Source defaults to: public/favicon.svg
 * Output goes to:     public/favicon/
 *
 * Dependencies (install once):
 *   npm install --save-dev sharp png-to-ico
 */

import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

// --- Config -----------------------------------------------------------

const SOURCE_SVG = resolve(ROOT, process.argv[2] ?? "public/favicon.svg");
const OUTPUT_DIR = resolve(ROOT, "public/favicon");

const SITE_NAME = "Sidequest Plugins";
const THEME_COLOR = "#09090B";
const BG_COLOR = "#09090B";

// Files to generate
const PNG_SIZES = [
  { name: "favicon-96x96.png", size: 96 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "web-app-manifest-192x192.png", size: 192 },
  { name: "web-app-manifest-512x512.png", size: 512 },
];

// Sizes bundled into favicon.ico (classic multi-size ICO)
const ICO_SIZES = [16, 32, 48];

// --- Helpers ----------------------------------------------------------

function log(msg) {
  console.log(`  ${msg}`);
}

async function loadDep(name) {
  try {
    return await import(name);
  } catch {
    console.error(`\nMissing dependency: ${name}`);
    console.error(`Run: npm install --save-dev sharp png-to-ico\n`);
    process.exit(1);
  }
}

// --- Main -------------------------------------------------------------

async function main() {
  const { default: sharp } = await loadDep("sharp");
  const { default: pngToIco } = await loadDep("png-to-ico");

  console.log(`\nFavicon Generator`);
  console.log(`Source: ${SOURCE_SVG}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1. Copy SVG as-is (SVG favicon — best modern browser support)
  copyFileSync(SOURCE_SVG, resolve(OUTPUT_DIR, "favicon.svg"));
  log("favicon.svg          → copied");

  // 2. Generate PNG sizes
  for (const { name, size } of PNG_SIZES) {
    await sharp(SOURCE_SVG)
      .resize(size, size)
      .png()
      .toFile(resolve(OUTPUT_DIR, name));
    log(`${name.padEnd(28)} → ${size}×${size}px`);
  }

  // 3. Generate favicon.ico (multi-size: 16, 32, 48)
  const icoPngBuffers = await Promise.all(
    ICO_SIZES.map((size) =>
      sharp(SOURCE_SVG).resize(size, size).png().toBuffer()
    )
  );
  const icoBuffer = await pngToIco(icoPngBuffers);
  writeFileSync(resolve(OUTPUT_DIR, "favicon.ico"), icoBuffer);
  log(`favicon.ico          → ${ICO_SIZES.join(", ")}px (multi-size)`);

  // 4. Write site.webmanifest
  const manifest = {
    name: SITE_NAME,
    short_name: SITE_NAME,
    icons: [
      {
        src: "/favicon/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/favicon/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    theme_color: THEME_COLOR,
    background_color: BG_COLOR,
    display: "standalone",
    start_url: "/",
  };
  writeFileSync(
    resolve(OUTPUT_DIR, "site.webmanifest"),
    JSON.stringify(manifest, null, 2) + "\n"
  );
  log("site.webmanifest     → updated");

  console.log(`\nDone. Add these tags to your <head> if not already present:\n`);
  console.log(`  <link rel="icon" href="/favicon/favicon.ico" sizes="48x48" />`);
  console.log(`  <link rel="icon" href="/favicon/favicon.svg" type="image/svg+xml" />`);
  console.log(`  <link rel="icon" href="/favicon/favicon-96x96.png" sizes="96x96" type="image/png" />`);
  console.log(`  <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" sizes="180x180" />`);
  console.log(`  <link rel="manifest" href="/favicon/site.webmanifest" />\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
