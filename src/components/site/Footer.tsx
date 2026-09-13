import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="customer-footer">
      <div className="customer-container customer-footer-inner">
        <Link to="/" className="customer-footer-wordmark" translate="no">
          Briah&apos;s Car Rental
        </Link>
        <nav aria-label="Footer navigation" className="customer-footer-nav">
          <Link to="/vehicles">Find a Car</Link>
          <Link to="/customer">My Bookings</Link>
          <Link to="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
