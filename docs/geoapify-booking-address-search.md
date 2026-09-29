# Booking address suggestions with Geoapify

The booking form always accepts a full address by keyboard. Geoapify Address
Autocomplete is an optional enhancement that suggests Philippine addresses as
the customer types. It writes only the selected formatted address into the
existing booking address fields.

Set `VITE_GEOAPIFY_API_KEY` only in local and deployment environment
configuration; never commit its value or substitute the server-only
`GEOAPIFY_API_KEY`. Configure the browser key according to Geoapify's current
application/key restrictions before deployment.

The customer booking flow remains usable without a key, when the provider is
unavailable, or when no suggestions are returned. It does not embed a map or
persist coordinates, provider feature IDs, or place IDs. The request limits
suggestions to the Philippines with `filter=countrycode:ph`; it does not limit
the service to Manila.
