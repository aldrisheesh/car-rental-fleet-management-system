import { Link } from "@tanstack/react-router";
import { Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-surface text-foreground">
      <div className="container-page grid gap-12 py-16 md:grid-cols-4">
        <div className="md:col-span-1">
          <Link
            to="/"
            className="inline-flex max-w-full font-display text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-primary"
          >
            <span className="truncate">Briah&apos;s Car Rental</span>
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Premium yet affordable car rentals across Luzon. Self-drive or with a trusted driver —
            your journey, your choice.
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Explore
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/vehicles" className="hover:text-primary transition-colors">
                All vehicles
              </Link>
            </li>
            <li>
              <Link to="/booking" className="hover:text-primary transition-colors">
                Book a car
              </Link>
            </li>
            <li>
              <Link to="/" hash="destinations" className="hover:text-primary transition-colors">
                Luzon destinations
              </Link>
            </li>
            <li>
              <Link to="/" hash="faq" className="hover:text-primary transition-colors">
                FAQ
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Branches
          </h4>
          <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
            <li>Taft, Manila</li>
            <li>Antipolo, Rizal</li>
            <li>Service area: Anywhere in Luzon</li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            Get in touch
          </h4>
          <ul className="mt-4 space-y-3 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-primary" /> Taft Ave, Manila &amp; Antipolo,
              Rizal
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary" /> +63 917 555 0142
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> hello@briahsrental.ph
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="container-page flex flex-col items-center justify-between gap-3 py-6 text-xs text-muted-foreground md:flex-row">
          <p>© {new Date().getFullYear()} Briah's Car Rental. All rights reserved.</p>
          <p>Crafted in the Philippines.</p>
        </div>
      </div>
    </footer>
  );
}
