import { defineConfig } from "tsup";

// The checkout app is hosted separately from this script. In dev the two
// run on different localhost ports (which the browser already treats as
// different origins, so the postMessage security model is exercised even
// locally). In production this is rebuilt with the real deployed URL.
const CHECKOUT_APP_URL = process.env.CHECKOUT_APP_URL ?? "http://localhost:5174";

export default defineConfig({
  entry: { "dodo-checkout": "src/browser.ts" },
  format: ["iife"],
  outDir: "dist",
  dts: { entry: "src/index.ts" },
  sourcemap: true,
  minify: false,
  clean: true,
  define: {
    __CHECKOUT_APP_URL__: JSON.stringify(CHECKOUT_APP_URL),
  },
});
