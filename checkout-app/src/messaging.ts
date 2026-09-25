// Mirrors sdk/src/types.ts's DodoInboundMessage. Duplicated rather than
// shared across packages to keep each package independently deployable —
// in a larger system this would live in a shared @dodo/protocol package.
export type CloseReason = "user_closed" | "success" | "error";

export type OutboundMessage =
  | { type: "dodo:ready"; sessionId: string }
  | { type: "dodo:processing"; sessionId: string; value: boolean }
  | { type: "dodo:success"; sessionId: string }
  | { type: "dodo:error"; sessionId: string; code: string; message: string }
  | { type: "dodo:close"; sessionId: string; reason: CloseReason };

let targetOrigin: string | null = null;

/** Must be called once with the host origin declared by the SDK before any send(). */
export function setTargetOrigin(origin: string): void {
  targetOrigin = origin;
}

/**
 * All traffic in this app flows one direction: checkout -> host. We never
 * listen for messages FROM the parent, which keeps the attack surface small
 * — a malicious host page has no channel to push data or commands into the
 * checkout beyond the query params it was opened with.
 */
export function send(message: OutboundMessage): void {
  if (!targetOrigin) return;
  window.parent.postMessage(message, targetOrigin);
}
