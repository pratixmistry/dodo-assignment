export interface DemoProduct {
  id: string;
  name: string;
  description: string;
  price: string;
  emoji: string;
}

// Mirrors checkout-app/src/products.ts's catalog — the demo site only
// needs to know enough to render a "shop" and pass a productId along.
export const DEMO_PRODUCTS: DemoProduct[] = [
  { id: "prod_123", name: "Pro Plan — Annual", description: "Everything in Pro, billed once a year.", price: "$240.00", emoji: "⚡" },
  { id: "prod_456", name: "Studio Seat", description: "One additional seat on the Studio plan.", price: "$18.00", emoji: "🧩" },
  { id: "prod_789", name: "Onboarding Session", description: "A 1:1 session to get your team set up.", price: "$99.00", emoji: "🎯" },
];
