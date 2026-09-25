export interface DodoCheckoutSuccess {
  sessionId: string;
}

export interface DodoCheckoutError {
  code: string;
  message: string;
}

export type DodoCheckoutCloseReason = "user_closed" | "success" | "error";

export interface DodoCheckoutClose {
  reason: DodoCheckoutCloseReason;
}

export interface DodoCheckoutOptions {
  /** The product being purchased. Required. */
  productId: string;
  /** Fired once the payment has actually gone through. */
  onSuccess?: (data: DodoCheckoutSuccess) => void;
  /** Fired whenever the checkout leaves the screen, for any reason. Always fires. */
  onClose?: (data: DodoCheckoutClose) => void;
  /** Fired for integration-level failures (bad productId, checkout failed to load). */
  onError?: (data: DodoCheckoutError) => void;
}

/** Messages the checkout iframe sends up to the host page. Never the other way. */
export type DodoInboundMessage =
  | { type: "dodo:ready"; sessionId: string }
  | { type: "dodo:processing"; sessionId: string; value: boolean }
  | { type: "dodo:success"; sessionId: string }
  | { type: "dodo:error"; sessionId: string; code: string; message: string }
  | { type: "dodo:close"; sessionId: string; reason: DodoCheckoutCloseReason };
