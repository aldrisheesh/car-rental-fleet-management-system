import { useEffect, useState } from "react";
import { paymentHoldAllowsProof, type PaymentHold } from "./payment-hold";
export function usePaymentHoldAllowsProof(hold?: PaymentHold | null) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  return paymentHoldAllowsProof(hold, now);
}
