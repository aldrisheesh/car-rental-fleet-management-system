import { createFileRoute, redirect } from "@tanstack/react-router";

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
      <main id="main-content" className="customer-notifications-main">
        <div className="customer-container customer-notifications-container">
          <NotificationsPanel audience="customer" showHeading={false} />
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}
