// Copies the circle-flags SVG set into public/flags/ so the dashboard can serve
// round country flags self-hosted (no external CDN). Runs before dev and every
// build (see package.json `flags:sync`). The output dir is gitignored.
import { cp, mkdir, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
// Resolve the package's flags dir via its manifest, independent of cwd / hoisting.
const pkg = dirname(require.resolve("circle-flags/package.json"));
const src = join(pkg, "flags");
const dest = join(import.meta.dirname, "..", "public", "flags");

await mkdir(dest, { recursive: true });
await cp(src, dest, { recursive: true });

const count = (await readdir(dest)).filter((f) => f.endsWith(".svg")).length;
console.log(`flags:sync → copied ${count} SVGs to public/flags/`);
