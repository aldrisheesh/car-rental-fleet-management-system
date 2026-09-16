import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

type PlaceSuggestion = {
  placePrediction?: {
    text: { toString: () => string };
    toPlace: () => {
      formattedAddress?: string;
      fetchFields: (request: { fields: string[] }) => Promise<void>;
    };
  };
};

type PlacesLibrary = {
  AutocompleteSessionToken: new () => unknown;
  AutocompleteSuggestion: {
    fetchAutocompleteSuggestions: (request: {
      input: string;
      includedRegionCodes: string[];
      language: string;
      region: string;
      sessionToken: unknown;
    }) => Promise<{ suggestions: PlaceSuggestion[] }>;
  };
};

type GoogleMapsWindow = Window & {
  google?: {
    maps?: { importLibrary?: (library: string) => Promise<PlacesLibrary> };
  };
};

let placesLibraryPromise: Promise<PlacesLibrary> | null = null;

function configuredKey() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  return key && !key.startsWith("your-") ? key : "";
}

async function loadPlacesLibrary() {
  const key = configuredKey();
  if (!key) throw new Error("Google Places is not configured.");
  if (placesLibraryPromise) return placesLibraryPromise;

  placesLibraryPromise = new Promise((resolve, reject) => {
    const finish = () => {
      const importLibrary = (window as GoogleMapsWindow).google?.maps
        ?.importLibrary;
      if (!importLibrary) {
        reject(new Error("Google Places could not load."));
        return;
      }
      importLibrary("places").then(resolve).catch(reject);
    };
    const existing = document.getElementById("google-maps-places");
    if (existing) return finish();

    const script = document.createElement("script");
    script.id = "google-maps-places";
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&v=weekly&libraries=places`;
    script.onload = finish;
    script.onerror = () => reject(new Error("Google Places could not load."));
    document.head.append(script);
  });
  return placesLibraryPromise;
}

export function AddressAutocomplete({
  id,
  label,
  value,
  onChange,
  error,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const listId = useId();
  const [library, setLibrary] = useState<PlacesLibrary | null>(null);
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [status, setStatus] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const sessionToken = useRef<unknown>(null);
  const requestId = useRef(0);

  async function enablePlaces() {
    if (library) return;
    if (!configuredKey()) {
      setStatus(
        "Address suggestions are unavailable. You can enter the full address.",
      );
      return;
    }
    setStatus("Loading address suggestions…");
    try {
      const next = await loadPlacesLibrary();
      setLibrary(next);
      sessionToken.current = new next.AutocompleteSessionToken();
      setStatus("");
    } catch {
      setStatus(
        "Address suggestions are unavailable. You can enter the full address.",
      );
    }
  }

  useEffect(() => {
    if (!library || value.trim().length < 3) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    const timer = window.setTimeout(async () => {
      const current = ++requestId.current;
      try {
        const token =
          sessionToken.current ?? new library.AutocompleteSessionToken();
        sessionToken.current = token;
        const response =
          await library.AutocompleteSuggestion.fetchAutocompleteSuggestions({
            input: value,
            includedRegionCodes: ["ph"],
            language: "en",
            region: "PH",
            sessionToken: token,
          });
        if (current !== requestId.current) return;
        const next = response.suggestions.filter(
          (item) => item.placePrediction,
        );
        setSuggestions(next);
        setActiveIndex(next.length ? 0 : -1);
        setStatus(
          next.length
            ? `${next.length} address suggestions available.`
            : "No address suggestions found. You can keep typing your address.",
        );
      } catch {
        if (current !== requestId.current) return;
        setSuggestions([]);
        setActiveIndex(-1);
        setStatus(
          "Address suggestions are unavailable. You can enter the full address.",
        );
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [library, value]);

  async function selectSuggestion(suggestion: PlaceSuggestion) {
    const prediction = suggestion.placePrediction;
    if (!prediction) return;
    try {
      const place = prediction.toPlace();
      await place.fetchFields({ fields: ["formattedAddress"] });
      onChange(place.formattedAddress || prediction.text.toString());
      sessionToken.current = library
        ? new library.AutocompleteSessionToken()
        : null;
      setStatus("Address selected.");
    } catch {
      onChange(prediction.text.toString());
      setStatus("Suggestion selected. Review the address before continuing.");
    }
    setSuggestions([]);
    setActiveIndex(-1);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!suggestions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => Math.min(index + 1, suggestions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      void selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setSuggestions([]);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="address-autocomplete">
      <input
        id={id}
        className="customer-input"
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => void enablePlaces()}
        onKeyDown={onKeyDown}
        autoComplete="street-address"
        placeholder="Building, street, barangay, city"
        aria-label={label}
        aria-autocomplete="list"
        aria-controls={suggestions.length ? listId : undefined}
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
        aria-invalid={Boolean(error)}
        aria-describedby={`${id}-help${error ? ` ${id}-error` : ""}`}
      />
      {suggestions.length ? (
        <ul id={listId} className="address-autocomplete-list" role="listbox">
          {suggestions.map((suggestion, index) => {
            const prediction = suggestion.placePrediction;
            if (!prediction) return null;
            return (
              <li
                id={`${listId}-${index}`}
                key={`${prediction.text.toString()}-${index}`}
                role="option"
                aria-selected={index === activeIndex}
              >
                <button
                  type="button"
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => void selectSuggestion(suggestion)}
                >
                  {prediction.text.toString()}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
      <p id={`${id}-help`} className="customer-helper" role="status">
        {status ||
          "Start typing an address, or enter the full address manually."}
      </p>
    </div>
  );
}
