export type PaymentResult =
  | { status: "success" }
  | { status: "declined"; message: string };

const SUCCESS_CARD = "4242424242424242";
const DECLINE_CARD = "4000000000000002";
const RETRY_CARD = "4000000000000341";

/**
 * No server: the "processor" is this function. `attemptsForThisCard` lets
 * the retry-then-succeed card behave statefully within a single checkout
 * session without needing anywhere durable to store that state.
 */
export function simulatePayment(cardNumber: string, attemptsForThisCard: number): Promise<PaymentResult> {
  const digits = cardNumber.replace(/\D/g, "");

  return new Promise((resolve) => {
    setTimeout(() => {
      if (digits === SUCCESS_CARD) {
        resolve({ status: "success" });
        return;
      }
      if (digits === DECLINE_CARD) {
        resolve({ status: "declined", message: "Your card was declined." });
        return;
      }
      if (digits === RETRY_CARD) {
        if (attemptsForThisCard === 0) {
          resolve({ status: "declined", message: "Payment failed. Please try again." });
        } else {
          resolve({ status: "success" });
        }
        return;
      }
      resolve({
        status: "declined",
        message: "This card can't be processed here — use one of the test cards below.",
      });
    }, 900);
  });
}
