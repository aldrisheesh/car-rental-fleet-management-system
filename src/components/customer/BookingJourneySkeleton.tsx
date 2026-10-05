import { CustomerPage } from "./CustomerPrimitives";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import type { CustomerLifecycleState } from "@/lib/customer-lifecycle";

function Lines({ count = 2 }: { count?: number }) {
  return (
    <div className="journey-loading__lines">
      {Array.from({ length: count }, (_, i) => (
        <i key={i} />
      ))}
    </div>
  );
}

function HandoverSkeleton() {
  return (
    <section className="journey-loading__section">
      <i className="journey-loading__subtitle" />
      <Lines />
      {[0, 1].map((row) => (
        <div className="journey-loading__handover" key={row}>
          <div>
            <i className="journey-loading__icon" />
            <Lines count={3} />
          </div>
          <div>
            <Lines count={3} />
            <i className="journey-loading__link" />
          </div>
        </div>
      ))}
    </section>
  );
}

function VehicleSkeleton() {
  return (
    <aside className="booking-summary journey-loading__vehicle">
      <i className="journey-loading__subtitle" />
      <i className="journey-loading__reference" />
      <i className="journey-loading__photo" />
      <i className="journey-loading__label" />
      <i className="journey-loading__subtitle" />
      <i className="journey-loading__rate" />
      <div className="journey-loading__specs">
        {[0, 1, 2, 3].map((item) => (
          <Lines key={item} />
        ))}
      </div>
    </aside>
  );
}

function PaymentFormSkeleton() {
  return (
    <>
      <div className="booking-payment-request__quote journey-loading__quote">
        <div className="booking-payment-request__amount">
          <i className="journey-loading__label" />
          <i className="journey-loading__amount" />
          <Lines count={2} />
        </div>
        <div className="booking-payment-request__breakdown">
          <i className="journey-loading__label" />
          {[0, 1, 2, 3, 4].map((row) => (
            <div className="journey-loading__quote-row" key={row}>
              <i />
              <i />
            </div>
          ))}
          <div className="journey-loading__notice">
            <Lines />
          </div>
        </div>
      </div>
      <HandoverSkeleton />
      <section className="journey-loading__section">
        <i className="journey-loading__subtitle" />
        <Lines count={1} />
        <i className="journey-loading__policy-note" />
        <i className="journey-loading__input" />
        <div className="booking-payment-workspace">
          <i className="journey-loading__qr" />
          <div>
            <i className="journey-loading__subtitle" />
            <Lines />
            <i className="journey-loading__input" />
            <i className="journey-loading__input" />
          </div>
        </div>
        <i className="journey-loading__button" />
      </section>
    </>
  );
}

function DocumentsSkeleton({ state }: { state: CustomerLifecycleState }) {
  const review = state === "requirements-review";
  return (
    <>
      {state === "requirements-needed" && (
        <div className="booking-requirements-guide">
          <Lines count={4} />
          <Lines count={5} />
        </div>
      )}
      <div className="booking-requirements">
        <div className="booking-requirement-list booking-requirement-grid">
          {[0, 1, 2, 3].map((doc) => (
            <article
              className="booking-requirement-row journey-loading__document"
              key={doc}
            >
              <i className="journey-loading__subtitle" />
              <Lines />
              <i
                className={
                  review
                    ? "journey-loading__document-preview"
                    : "journey-loading__input"
                }
              />
              <Lines count={1} />
            </article>
          ))}
        </div>
      </div>
      {!review && <i className="journey-loading__button" />}
    </>
  );
}

function ScheduleSkeleton({
  rental = false,
  returned = false,
}: {
  rental?: boolean;
  returned?: boolean;
}) {
  return (
    <>
      {rental ? (
        <section className="journey-loading__section">
          <i className="journey-loading__subtitle" />
          <div className="journey-loading__schedule">
            {Array.from({ length: 3 }, (_, i) => (
              <Lines count={4} key={i} />
            ))}
          </div>
        </section>
      ) : (
        <>
          {[0, 1].map((row) => (
            <section
              className="booking-confirmation-moment journey-loading__moment"
              key={row}
            >
              <div>
                <i className="journey-loading__amount" />
                <Lines />
              </div>
              <div>
                <i className="journey-loading__subtitle" />
                <Lines count={4} />
              </div>
            </section>
          ))}
        </>
      )}
      {returned && (
        <section className="journey-loading__section">
          <i className="journey-loading__subtitle" />
          {[0, 1, 2, 3].map((row) => (
            <div className="journey-loading__quote-row" key={row}>
              <i />
              <i />
            </div>
          ))}
        </section>
      )}
      <section className="journey-loading__section">
        <i className="journey-loading__subtitle" />
        <Lines count={3} />
      </section>
      {rental && !returned && (
        <section className="journey-loading__section">
          <i className="journey-loading__subtitle" />
          <Lines />
        </section>
      )}
    </>
  );
}

export function BookingJourneySkeleton({
  state,
}: {
  state: CustomerLifecycleState | null;
}) {
  const requirements = state?.startsWith("requirements-");
  const payment = state?.startsWith("payment-");
  const rental = state === "active-rental" || state === "returned";
  const modifier = requirements
    ? "requirements"
    : payment
      ? "payment"
      : state === "confirmation-resolution"
        ? "resolution"
        : rental
          ? state === "returned"
            ? "returned"
            : "active"
          : "confirmed";
  const embeddedHeading = rental || state === "payment-waiting";
  return (
    <CustomerPage
      className={`booking-detail-page booking-detail-page--${modifier}`}
    >
      <Header />
      <section
        className="booking-requirements-skeleton-journey journey-loading-bar"
        aria-hidden="true"
      >
        <div className="customer-container booking-requirements-skeleton-journey__inner">
          <i />
          <div>
            {[0, 1, 2, 3, 4, 5].map((step) => (
              <span key={step}>
                <i />
                <i />
              </span>
            ))}
          </div>
        </div>
      </section>
      <main
        id="main-content"
        className="booking-detail-main journey-loading"
        aria-busy="true"
      >
        <div className="customer-container">
          <span className="sr-only" role="status">
            Loading your rental journey…
          </span>
          {!embeddedHeading && (
            <div className="booking-detail-heading" aria-hidden="true">
              <div className="journey-loading__heading-copy">
                <i className="journey-loading__title" />
                {state === "confirmed" && <Lines />}
              </div>
              {state === "confirmed" && (
                <div className="journey-loading__confirmation-mark">
                  <i className="journey-loading__icon" />
                  <Lines />
                </div>
              )}
            </div>
          )}
          <div className="booking-detail-layout" aria-hidden="true">
            <div className="booking-detail-primary journey-loading__primary">
              {embeddedHeading && <i className="journey-loading__title" />}
              {(requirements || payment || rental) && <Lines />}
              {requirements && state && <DocumentsSkeleton state={state} />}
              {(state === "payment-action" ||
                state === "payment-resubmission") && <PaymentFormSkeleton />}
              {state === "payment-review" && (
                <>
                  <i className="journey-loading__submitted" />
                  <i className="journey-loading__subtitle" />
                  <i className="journey-loading__proof" />
                  <div className="journey-loading__schedule">
                    {[0, 1, 2].map((fact) => (
                      <Lines key={fact} />
                    ))}
                  </div>
                  <i className="journey-loading__centered" />
                  <HandoverSkeleton />
                </>
              )}
              {state === "payment-waiting" && (
                <>
                  <div className="journey-loading__schedule">
                    {[0, 1, 2].map((fact) => (
                      <Lines count={3} key={fact} />
                    ))}
                  </div>
                  <HandoverSkeleton />
                </>
              )}
              {state === "confirmed" && (
                <>
                  <section className="journey-loading__section">
                    <i className="journey-loading__subtitle" />
                    {[0, 1, 2, 3, 4].map((row) => (
                      <div className="journey-loading__quote-row" key={row}>
                        <i />
                        <i />
                      </div>
                    ))}
                  </section>
                  <ScheduleSkeleton />
                </>
              )}
              {rental && (
                <ScheduleSkeleton rental returned={state === "returned"} />
              )}
              {state === "confirmation-resolution" && (
                <>
                  <HandoverSkeleton />
                  <div className="journey-loading__notice">
                    <Lines count={4} />
                  </div>
                  <div className="journey-loading__schedule">
                    {[0, 1, 2, 3].map((fact) => (
                      <Lines count={3} key={fact} />
                    ))}
                  </div>
                </>
              )}
              {(state === null || state === "unavailable") && <Lines />}
              {(state === "rejected" || state === "cancelled") && (
                <>
                  <div className="journey-loading__notice">
                    <Lines count={3} />
                  </div>
                  <section className="journey-loading__section">
                    <i className="journey-loading__subtitle" />
                    {[0, 1, 2, 3, 4].map((row) => (
                      <div className="journey-loading__quote-row" key={row}>
                        <i />
                        <i />
                      </div>
                    ))}
                  </section>
                </>
              )}
            </div>
            <VehicleSkeleton />
          </div>
        </div>
      </main>
      <Footer />
    </CustomerPage>
  );
}
