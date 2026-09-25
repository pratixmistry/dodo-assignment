import type { DemoProduct } from "../products";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProductCard({ product, onBuy }: { product: DemoProduct; onBuy: (id: string) => void }) {
  return (
    <Card className="gap-3">
      <CardContent className="flex flex-col gap-1">
        <div className="mb-1 flex size-10 items-center justify-center rounded-lg bg-secondary text-lg" aria-hidden="true">
          {product.emoji}
        </div>
        <div className="text-sm font-semibold">{product.name}</div>
        <div className="min-h-8 text-sm text-muted-foreground">{product.description}</div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t-0 bg-transparent pt-0">
        <span className="text-sm font-semibold">{product.price}</span>
        <Button size="sm" className="rounded-full px-4" onClick={() => onBuy(product.id)}>
          Buy
        </Button>
      </CardFooter>
    </Card>
  );
}
