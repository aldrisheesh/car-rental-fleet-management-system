import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, CreditCard } from "lucide-react";

import {
  CustomerPage,
  StatusCallout,
} from "@/components/customer/CustomerPrimitives";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getAdminSession } from "@/lib/admin-auth";
import { getCustomerSession } from "@/lib/customer-auth";

export const Route = createFileRoute("/payment-details")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (getAdminSession()) throw redirect({ to: "/admin" });
    if (!getCustomerSession()) throw redirect({ to: "/sign-in" });
  },
  head: () => ({
    meta: [
      { title: "Payment | Briah's Car Rental" },
      {
        name: "description",
        content: "Open payment only from the exact booking it belongs to.",
      },
    ],
  }),
  component: PaymentDetailsRedirectPage,
});

function PaymentDetailsRedirectPage() {
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);

  useEffect(() => {
    const bookingId = new URLSearchParams(window.location.search).get(
      "bookingId",
    );
    if (!bookingId) return;
    setRedirecting(true);
    void navigate({
      to: "/bookings/$bookingId",
      params: { bookingId },
      replace: true,
    });
  }, [navigate]);

  return (
    <CustomerPage>
      <Header />
      <main id="main-content" className="booking-redirect-main">
        {redirecting ? (
          <p role="status" aria-live="polite">
            Opening the payment stage for this booking…
          </p>
        ) : (
          <StatusCallout tone="info" title="Payment belongs to a booking">
            <p>
              Payment details are available only inside the exact rental request
              they belong to. Choose a booking to continue.
            </p>
            <Link className="customer-secondary-button" to="/customer">
              <ArrowLeft size={16} aria-hidden="true" />
              Back to My Bookings
            </Link>
          </StatusCallout>
        )}
        {!redirecting ? (
          <div className="booking-redirect-icon" aria-hidden="true">
            <CreditCard size={32} strokeWidth={1.6} />
          </div>
        ) : null}
      </main>
      <Footer />
    </CustomerPage>
  );
}
