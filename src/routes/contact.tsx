import { createFileRoute } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  Mail,
  MapPin,
  Phone,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Footer } from "@/components/site/Footer";
import { Header } from "@/components/site/Header";

type ContactErrors = Partial<Record<"name" | "email" | "subject" | "message", string>>;

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

const cards = [
  { icon: Phone, label: "Call us", value: "+63 917 555 0142", href: "tel:+639175550142" },
  {
    icon: Mail,
    label: "Email",
    value: "hello@briahsrental.ph",
    href: "mailto:hello@briahsrental.ph",
  },
  { icon: MapPin, label: "Visit us", value: "Taft, Manila / Antipolo, Rizal" },
  { icon: Clock, label: "Office hours", value: "Mon-Sun / 7:00 AM - 9:00 PM" },
];

const branches = [
  {
    name: "Taft, Manila",
    address: "2/F Briah Building, Taft Avenue, Manila 1004",
    note: "Main pickup hub for Metro Manila rentals.",
  },
  {
    name: "Antipolo, Rizal",
    address: "Sumulong Highway, Antipolo, Rizal 1870",
    note: "Convenient for Rizal and eastern Luzon trips.",
  },
];

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<ContactErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(false);

    const nextErrors = validateContact({ name, email, subject, message });
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      toast.error("Please review the highlighted fields.");
      return;
    }

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSent(true);
      toast.success("Message sent", {
        description: "We'll reply within a few hours.",
      });
    }, 650);
  }

  return (
    <div>
      <Header />

      <section className="border-b border-border bg-surface">
        <div className="container-page grid gap-10 py-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-primary">
              Contact
            </p>
            <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
              Talk to Briah's
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
              Questions about availability, branch pickup, or long-distance Luzon trips? Send a note
              and our team will get back to you within a few hours.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {cards.map((card) => (
              <ContactCard key={card.label} {...card} />
            ))}
          </div>
        </div>
      </section>

      <section className="container-page mt-12 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <form
          onSubmit={submit}
          noValidate
          className="rounded-xl border border-border bg-card p-5 shadow-soft md:p-8"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-2xl font-semibold">Send us a message</h2>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Share the dates, vehicle type, and pickup branch you have in mind.
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium ${
                sent
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-primary/30 bg-primary/10 text-primary"
              }`}
            >
              {sent ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
              {sent ? "Message sent" : "Same-day replies"}
            </span>
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">
            <Field label="Full name" id="contact-name" error={errors.name}>
              <input
                id="contact-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrors((current) => ({ ...current, name: undefined }));
                }}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "contact-name-error" : undefined}
                className="input-control"
                autoComplete="name"
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
                  setErrors((current) => ({ ...current, email: undefined }));
                }}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "contact-email-error" : undefined}
                className="input-control"
                autoComplete="email"
                required
              />
            </Field>
          </div>

          <Field label="Subject" id="contact-subject" error={errors.subject} className="mt-5">
            <input
              id="contact-subject"
              value={subject}
              onChange={(event) => {
                setSubject(event.target.value);
                setErrors((current) => ({ ...current, subject: undefined }));
              }}
              aria-invalid={Boolean(errors.subject)}
              aria-describedby={errors.subject ? "contact-subject-error" : undefined}
              className="input-control"
              placeholder="Booking question, branch pickup, or pricing"
              required
            />
          </Field>

          <Field label="Message" id="contact-message" error={errors.message} className="mt-5">
            <textarea
              id="contact-message"
              rows={6}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setErrors((current) => ({ ...current, message: undefined }));
              }}
              aria-invalid={Boolean(errors.message)}
              aria-describedby={errors.message ? "contact-message-error" : undefined}
              className="input-control h-auto py-3 leading-6"
              placeholder="How can we help?"
              required
            />
          </Field>

          <button
            type="submit"
            disabled={submitting}
            className="touch-target mt-6 inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            {submitting ? "Sending message..." : "Send message"}
          </button>
        </form>

        <aside className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5 shadow-soft">
            <h2 className="font-display text-lg font-semibold">Branches</h2>
            <div className="mt-4 space-y-4">
              {branches.map((branch) => (
                <div
                  key={branch.name}
                  className="border-t border-border pt-4 first:border-t-0 first:pt-0"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                      <MapPin className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{branch.name}</h3>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        {branch.address}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{branch.note}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-secondary p-5">
            <h2 className="font-display text-lg font-semibold">Service area</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              We deliver and serve anywhere in Luzon, from Baguio and Vigan in the north to Bicol in
              the south.
            </p>
          </div>
        </aside>
      </section>

      <Footer />
    </div>
  );
}

function ContactCard({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <>
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        <span className="mt-1 block break-words text-sm leading-5 text-muted-foreground">
          {value}
        </span>
      </span>
    </>
  );

  const className =
    "flex min-h-24 items-center gap-3 rounded-xl border border-border bg-card p-4 text-left shadow-soft transition-colors hover:border-primary/35";

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return <div className={className}>{content}</div>;
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
      <span className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</span>
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
  if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = "Enter a valid email address.";
  if (!subject.trim()) nextErrors.subject = "Add a short subject.";
  if (message.trim().length < 10) nextErrors.message = "Tell us a little more so we can help.";

  return nextErrors;
}
