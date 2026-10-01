import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CarFront,
  CheckCircle2,
  CalendarDays,
  Clock,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Send,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";
import { getClientPrincipal } from "@/lib/auth-client";
import {
  defaultPublicContact,
  fetchPublicContact,
  phoneHref,
  type PublicContactLocation,
} from "@/lib/public-contact";

type ContactErrors = Partial<
  Record<"name" | "email" | "subject" | "message", string>
>;

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact - Briah's Car Rental" },
      {
        name: "description",
        content:
          "Get in touch with Briah's Car Rental. Branches in Taft, Manila and Antipolo, Rizal.",
      },
    ],
    links: [{ rel: "canonical", href: "/contact" }],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [principal, setPrincipal] = useState(() => getClientPrincipal());
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [contact, setContact] = useState(defaultPublicContact);
  const [locations, setLocations] = useState<PublicContactLocation[]>([]);

  useEffect(() => {
    const nextPrincipal = getClientPrincipal();
    setPrincipal(nextPrincipal);
    if (nextPrincipal?.email) {
      setName(nextPrincipal.fullName);
      setEmail(nextPrincipal.email);
    }
  }, []);

  useEffect(() => {
    let active = true;
    void fetchPublicContact()
      .then((result) => {
        if (!active) return;
        setContact(result.settings);
        setLocations(result.locations);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(false);

    const nextErrors = validateContact({ name, email, subject, message });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please review the highlighted fields.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch("/api/contact-inquiries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;
      if (!response.ok)
        throw new Error(payload?.message ?? "Your message could not be saved.");
      setSent(true);
      setSubject("");
      setMessage("");
      toast.success("Message received", {
        description: contact.reply_commitment,
      });
    } catch (cause) {
      toast.error(
        cause instanceof Error
          ? cause.message
          : "Your message could not be saved.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  const isIdentityReadOnly = Boolean(principal?.email);

  const displayedLocations =
    locations.length > 0
      ? locations
      : [
          {
            id: "taft",
            name: "Taft, Manila",
            address: "2/F Briah Building, Taft Avenue, Manila 1004",
            note: null,
            sort_order: 1,
          },
          {
            id: "antipolo",
            name: "Antipolo, Rizal",
            address: "Sumulong Highway, Antipolo, Rizal 1870",
            note: null,
            sort_order: 2,
          },
        ];

  return (
    <div>
      <Header />

      <main id="main-content" className="contact-local-help">
        <section className="contact-local-help__hero">
          <div className="customer-container contact-local-help__hero-grid">
            <div className="contact-local-help__intro">
              <h1>How can we help?</h1>
              <p>
                Whether you have a question about a booking, need help with your
                trip, or just want to say hello, our team is ready to assist.
              </p>
              <div
                className="contact-local-help__direct-links"
                aria-label="Contact directly"
              >
                <a href={phoneHref(contact.phone)}>
                  <Phone size={20} strokeWidth={1.8} aria-hidden="true" />
                  {contact.phone}
                </a>
                <a href={`mailto:${contact.email}`}>
                  <Mail size={20} strokeWidth={1.8} aria-hidden="true" />
                  {contact.email}
                </a>
              </div>
            </div>

            <section
              className="contact-local-help__guide"
              aria-labelledby="contact-guide-title"
            >
              <h2 id="contact-guide-title">Before you write</h2>
              <p>A few details help our team assist you faster.</p>
              <ol>
                <li>
                  <FileText size={23} strokeWidth={1.65} aria-hidden="true" />
                  <div>
                    <strong>About a booking?</strong>
                    <span>Include your booking reference number.</span>
                  </div>
                </li>
                <li>
                  <CalendarDays
                    size={23}
                    strokeWidth={1.65}
                    aria-hidden="true"
                  />
                  <div>
                    <strong>Planning a trip?</strong>
                    <span>Share your dates and preferred vehicle.</span>
                  </div>
                </li>
                <li>
                  <MapPin size={23} strokeWidth={1.65} aria-hidden="true" />
                  <div>
                    <strong>Delivery or return?</strong>
                    <span>Add the address you have in mind.</span>
                  </div>
                </li>
              </ol>
            </section>
          </div>
        </section>

        <section className="contact-local-help__message-section">
          <div className="customer-container contact-local-help__message-grid">
            <div className="contact-local-help__message-intro">
              <h2>Send a message</h2>
              <p>Tell us what you need. We usually reply the same day.</p>
            </div>

            <form
              onSubmit={submit}
              noValidate
              className="contact-local-help__form"
            >
              <div className="contact-local-help__form-fields">
                <Field label="Full name" id="contact-name" error={errors.name}>
                  <input
                    id="contact-name"
                    value={name}
                    onChange={(event) => {
                      setName(event.target.value);
                      setErrors((current) => ({ ...current, name: undefined }));
                    }}
                    readOnly={isIdentityReadOnly}
                    aria-readonly={isIdentityReadOnly}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={
                      errors.name ? "contact-name-error" : undefined
                    }
                    className={`contact-local-help__input${isIdentityReadOnly ? " contact-local-help__input--identity" : ""}`}
                    autoComplete="name"
                    placeholder="Your full name"
                    required
                  />
                </Field>
                <Field label="Email" id="contact-email" error={errors.email}>
                  <input
                    id="contact-email"
                    type="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setErrors((current) => ({
                        ...current,
                        email: undefined,
                      }));
                    }}
                    readOnly={isIdentityReadOnly}
                    aria-readonly={isIdentityReadOnly}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? "contact-email-error" : undefined
                    }
                    className={`contact-local-help__input${isIdentityReadOnly ? " contact-local-help__input--identity" : ""}`}
                    autoComplete="email"
                    placeholder="you@example.com"
                    required
                  />
                </Field>
                <Field
                  label="Topic"
                  id="contact-subject"
                  error={errors.subject}
                  className="contact-local-help__form-field--wide"
                >
                  <select
                    id="contact-subject"
                    value={subject}
                    onChange={(event) => {
                      setSubject(event.target.value);
                      setErrors((current) => ({
                        ...current,
                        subject: undefined,
                      }));
                    }}
                    aria-invalid={Boolean(errors.subject)}
                    aria-describedby={
                      errors.subject ? "contact-subject-error" : undefined
                    }
                    className="contact-local-help__input"
                    required
                  >
                    <option value="" disabled>
                      Select a topic
                    </option>
                    <option value="Booking question">Booking question</option>
                    <option value="Delivery or return">
                      Delivery or return
                    </option>
                    <option value="Vehicle availability">
                      Vehicle availability
                    </option>
                    <option value="Pricing or payment">
                      Pricing or payment
                    </option>
                    <option value="Other">Other</option>
                  </select>
                </Field>
                <Field
                  label="Message"
                  id="contact-message"
                  error={errors.message}
                  className="contact-local-help__form-field--wide"
                >
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={message}
                    onChange={(event) => {
                      setMessage(event.target.value);
                      setErrors((current) => ({
                        ...current,
                        message: undefined,
                      }));
                    }}
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={
                      errors.message ? "contact-message-error" : undefined
                    }
                    className="contact-local-help__input contact-local-help__textarea"
                    placeholder="How can we help?"
                    required
                  />
                </Field>
              </div>
              <div className="contact-local-help__form-footer">
                <button
                  type="submit"
                  disabled={submitting}
                  className="customer-primary-button"
                >
                  {submitting ? (
                    <Loader2 className="animate-spin" size={17} />
                  ) : (
                    <Send size={17} />
                  )}
                  {submitting ? "Sending message..." : "Send message"}
                  {!submitting ? (
                    <ArrowRight size={17} aria-hidden="true" />
                  ) : null}
                </button>
                {sent ? (
                  <span className="contact-local-help__sent" role="status">
                    <CheckCircle2 size={17} aria-hidden="true" /> Message sent
                  </span>
                ) : null}
              </div>
            </form>
          </div>
        </section>

        <section
          className="customer-container contact-local-help__service"
          aria-labelledby="contact-service-title"
        >
          <h2 id="contact-service-title">At your service</h2>
          <div className="contact-local-help__service-grid">
            <article>
              <MapPin size={27} strokeWidth={1.65} aria-hidden="true" />
              <div>
                <h3>Visit a branch</h3>
                <p>
                  Drop by for reservations, document support, or in-person
                  assistance.
                </p>
                <dl>
                  {displayedLocations.map((branch) => (
                    <div key={branch.id}>
                      <dt>{branch.name}</dt>
                      <dd>{branch.address}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </article>
            <article>
              <Clock size={27} strokeWidth={1.65} aria-hidden="true" />
              <div>
                <h3>Office hours</h3>
                <p>We’re open every day to serve you.</p>
                <strong>{contact.office_hours}</strong>
              </div>
            </article>
            <article>
              <CarFront
                className="contact-local-help__service-car"
                size={27}
                strokeWidth={1.65}
                aria-hidden="true"
              />
              <div>
                <h3>Service area</h3>
                <p>{contact.service_area}</p>
              </div>
            </article>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function Field({
  label,
  id,
  error,
  className = "",
  children,
}: {
  label: string;
  id: string;
  error?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`block ${className}`} htmlFor={id}>
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      {children}
      {error && (
        <span
          id={`${id}-error`}
          className="mt-1.5 flex items-start gap-1.5 text-xs leading-5 text-rose-300"
        >
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {error}
        </span>
      )}
    </label>
  );
}

function validateContact({
  name,
  email,
  subject,
  message,
}: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const nextErrors: ContactErrors = {};

  if (!name.trim()) nextErrors.name = "Enter your full name.";
  if (!/^\S+@\S+\.\S+$/.test(email.trim()))
    nextErrors.email = "Enter a valid email address.";
  if (!subject.trim()) nextErrors.subject = "Add a short subject.";
  if (message.trim().length < 10)
    nextErrors.message = "Tell us a little more so we can help.";

  return nextErrors;
}
