import { Link } from "@tanstack/react-router";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";

import {
  defaultPublicContact,
  fetchPublicContact,
  phoneHref,
} from "@/lib/public-contact";

export function Footer() {
  const [contact, setContact] = useState(defaultPublicContact);

  useEffect(() => {
    let active = true;
    void fetchPublicContact()
      .then((result) => {
        if (active) setContact(result.settings);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

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
          <a href={phoneHref(contact.phone)}>
            <Phone size={16} aria-hidden="true" /> {contact.phone}
          </a>
          <a href={`mailto:${contact.email}`}>
            <Mail size={16} aria-hidden="true" /> {contact.email}
          </a>
          <span>
            <MapPin size={16} aria-hidden="true" /> {contact.location_summary}
          </span>
          <span>
            <Clock size={16} aria-hidden="true" /> {contact.office_hours}
          </span>
        </div>
      </div>
    </footer>
  );
}
