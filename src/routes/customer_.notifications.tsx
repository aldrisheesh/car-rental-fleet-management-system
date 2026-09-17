import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";

import { NotificationsPanel } from "@/components/notifications/NotificationsPanel";
import { CustomerPage } from "@/components/customer/CustomerPrimitives";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getAdminSession } from "@/lib/admin-auth";
import { getCustomerSession } from "@/lib/customer-auth";

export const Route = createFileRoute("/customer_/notifications")({
  beforeLoad: () => {
    if (typeof window === "undefined") return;
    if (getAdminSession()) throw redirect({ to: "/admin" });
    if (!getCustomerSession()) throw redirect({ to: "/sign-in" });
  },
  head: () => ({
    meta: [
      { title: "Notifications | Briah's Car Rental" },
      {
        name: "description",
        content: "Review booking, rental, requirement, and payment updates.",
      },
    ],
    links: [{ rel: "canonical", href: "/customer/notifications" }],
  }),
  component: CustomerNotificationsPage,
});

function CustomerNotificationsPage() {
  return (
    <CustomerPage className="customer-notifications-page">
      <Header />
      <main id="main-content" className="booking-list-main">
        <div className="customer-container customer-notifications-container">
          <div className="customer-notifications-heading">
            <Link className="customer-back-link" to="/customer">
              <ArrowLeft size={16} aria-hidden="true" />
              My bookings
            </Link>
            <p>My account</p>
            <h1>Notifications</h1>
            <span>
              Booking, rental, requirement, and payment updates for your
              account.
            </span>
          </div>
          <NotificationsPanel audience="customer" showHeading={false} />
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}
