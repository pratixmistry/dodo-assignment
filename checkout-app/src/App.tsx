import { useEffect, useRef, useState } from "react";
import { fetchProduct } from "./products";
import type { Product } from "./products";
import { setTargetOrigin, send } from "./messaging";
import { validateForm } from "./validation";
import type { FormErrors } from "./validation";
import { simulatePayment } from "./paymentSimulator";
import CheckoutForm from "./components/CheckoutForm";
import SuccessScreen from "./components/SuccessScreen";
import NotFoundScreen from "./components/NotFoundScreen";
import { Skeleton } from "@/components/ui/skeleton";

type Stage = "loading" | "not_found" | "ready" | "success";

const params = new URLSearchParams(window.location.search);
const productId = params.get("productId") ?? "";
const sessionId = params.get("sessionId") ?? "";
const hostOrigin = params.get("origin") ?? "";

export default function App() {
  const [stage, setStage] = useState<Stage>("loading");
  const [product, setProduct] = useState<Product | null>(null);

  const [email, setEmail] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const attemptsByCard = useRef<Record<string, number>>({});
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Runtime guard: without a host origin we cannot safely postMessage
  // anything back (postMessage('*') would leak checkout state to any
  // page), so we no-op rather than fall back to an insecure wildcard.
  const canMessage = Boolean(hostOrigin && sessionId);

  useEffect(() => {
    if (!canMessage) return;
    setTargetOrigin(hostOrigin);
    // Tells the host shell the iframe has rendered, independent of whether
    // the product itself is still loading — that's a separate, in-app
    // loading state handled below.
    send({ type: "dodo:ready", sessionId });

    fetchProduct(productId).then((p) => {
      if (!p) {
        send({ type: "dodo:error", sessionId, code: "invalid_product", message: `No product found for "${productId}".` });
        setStage("not_found");
      } else {
        setProduct(p);
        setStage("ready");
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key !== "Escape" || isSubmitting || !canMessage) return;
      send({ type: "dodo:close", sessionId, reason: "user_closed" });
    }
    document.addEventListener("keydown", onKeydown);
    return () => document.removeEventListener("keydown", onKeydown);
  }, [isSubmitting]);

  useEffect(() => {
    return () => {
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting || !product || !canMessage) return;

    const values = { email, cardNumber, expiry, cvc };
    const validationErrors = validateForm(values);
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setFormError(null);
    setIsSubmitting(true);
    send({ type: "dodo:processing", sessionId, value: true });

    const digits = cardNumber.replace(/\D/g, "");
    const attempts = attemptsByCard.current[digits] ?? 0;
    const result = await simulatePayment(cardNumber, attempts);
    attemptsByCard.current[digits] = attempts + 1;

    setIsSubmitting(false);
    send({ type: "dodo:processing", sessionId, value: false });

    if (result.status === "success") {
      send({ type: "dodo:success", sessionId });
      setStage("success");
      closeTimer.current = setTimeout(() => {
        send({ type: "dodo:close", sessionId, reason: "success" });
      }, 1600);
    } else {
      setFormError(result.message);
    }
  }

  function handleDone() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    send({ type: "dodo:close", sessionId, reason: "success" });
  }

  function handleNotFoundClose() {
    send({ type: "dodo:close", sessionId, reason: "error" });
  }

  if (!canMessage) {
    return (
      <div className="flex h-full flex-col">
        <NotFoundScreen productId={productId} onClose={() => {}} />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {stage === "loading" && (
        <div className="flex flex-1 flex-col gap-4 p-5" aria-busy="true">
          <Skeleton className="h-[68px] w-full" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="mt-auto h-11 w-full rounded-full" />
        </div>
      )}
      {stage === "not_found" && <NotFoundScreen productId={productId} onClose={handleNotFoundClose} />}
      {stage === "ready" && product && (
        <CheckoutForm
          product={product}
          email={email}
          cardNumber={cardNumber}
          expiry={expiry}
          cvc={cvc}
          errors={errors}
          formError={formError}
          isSubmitting={isSubmitting}
          onEmailChange={setEmail}
          onCardNumberChange={setCardNumber}
          onExpiryChange={setExpiry}
          onCvcChange={setCvc}
          onSubmit={handleSubmit}
        />
      )}
      {stage === "success" && product && <SuccessScreen product={product} onDone={handleDone} />}
    </div>
  );
}
