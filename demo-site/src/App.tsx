import { useState } from "react";
import { DEMO_PRODUCTS } from "./products";
import ProductCard from "./components/ProductCard";
import CallbackLog from "./components/CallbackLog";
import type { LogEntry } from "./components/CallbackLog";
import { Card, CardContent } from "@/components/ui/card";

export default function App() {
  const [log, setLog] = useState<LogEntry[]>([]);

  function addLog(kind: LogEntry["kind"], label: string, detail: string) {
    setLog((prev) => [
      { id: `${Date.now()}_${Math.random()}`, kind, label, detail, time: new Date().toLocaleTimeString() },
      ...prev,
    ]);
  }

  function handleBuy(productId: string) {
    window.DodoCheckout.open({
      productId,
      onSuccess: ({ sessionId }) => addLog("success", "onSuccess", `sessionId: ${sessionId}`),
      onClose: ({ reason }) => addLog("close", "onClose", `reason: ${reason}`),
      onError: ({ code, message }) => addLog("error", "onError", `${code} — ${message}`),
    });
  }

  return (
    <div className="mx-auto max-w-5xl px-6 pt-12 pb-20">
      <header className="mb-10">
        <div className="text-xl font-bold tracking-tight">Acme Supply Co.</div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          A pretend store embedding the Dodo checkout. This page never sees card details.
        </p>
      </header>

      <main className="grid grid-cols-1 items-start gap-8 md:grid-cols-[1fr_320px]">
        <section>
          <h2 className="mb-4 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Products</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {DEMO_PRODUCTS.map((p) => (
              <ProductCard key={p.id} product={p} onBuy={handleBuy} />
            ))}
          </div>

          <Card className="mt-6 py-4">
            <CardContent className="text-xs text-muted-foreground">
              <strong className="mb-1.5 block text-xs text-foreground">Test cards</strong>
              <ul className="list-disc space-y-0.5 pl-4">
                <li>
                  <code className="rounded bg-muted px-1 py-0.5 text-foreground/80">4242 4242 4242 4242</code> — succeeds
                </li>
                <li>
                  <code className="rounded bg-muted px-1 py-0.5 text-foreground/80">4000 0000 0000 0002</code> — declines
                </li>
                <li>
                  <code className="rounded bg-muted px-1 py-0.5 text-foreground/80">4000 0000 0000 0341</code> — fails once,
                  then succeeds on retry
                </li>
              </ul>
            </CardContent>
          </Card>
        </section>

        <CallbackLog entries={log} />
      </main>
    </div>
  );
}
