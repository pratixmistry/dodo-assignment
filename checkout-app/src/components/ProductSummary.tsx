import type { Product } from "../products";
import { formatPrice } from "../products";
import { Card } from "@/components/ui/card";

export default function ProductSummary({ product }: { product: Product }) {
  return (
    <Card className="flex-row items-center gap-3 p-3.5">
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-lg"
        aria-hidden="true"
      >
        {product.emoji}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{product.name}</div>
        <div className="truncate text-xs text-muted-foreground">{product.description}</div>
      </div>
      <div className="shrink-0 text-sm font-semibold text-primary">
        {formatPrice(product.priceCents, product.currency)}
      </div>
    </Card>
  );
}
