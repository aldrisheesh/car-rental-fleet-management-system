# Booking address search configuration

The booking form always accepts a full address by keyboard. Google Places
Autocomplete (New) is an optional enhancement and is intentionally not enabled
until a browser-restricted key is configured. It populates the existing address
strings only; this integration does not render a map or persist coordinates or
place IDs.

Set `VITE_GOOGLE_MAPS_API_KEY` only in local and deployment environment
configuration; never commit its value. Enable Maps JavaScript API and Places
API (New) in the Google Cloud project. Restrict the browser key by HTTP referrer
to the production domain, the chosen Vercel preview-domain pattern, and the
development origin `http://127.0.0.1:3000/*` (and `http://localhost:3000/*` if
that origin is used). Restrict the key to those APIs as well.

Before enabling map pinning, add canonical delivery and return latitude/longitude
fields through a reviewed migration and extend the booking creation RPC
atomically. The current booking schema stores the human-readable delivery and
return addresses only; no coordinates are persisted yet.
