// This is the actual bundle entry point (see tsup.config.ts). It has no
// exports of its own on purpose: esbuild's IIFE output wraps a real ESM
// `export default` in a CJS-interop shim (window.DodoCheckout.default.open,
// not window.DodoCheckout.open). Assigning to `window` directly here avoids
// that entirely, so the drop-in script matches the brief's exact shape:
// DodoCheckout.open({ ... }).
import DodoCheckout from "./checkout";

declare global {
  interface Window {
    DodoCheckout: typeof DodoCheckout;
  }
}

window.DodoCheckout = DodoCheckout;
