import type { DodoCheckoutOptions, DodoInboundMessage } from "./types";

declare const __CHECKOUT_APP_URL__: string;

const CHECKOUT_APP_URL = __CHECKOUT_APP_URL__;
const CHECKOUT_ORIGIN = new URL(CHECKOUT_APP_URL).origin;
const LOAD_TIMEOUT_MS = 8000;
const STYLE_ID = "dodo-checkout-style";

let active: {
  sessionId: string;
  options: DodoCheckoutOptions;
  root: HTMLDivElement;
  iframe: HTMLIFrameElement;
  isProcessing: boolean;
  isReady: boolean;
  loadTimer: ReturnType<typeof setTimeout>;
} | null = null;

function injectStyles(): void {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    .dodo-backdrop {
      position: fixed; inset: 0; z-index: 2147483000;
      background: rgba(10, 12, 10, 0);
      display: flex; align-items: center; justify-content: center;
      transition: background 220ms ease;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif;
    }
    .dodo-backdrop.dodo-visible { background: rgba(10, 12, 10, 0.55); }
    .dodo-panel {
      position: relative;
      width: min(420px, calc(100vw - 32px));
      height: min(640px, calc(100vh - 64px));
      background: oklch(0.16 0.006 145);
      border-radius: 20px;
      box-shadow: 0 24px 64px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06);
      display: flex; flex-direction: column;
      overflow: hidden;
      transform: translateY(16px) scale(0.98);
      opacity: 0;
      transition: transform 260ms cubic-bezier(.16,1,.3,1), opacity 220ms ease;
    }
    .dodo-backdrop.dodo-visible .dodo-panel { transform: translateY(0) scale(1); opacity: 1; }
    .dodo-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; flex-shrink: 0;
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .dodo-brand { display: flex; align-items: center; gap: 8px; color: oklch(0.92 0.16 130); font-size: 13px; font-weight: 600; letter-spacing: 0.01em; }
    .dodo-brand svg { flex-shrink: 0; }
    .dodo-close {
      appearance: none; border: none; background: transparent; color: #8a8f8a;
      width: 28px; height: 28px; border-radius: 8px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      transition: background 120ms ease, color 120ms ease;
    }
    .dodo-close:hover:not(:disabled) { background: rgba(255,255,255,0.08); color: #fff; }
    .dodo-close:disabled { opacity: 0.3; cursor: not-allowed; }
    .dodo-body { position: relative; flex: 1; min-height: 0; }
    .dodo-iframe { width: 100%; height: 100%; border: 0; display: block; opacity: 0; transition: opacity 200ms ease; }
    .dodo-iframe.dodo-loaded { opacity: 1; }
    .dodo-skeleton {
      position: absolute; inset: 0; padding: 20px; display: flex; flex-direction: column; gap: 12px;
      transition: opacity 200ms ease;
    }
    .dodo-skeleton.dodo-hidden { opacity: 0; pointer-events: none; }
    .dodo-sk-row { border-radius: 8px; background: linear-gradient(90deg, #17191700 0%, #23261f 40%, #17191700 80%); background-color: #1a1c1a; background-size: 400px 100%; animation: dodo-shimmer 1.4s ease-in-out infinite; }
    @keyframes dodo-shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }
    .dodo-load-error { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; padding: 24px; text-align: center; color: #d8dad8; }
    .dodo-load-error p { margin: 0; font-size: 13px; color: #9aa39a; }
    .dodo-retry { appearance: none; border: 1px solid rgba(255,255,255,0.15); background: transparent; color: #fff; padding: 8px 16px; border-radius: 999px; font-size: 13px; cursor: pointer; }
    .dodo-retry:hover { background: rgba(255,255,255,0.08); }
    @media (max-width: 480px) {
      .dodo-panel { width: 100vw; height: 100vh; border-radius: 0; }
    }
  `;
  document.head.appendChild(style);
}

function genId(): string {
  if ("randomUUID" in crypto) return crypto.randomUUID();
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function buildShell(): { backdrop: HTMLDivElement; iframe: HTMLIFrameElement; closeBtn: HTMLButtonElement; skeleton: HTMLDivElement; errorEl: HTMLDivElement } {
  const backdrop = document.createElement("div");
  backdrop.className = "dodo-backdrop";
  backdrop.setAttribute("role", "presentation");

  const panel = document.createElement("div");
  panel.className = "dodo-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-modal", "true");
  panel.setAttribute("aria-label", "Checkout");

  const header = document.createElement("div");
  header.className = "dodo-header";
  header.innerHTML = `
    <span class="dodo-brand">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="3" y="10" width="18" height="11" rx="2" stroke="oklch(0.92 0.16 130)" stroke-width="2"/>
        <path d="M7 10V7a5 5 0 0 1 10 0v3" stroke="oklch(0.92 0.16 130)" stroke-width="2"/>
      </svg>
      Secure checkout
    </span>
  `;
  const closeBtn = document.createElement("button");
  closeBtn.className = "dodo-close";
  closeBtn.setAttribute("aria-label", "Close checkout");
  closeBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`;
  header.appendChild(closeBtn);

  const body = document.createElement("div");
  body.className = "dodo-body";

  const skeleton = document.createElement("div");
  skeleton.className = "dodo-skeleton";
  skeleton.innerHTML = `
    <div class="dodo-sk-row" style="height:120px;"></div>
    <div class="dodo-sk-row" style="height:16px;width:60%;"></div>
    <div class="dodo-sk-row" style="height:40px;"></div>
    <div class="dodo-sk-row" style="height:40px;"></div>
    <div class="dodo-sk-row" style="height:40px;margin-top:auto;"></div>
  `;

  const errorEl = document.createElement("div");
  errorEl.className = "dodo-load-error";
  errorEl.style.display = "none";

  const iframe = document.createElement("iframe");
  iframe.className = "dodo-iframe";
  iframe.setAttribute("sandbox", "allow-scripts allow-forms allow-same-origin");
  iframe.setAttribute("title", "Dodo Checkout");

  body.appendChild(iframe);
  body.appendChild(skeleton);
  body.appendChild(errorEl);
  panel.appendChild(header);
  panel.appendChild(body);
  backdrop.appendChild(panel);

  return { backdrop, iframe, closeBtn, skeleton, errorEl };
}

function teardown(reason: "user_closed" | "success" | "error"): void {
  if (!active) return;
  const { root, options, loadTimer } = active;
  clearTimeout(loadTimer);
  window.removeEventListener("message", handleMessage);
  document.removeEventListener("keydown", handleKeydown);
  root.classList.remove("dodo-visible");
  const cleanup = () => root.remove();
  root.addEventListener("transitionend", cleanup, { once: true });
  setTimeout(cleanup, 300); // fallback in case transitionend never fires
  active = null;
  options.onClose?.({ reason });
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key !== "Escape" || !active || active.isProcessing) return;
  teardown("user_closed");
}

function handleMessage(event: MessageEvent): void {
  if (!active) return;
  if (event.origin !== CHECKOUT_ORIGIN) return;
  if (event.source !== active.iframe.contentWindow) return;
  const data = event.data as DodoInboundMessage;
  if (!data || typeof data !== "object" || data.sessionId !== active.sessionId) return;

  switch (data.type) {
    case "dodo:ready": {
      clearTimeout(active.loadTimer);
      active.isReady = true;
      active.iframe.classList.add("dodo-loaded");
      active.root.querySelector(".dodo-skeleton")?.classList.add("dodo-hidden");
      break;
    }
    case "dodo:processing": {
      active.isProcessing = data.value;
      const closeBtn = active.root.querySelector<HTMLButtonElement>(".dodo-close");
      if (closeBtn) closeBtn.disabled = data.value;
      break;
    }
    case "dodo:success": {
      active.options.onSuccess?.({ sessionId: data.sessionId });
      break;
    }
    case "dodo:error": {
      active.options.onError?.({ code: data.code, message: data.message });
      break;
    }
    case "dodo:close": {
      teardown(data.reason);
      break;
    }
  }
}

function showLoadError(): void {
  if (!active) return;
  const errorEl = active.root.querySelector<HTMLDivElement>(".dodo-load-error");
  if (!errorEl) return;
  errorEl.style.display = "flex";
  errorEl.innerHTML = `
    <p>The checkout couldn't load. Check your connection and try again.</p>
    <button class="dodo-retry" type="button">Retry</button>
  `;
  errorEl.querySelector("button")?.addEventListener("click", () => {
    if (!active) return;
    const { options } = active;
    teardown("error");
    open(options);
  });
  active.options.onError?.({ code: "load_timeout", message: "Checkout failed to load in time." });
}

function open(options: DodoCheckoutOptions): void {
  if (!options || !options.productId) {
    options?.onError?.({ code: "invalid_product", message: "productId is required." });
    return;
  }
  if (active) {
    console.warn("[DodoCheckout] A checkout is already open; ignoring this open() call.");
    return;
  }

  injectStyles();
  const sessionId = genId();
  const { backdrop, iframe, closeBtn, errorEl } = buildShell();

  const url = new URL(CHECKOUT_APP_URL);
  url.searchParams.set("productId", options.productId);
  url.searchParams.set("sessionId", sessionId);
  url.searchParams.set("origin", window.location.origin);
  iframe.src = url.toString();

  document.body.appendChild(backdrop);
  // Force layout before adding the visible class so the enter transition runs.
  void backdrop.offsetHeight;
  requestAnimationFrame(() => backdrop.classList.add("dodo-visible"));

  const loadTimer = setTimeout(showLoadError, LOAD_TIMEOUT_MS);

  active = { sessionId, options, root: backdrop, iframe, isProcessing: false, isReady: false, loadTimer };

  closeBtn.addEventListener("click", () => {
    if (active && !active.isProcessing) teardown("user_closed");
  });
  backdrop.addEventListener("click", (e) => {
    if (e.target === backdrop && active && !active.isProcessing) teardown("user_closed");
  });
  document.addEventListener("keydown", handleKeydown);
  window.addEventListener("message", handleMessage);
  void errorEl;
}

function close(): void {
  if (active) teardown("user_closed");
}

const DodoCheckout = { open, close };
export default DodoCheckout;
