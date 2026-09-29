export type GeoapifyAutocompleteResponse = {
  features?: Array<{
    properties?: {
      formatted?: string;
    };
  }>;
};

export type AddressSuggestion = {
  formatted: string;
};

export function shouldRequestGeoapifySuggestions({
  value,
  selectedAddress,
}: {
  value: string;
  selectedAddress: string | null;
}) {
  const query = value.trim();
  return query.length >= 3 && query !== selectedAddress;
}

export function buildGeoapifyAutocompleteUrl({
  text,
  apiKey,
}: {
  text: string;
  apiKey: string;
}) {
  const url = new URL("https://api.geoapify.com/v1/geocode/autocomplete");
  url.searchParams.set("text", text);
  url.searchParams.set("filter", "countrycode:ph");
  url.searchParams.set("lang", "en");
  url.searchParams.set("limit", "5");
  url.searchParams.set("format", "geojson");
  url.searchParams.set("apiKey", apiKey);
  return url;
}

export function geoapifyAddressSuggestions(
  response: GeoapifyAutocompleteResponse,
): AddressSuggestion[] {
  const seen = new Set<string>();
  return (response.features ?? []).flatMap((feature) => {
    const formatted = feature.properties?.formatted?.trim();
    if (!formatted || seen.has(formatted)) return [];
    seen.add(formatted);
    return [{ formatted }];
  });
}
