import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFoundScreen({ productId, onClose }: { productId: string; onClose: () => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
      <div className="mb-2 flex size-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <TriangleAlert className="size-6" />
      </div>
      <h2 className="text-lg font-semibold">Checkout unavailable</h2>
      <p className="max-w-70 text-sm text-muted-foreground">
        {productId ? (
          <>
            We couldn't find a product for <code className="rounded bg-muted px-1 py-0.5 text-foreground/80">{productId}</code>.
          </>
        ) : (
          <>No product was specified for this checkout.</>
        )}
      </p>
      <Button variant="outline" onClick={onClose} className="mt-2 rounded-full">
        Close
      </Button>
    </div>
  );
}
