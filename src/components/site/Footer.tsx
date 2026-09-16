import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

export function Footer() {
  return (
    <footer className="customer-footer">
      <div className="customer-container customer-footer-inner">
        <Link to="/" className="customer-footer-wordmark" translate="no">
          Briah&apos;s Car Rental
        </Link>
        <div className="customer-footer-contact" aria-label="Help and contact">
          <span className="customer-footer-contact-label">
            Help &amp; contact
          </span>
          <a href="tel:+639175550142">
            <Phone size={16} aria-hidden="true" /> +63 917 555 0142
          </a>
          <a href="mailto:hello@briahsrental.ph">
            <Mail size={16} aria-hidden="true" /> hello@briahsrental.ph
          </a>
          <span>
            <MapPin size={16} aria-hidden="true" /> Taft, Manila · Antipolo,
            Rizal
          </span>
          <span>
            <Clock size={16} aria-hidden="true" /> Mon–Sun, 7:00 AM–9:00 PM
          </span>
        </div>
      </div>
    </footer>
  );
}
