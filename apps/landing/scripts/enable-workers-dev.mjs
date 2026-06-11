// Re-enable workers.dev for the staging deploy.
//
// wrangler.jsonc sets `workers_dev: false` / `preview_urls: false` so the
// production worker is only reachable via its custom domain. Staging has no
// custom domain — its *.workers.dev URL IS its only URL (docs/DEPLOYMENT.md) —
// so deploy:staging flips the flags back in the generated config before
// `wrangler deploy`.
import { readFileSync, writeFileSync } from "node:fs";

const path = process.argv[2];
if (!path) {
  console.error("usage: node scripts/enable-workers-dev.mjs <wrangler.json>");
  process.exit(1);
}

const config = JSON.parse(readFileSync(path, "utf8"));
config.workers_dev = true;
config.preview_urls = true;
writeFileSync(path, JSON.stringify(config, null, 2) + "\n");
console.log(`${path}: workers_dev/preview_urls set to true (staging)`);
