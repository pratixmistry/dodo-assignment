# Dodo Checkout

A tiny embeddable checkout: a drop-in script, a hosted checkout app, and a demo
storefront showing it working end to end. No backend — payments are simulated
client-side using the three test cards in the brief.

**Live demo:** https://dodo-demo-site-opal.vercel.app
**Checkout app (standalone):** https://dodo-checkout-app-sigma.vercel.app

## The three pieces

```
sdk/            The drop-in script. Plain TypeScript, no framework, built to
                a single IIFE file that exposes window.DodoCheckout.

checkout-app/   The checkout itself. React + TypeScript + Tailwind v4,
                built entirely from shadcn/ui components (Button, Input,
                Card, Alert, Skeleton — Base UI primitives underneath).
                Runs in its own iframe, on its own origin/port. Never runs
                inside the host page's DOM or JS context.

demo-site/      A pretend storefront ("Acme Supply Co.") that includes the
                SDK the same way a real merchant would, also built with
                shadcn/ui, with a visible log of every callback firing.
```

The SDK's own overlay shell (backdrop, panel frame, close button) is the one
piece of UI that *isn't* shadcn — it's rendered with plain DOM/CSS on
purpose, because it has to work even before the React app in the iframe has
loaded (see Decision 1). It's hand-styled with the same color tokens
(`oklch(...)` values copied straight from the shadcn theme) so it reads as
one continuous system rather than two different products stitched together.

## How the pieces talk to each other

`DodoCheckout.open({ productId, onSuccess, onClose, onError })` creates a
full-screen (mobile) / centered-panel (desktop) overlay on the host page and
puts an `<iframe>` inside it pointing at the checkout app, running on a
**different origin** (different port locally; a different subdomain in
production). That cross-origin boundary is the actual security mechanism:
the host page's JavaScript cannot read the iframe's DOM, its form state, or
anything the shopper types. The card number never enters the host page's
execution context — not "we promise not to look at it," but the browser
enforces it.

Configuration flows **into** the checkout exactly once, via the iframe's URL
(`productId`, a generated `sessionId`, and the host's `origin`) at the moment
it's created. After that, all `postMessage` traffic flows **one direction**:
checkout → host. The SDK never posts anything into the iframe. This was a
deliberate simplification — it means the checkout app has no message handler
that a hostile host page could feed bad input into; the only "API surface" a
host page has is the query string it was opened with, and a corrupted or
missing query string just fails safely into "not found," it can't corrupt
the checkout's internal state.

Every message from the iframe is checked against three things before the SDK
acts on it: `event.origin` matches the checkout app's known origin,
`event.source` is the exact iframe window that's currently open, and the
message's `sessionId` matches the session that iframe was opened with. That
last check matters if a page somehow has two things racing — an assistant of
correctness rather than of security, but it lets the SDK stay indifferent to
misuse without global mutable state doing anything surprising.

The message vocabulary is small and typed (see `sdk/src/types.ts`):
`dodo:ready`, `dodo:processing`, `dodo:success`, `dodo:error`, `dodo:close`.
The chrome around the iframe — the panel, the header, the close button, the
backdrop, the load-timeout screen — is rendered by the **SDK**, not the
checkout app, so the "let the shopper leave" guarantee holds even if the
checkout app itself fails to load (see Decision 1 below).

## Running it locally

```bash
npm install
npm run build:sdk   # builds sdk/dist and copies it into demo-site/public
npm run dev          # starts checkout-app on :5174 and demo-site on :5173
```

Open `http://localhost:5173`. The two dev servers on different ports means
the postMessage security model is exercised for real even locally — it's not
a same-origin dev shortcut that stops meaning anything once deployed.

Rebuilding the SDK (`npm run build:sdk`) is a separate step from `npm run
dev` because the SDK is meant to be consumed as a built artifact, exactly
like a merchant would `<script src="...">` it — there's no framework dev
server for it.

## Deploying

`checkout-app` and `demo-site` are deployed as two separate Vercel projects
(their own origins is the whole point). `checkout-app` deploys with no
special config. `demo-site` needs one environment variable set to the
checkout app's real URL:

```
CHECKOUT_APP_URL=https://dodo-checkout-app-sigma.vercel.app
```

That's because the SDK bakes `CHECKOUT_APP_URL` in at **build** time (see
`sdk/tsup.config.ts`), and `demo-site`'s `prebuild` script rebuilds the SDK
as part of its own Vercel build (see `demo-site/package.json`) so the
`dodo-checkout.js` it serves points at the deployed checkout app instead of
`localhost:5174`. Changing the env var requires a redeploy with the build
cache cleared to actually take effect.

## Test cards

| Card | Result |
|---|---|
| `4242 4242 4242 4242` | Succeeds |
| `4000 0000 0000 0002` | Declines |
| `4000 0000 0000 0341` | Fails once, then succeeds on retry (per session, per card) |

Any other Luhn-valid number is treated as "can't be processed in this demo."

## Two decisions I went back and forth on

**1. Who renders the close button — the host shell, or the checkout app
itself?**
My first instinct was to let the checkout app own its entire presentation,
header and all, since it's a more self-contained unit that way. But that
means the one control a shopper needs when things go wrong — a way out — only
exists if the iframe's content has actually loaded and rendered. If the
checkout app is slow, offline, or throws on mount, the shopper is stuck
looking at a blank rectangle with no way to close it. I moved the panel
chrome (header, close button, backdrop-click, load-timeout screen) into the
SDK shell, outside the iframe, so it renders immediately and independently.
The checkout app only owns what's actually inside the form. It's a small
loss of encapsulation for a real robustness gain — a failed iframe load
never traps anyone.

**2. Does a declined card call `onError`?**
The brief's API only gives three callbacks, and a failed payment felt like
an obvious fit for `onError` at first. But `onError` is what a developer's
error-handling code path reacts to — logging, alerting, "something's
broken." A decline is not broken; it's the single most normal outcome a
checkout has to handle well, and the right response is "let the shopper fix
their card and try again," inline, without leaving the form. I ended up
treating declines as UI state internal to the checkout app (an inline
banner, form stays editable, no callback at all), and reserved `onError`
strictly for integration-level failures the host page can't recover from by
itself — an unknown `productId`, or the checkout failing to load within a
timeout. `onClose`'s `reason` is what eventually tells the host the truth
about how the session ended (`success` / `user_closed` / `error`); individual
payment attempts in between are the checkout's own business.

## What I'd explore next

- **A real backend.** Right now "success" is a client-side signal the
  checkout app decides on its own. The natural next step is a server that
  actually authorizes the payment and a webhook so the merchant's backend
  hears about it independently of whatever the shopper's browser reports —
  the client-side `onSuccess` becomes a UX hint, not the source of truth.
- **Automated tests.** The validation and payment-simulator logic
  (`checkout-app/src/validation.ts`, `paymentSimulator.ts`) are pure
  functions I'd unit test first; the three card flows are the natural
  Playwright/Cypress e2e cases.
- **A real focus trap.** I autofocus the first field and handle Escape, but
  I didn't get to verifying Tab-cycling stays inside the iframe under a
  screen reader — that's the next accessibility pass.
- **A narrow, explicit theming API** (e.g. one accent-color option) instead
  of none. I left customization at zero for v1 on purpose — a payment form
  that looks different every time it's seen is worse for trust than a
  consistent one — but a single documented knob is probably the right
  amount for real merchants.

## What's not here on purpose

No deck, no state-management library, no custom design-tokens file (the UI
is shadcn/ui end to end — see below). One good flow, handled properly, for
the three cards the brief asks for.
