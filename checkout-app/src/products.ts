export interface Product {
  id: string;
  name: string;
  description: string;
  priceCents: number;
  currency: string;
  emoji: string;
}

export const PRODUCTS: Record<string, Product> = {
  prod_123: {
    id: "prod_123",
    name: "Pro Plan — Annual",
    description: "Everything in Pro, billed once a year.",
    priceCents: 24000,
    currency: "USD",
    emoji: "⚡",
  },
  prod_456: {
    id: "prod_456",
    name: "Studio Seat",
    description: "One additional seat on the Studio plan.",
    priceCents: 1800,
    currency: "USD",
    emoji: "🧩",
  },
  prod_789: {
    id: "prod_789",
    name: "Onboarding Session",
    description: "A 1:1 session to get your team set up.",
    priceCents: 9900,
    currency: "USD",
    emoji: "🎯",
  },
};

export function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
}

/** Simulates a network fetch so the loading state is real, not decorative. */
export function fetchProduct(productId: string): Promise<Product | null> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(PRODUCTS[productId] ?? null), 450);
  });
}
