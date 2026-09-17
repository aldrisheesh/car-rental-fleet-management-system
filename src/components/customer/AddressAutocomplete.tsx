import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import {
  buildGeoapifyAutocompleteUrl,
  geoapifyAddressSuggestions,
  shouldRequestGeoapifySuggestions,
  type AddressSuggestion,
  type GeoapifyAutocompleteResponse,
} from "@/lib/geoapify-address";

const FALLBACK_MESSAGE =
  "Address suggestions are unavailable. You can enter the full address.";

function configuredKey() {
  const key = import.meta.env.VITE_GEOAPIFY_API_KEY;
  return key && !key.startsWith("your-") ? key : "";
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
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [status, setStatus] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const requestId = useRef(0);
  const selectedAddress = useRef<string | null>(null);

  useEffect(() => {
    const query = value.trim();
    const apiKey = configuredKey();
    if (
      !shouldRequestGeoapifySuggestions({
        value: query,
        selectedAddress: selectedAddress.current,
      })
    ) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
    selectedAddress.current = null;
    if (!apiKey) {
      setSuggestions([]);
      setActiveIndex(-1);
      setStatus(FALLBACK_MESSAGE);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const current = ++requestId.current;
      setStatus("Loading address suggestions…");
      try {
        const response = await fetch(
          buildGeoapifyAutocompleteUrl({ text: query, apiKey }),
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error("Geoapify autocomplete failed.");
        const payload = (await response.json()) as GeoapifyAutocompleteResponse;
        if (current !== requestId.current) return;
        const next = geoapifyAddressSuggestions(payload);
        setSuggestions(next);
        setActiveIndex(next.length ? 0 : -1);
        setStatus(
          next.length
            ? `${next.length} address suggestions available.`
            : "No address suggestions found. You can keep typing your address.",
        );
      } catch {
        if (controller.signal.aborted || current !== requestId.current) return;
        setSuggestions([]);
        setActiveIndex(-1);
        setStatus(FALLBACK_MESSAGE);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [value]);

  function selectSuggestion(suggestion: AddressSuggestion) {
    selectedAddress.current = suggestion.formatted;
    requestId.current += 1;
    onChange(suggestion.formatted);
    setSuggestions([]);
    setActiveIndex(-1);
    setStatus("Address selected.");
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
      selectSuggestion(suggestions[activeIndex]);
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
        onChange={(event) => {
          selectedAddress.current = null;
          onChange(event.target.value);
        }}
        onFocus={() => {
          if (!configuredKey()) setStatus(FALLBACK_MESSAGE);
        }}
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
          {suggestions.map((suggestion, index) => (
            <li
              id={`${listId}-${index}`}
              key={`${suggestion.formatted}-${index}`}
              role="option"
              aria-selected={index === activeIndex}
            >
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectSuggestion(suggestion)}
              >
                {suggestion.formatted}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <p id={`${id}-help`} className="customer-helper" role="status">
        {status ||
          "Start typing an address, or enter the full address manually."}
      </p>
    </div>
  );
}
