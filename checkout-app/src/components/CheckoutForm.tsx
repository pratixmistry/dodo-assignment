import { AlertCircle, Loader2 } from "lucide-react";
import type { Product } from "../products";
import { formatPrice } from "../products";
import { formatCardNumber, formatExpiry } from "../validation";
import type { FormErrors } from "../validation";
import ProductSummary from "./ProductSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Props {
  product: Product;
  email: string;
  cardNumber: string;
  expiry: string;
  cvc: string;
  errors: FormErrors;
  formError: string | null;
  isSubmitting: boolean;
  onEmailChange: (v: string) => void;
  onCardNumberChange: (v: string) => void;
  onExpiryChange: (v: string) => void;
  onCvcChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function CheckoutForm({
  product,
  email,
  cardNumber,
  expiry,
  cvc,
  errors,
  formError,
  isSubmitting,
  onEmailChange,
  onCardNumberChange,
  onExpiryChange,
  onCvcChange,
  onSubmit,
}: Props) {
  return (
    <form className="flex flex-1 flex-col gap-4 overflow-y-auto p-5" onSubmit={onSubmit} noValidate>
      <ProductSummary product={product} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          autoFocus
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          disabled={isSubmitting}
          aria-invalid={!!errors.email}
          onChange={(e) => onEmailChange(e.target.value)}
          className="h-10"
        />
        {errors.email && <span className="text-xs text-destructive">{errors.email}</span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="card">Card number</Label>
        <Input
          id="card"
          inputMode="numeric"
          autoComplete="cc-number"
          placeholder="4242 4242 4242 4242"
          value={cardNumber}
          disabled={isSubmitting}
          aria-invalid={!!errors.cardNumber}
          onChange={(e) => onCardNumberChange(formatCardNumber(e.target.value))}
          className="h-10 font-mono tabular-nums"
        />
        {errors.cardNumber && <span className="text-xs text-destructive">{errors.cardNumber}</span>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="expiry">Expiry</Label>
          <Input
            id="expiry"
            inputMode="numeric"
            autoComplete="cc-exp"
            placeholder="MM/YY"
            value={expiry}
            disabled={isSubmitting}
            aria-invalid={!!errors.expiry}
            onChange={(e) => onExpiryChange(formatExpiry(e.target.value))}
            className="h-10 font-mono tabular-nums"
          />
          {errors.expiry && <span className="text-xs text-destructive">{errors.expiry}</span>}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="cvc">CVC</Label>
          <Input
            id="cvc"
            inputMode="numeric"
            autoComplete="cc-csc"
            placeholder="123"
            value={cvc}
            disabled={isSubmitting}
            aria-invalid={!!errors.cvc}
            onChange={(e) => onCvcChange(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="h-10 font-mono tabular-nums"
          />
          {errors.cvc && <span className="text-xs text-destructive">{errors.cvc}</span>}
        </div>
      </div>

      {formError && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="lg" disabled={isSubmitting} className="mt-auto h-11 rounded-full font-semibold">
        {isSubmitting ? <Loader2 className="animate-spin" /> : `Pay ${formatPrice(product.priceCents, product.currency)}`}
      </Button>

      <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
        Test cards: <code className="text-foreground/70">4242…4242</code> succeeds,{" "}
        <code className="text-foreground/70">0002</code> declines,{" "}
        <code className="text-foreground/70">0341</code> fails once then succeeds.
      </p>
    </form>
  );
}
