import { useEffect, useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CarFront,
  ContactRound,
  CreditCard,
  FileText,
  Search,
} from "lucide-react";

import heroCar from "@/assets/hero-car.jpg";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import {
  CustomerPage,
  ErrorSummary,
  FieldError,
} from "@/components/customer/CustomerPrimitives";
import { encodeSearch } from "@/lib/customer-data";
import {
  instantToManilaDateTimeLocal,
  manilaDateTimeLocalToInstant,
} from "@/lib/business-time";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Find the right car for your trip | Briah's Car Rental" },
      {
        name: "description",
        content:
          "Choose a car for your dates, then send a rental request for review.",
      },
    ],
  }),
  component: HomePage,
});

type HomeErrors = {
  rentalStart?: string;
  rentalEnd?: string;
};

function HomePage() {
  const [rentalStart, setRentalStart] = useState("");
  const [rentalEnd, setRentalEnd] = useState("");
  const [minimumDateTime, setMinimumDateTime] = useState("");
  const [errors, setErrors] = useState<HomeErrors>({});
  const [errorFocusKey, setErrorFocusKey] = useState(0);

  useEffect(() => {
    setMinimumDateTime(instantToManilaDateTimeLocal(new Date()));
  }, []);

  function submitFinder(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors: HomeErrors = {};
    const start = manilaDateTimeLocalToInstant(rentalStart);
    const end = manilaDateTimeLocalToInstant(rentalEnd);

    if (!start) nextErrors.rentalStart = "Enter a valid rental start.";
    if (!end) nextErrors.rentalEnd = "Enter a valid rental end.";
    if (start && start.getTime() < Date.now() - 60_000) {
      nextErrors.rentalStart = "Rental start cannot be in the past.";
    }
    if (start && end && start >= end) {
      nextErrors.rentalEnd = "Rental end must be after the start.";
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      setErrorFocusKey((key) => key + 1);
      return;
    }

    window.location.assign(
      `/vehicles${encodeSearch({
        finderStart: start!.toISOString(),
        finderEnd: end!.toISOString(),
      })}`,
    );
  }

  const summaryErrors = [
    errors.rentalStart
      ? {
          id: "rental-start",
          label: "Rental start",
          message: errors.rentalStart,
        }
      : null,
    errors.rentalEnd
      ? { id: "rental-end", label: "Rental end", message: errors.rentalEnd }
      : null,
  ].filter((error): error is { id: string; label: string; message: string } =>
    Boolean(error),
  );

  return (
    <CustomerPage>
      <Header />
      <main id="main-content">
        <section className="home-hero" aria-labelledby="home-title">
          <div className="home-hero-visual" aria-hidden="true">
            <img
              src={heroCar}
              alt=""
              width={1920}
              height={1080}
              fetchPriority="high"
            />
          </div>
          <div className="home-hero-content">
            <div className="home-hero-copy">
              <p className="eyebrow">A calmer way to rent</p>
              <h1 id="home-title">Find the right car for your trip</h1>
              <p className="home-hero-lede">
                Choose your rental dates to start. You can narrow the results
                after you see the cars.
              </p>
            </div>
            <div className="home-search-zone">
              <form
                className="home-search-rail"
                onSubmit={submitFinder}
                noValidate
              >
                <div className="customer-field">
                  <label className="customer-label" htmlFor="rental-start">
                    <CalendarDays size={16} aria-hidden="true" /> Rental start
                  </label>
                  <input
                    id="rental-start"
                    className="customer-input"
                    type="datetime-local"
                    name="rentalStart"
                    value={rentalStart}
                    min={minimumDateTime}
                    aria-invalid={Boolean(errors.rentalStart)}
                    aria-describedby={
                      errors.rentalStart ? "rental-start-error" : undefined
                    }
                    onChange={(event) => {
                      setRentalStart(event.target.value);
                      if (errors.rentalStart)
                        setErrors((current) => ({
                          ...current,
                          rentalStart: undefined,
                        }));
                    }}
                    required
                  />
                  <FieldError id="rental-start" message={errors.rentalStart} />
                </div>
                <div className="customer-field">
                  <label className="customer-label" htmlFor="rental-end">
                    <CalendarDays size={16} aria-hidden="true" /> Rental end
                  </label>
                  <input
                    id="rental-end"
                    className="customer-input"
                    type="datetime-local"
                    name="rentalEnd"
                    value={rentalEnd}
                    min={rentalStart || minimumDateTime}
                    aria-invalid={Boolean(errors.rentalEnd)}
                    aria-describedby={
                      errors.rentalEnd ? "rental-end-error" : undefined
                    }
                    onChange={(event) => {
                      setRentalEnd(event.target.value);
                      if (errors.rentalEnd)
                        setErrors((current) => ({
                          ...current,
                          rentalEnd: undefined,
                        }));
                    }}
                    required
                  />
                  <FieldError id="rental-end" message={errors.rentalEnd} />
                </div>
                <button className="customer-primary-button" type="submit">
                  <Search size={18} aria-hidden="true" />
                  Find cars
                </button>
                <p className="home-search-helper">
                  Want a better fit? Narrow by passengers, budget, and vehicle
                  preference in your results.
                </p>
              </form>
              <ErrorSummary errors={summaryErrors} focusKey={errorFocusKey} />
            </div>
          </div>
        </section>

        <section className="home-how" aria-labelledby="how-renting-works">
          <div className="customer-container">
            <div className="home-section-heading">
              <div>
                <p className="eyebrow">From search to keys</p>
                <h2 id="how-renting-works">How renting works</h2>
              </div>
              <a className="customer-link" href="/vehicles">
                Explore the fleet <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
            <ol className="home-how-list">
              <li className="home-how-item">
                <span className="home-how-number" aria-hidden="true">
                  1
                </span>
                <CarFront
                  className="home-how-icon"
                  size={30}
                  aria-hidden="true"
                />
                <h3>Find a car</h3>
              </li>
              <li className="home-how-item">
                <span className="home-how-number" aria-hidden="true">
                  2
                </span>
                <FileText
                  className="home-how-icon"
                  size={30}
                  aria-hidden="true"
                />
                <h3>Send your rental request</h3>
              </li>
              <li className="home-how-item">
                <span className="home-how-number" aria-hidden="true">
                  3
                </span>
                <ContactRound
                  className="home-how-icon"
                  size={30}
                  aria-hidden="true"
                />
                <h3>Submit your requirements</h3>
              </li>
              <li className="home-how-item">
                <span className="home-how-number" aria-hidden="true">
                  4
                </span>
                <CreditCard
                  className="home-how-icon"
                  size={30}
                  aria-hidden="true"
                />
                <h3>Pay after verification</h3>
              </li>
            </ol>
            <p className="home-how-note">
              Briah reviews your requirements before payment and confirms your
              booking after payment review.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </CustomerPage>
  );
}
