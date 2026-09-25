// Copies the built SDK into the demo site's public/ folder so the demo can
// include it with a plain <script src="/dodo-checkout.js"> tag, exactly the
// way a real merchant would. Kept as a tiny script rather than a symlink so
// it works the same on Windows and POSIX.
import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const src = path.join(here, "..", "dist", "dodo-checkout.global.js");
const destDir = path.join(here, "..", "..", "demo-site", "public");
const dest = path.join(destDir, "dodo-checkout.js");

if (!existsSync(src)) {
  console.error(`[copy-to-demo] Build output not found at ${src}`);
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`[copy-to-demo] Copied SDK to ${dest}`);
