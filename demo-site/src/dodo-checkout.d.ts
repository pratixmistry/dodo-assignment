import type { DodoCheckoutOptions } from "@dodo/checkout-sdk";

declare global {
  interface Window {
    DodoCheckout: {
      open: (options: DodoCheckoutOptions) => void;
      close: () => void;
    };
  }
}

export {};
