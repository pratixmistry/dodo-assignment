import { Check } from "lucide-react";
import type { Product } from "../products";
import { Button } from "@/components/ui/button";

export default function SuccessScreen({ product, onDone }: { product: Product; onDone: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <div className="mb-2 flex size-14 animate-in zoom-in items-center justify-center rounded-full bg-primary duration-300 [animation-timing-function:cubic-bezier(0.34,1.56,0.64,1)]">
        <Check className="size-7 text-primary-foreground" strokeWidth={3} />
      </div>
      <h2 className="text-lg font-semibold">Payment successful</h2>
      <p className="max-w-70 text-sm text-muted-foreground">
        You're all set for <strong className="text-foreground">{product.name}</strong>.
      </p>
      <Button variant="outline" onClick={onDone} className="mt-2 rounded-full">
        Done
      </Button>
    </div>
  );
}
