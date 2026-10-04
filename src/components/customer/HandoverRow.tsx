import { ExternalLink, type LucideIcon } from "lucide-react";
import { meetingMapUrl } from "@/lib/pickup-arrangement";

export function HandoverRow({
  label,
  Icon,
  at,
  address,
  instructions,
  locationLabel,
}: {
  label: string;
  Icon: LucideIcon;
  at: string | null;
  address?: string | null;
  instructions?: string | null;
  locationLabel: string;
}) {
  const instant = at ? new Date(at) : null;
  const validInstant = instant && !Number.isNaN(instant.getTime());
  const map = meetingMapUrl(address);
  return (
    <section className="booking-quote-handover__row" aria-label={locationLabel}>
      <Icon
        className="booking-quote-handover__icon"
        size={28}
        strokeWidth={1.5}
        aria-hidden="true"
      />
      <div className="booking-quote-handover__schedule">
        <h3>{label}</h3>
        {validInstant ? (
          <time dateTime={instant.toISOString()}>
            <span>
              {new Intl.DateTimeFormat("en-PH", {
                timeZone: "Asia/Manila",
                month: "short",
                day: "numeric",
                year: "numeric",
              }).format(instant)}
            </span>
            <span>
              {new Intl.DateTimeFormat("en-PH", {
                timeZone: "Asia/Manila",
                hour: "numeric",
                minute: "2-digit",
              }).format(instant)}
            </span>
          </time>
        ) : (
          <p>Not recorded</p>
        )}
      </div>
      <div className="booking-quote-handover__location">
        <p className="booking-quote-handover__address">
          {address || "Not recorded"}
        </p>
        {instructions ? (
          <p className="booking-quote-handover__instructions">{instructions}</p>
        ) : null}
        {map ? (
          <a
            className="booking-quote-handover__map"
            href={map}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${locationLabel.toLowerCase()} in Maps (opens in a new tab)`}
          >
            Open in Maps <ExternalLink size={16} aria-hidden="true" />
          </a>
        ) : null}
      </div>
    </section>
  );
}
