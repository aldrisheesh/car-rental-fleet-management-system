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
  className,
  inputClassName = "customer-input",
  helperClassName = "customer-helper",
  placeholder = "Building, street, barangay, city",
  maxLength,
  idleHelp = "Start typing an address, or enter the full address manually.",
  noSuggestionsHelp = "No address suggestions found. You can keep typing your address.",
  unavailableHelp = FALLBACK_MESSAGE,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
  inputClassName?: string;
  helperClassName?: string;
  placeholder?: string;
  maxLength?: number;
  idleHelp?: string;
  noSuggestionsHelp?: string;
  unavailableHelp?: string;
}) {
  const listId = useId();
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [status, setStatus] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const [focused, setFocused] = useState(false);
  const requestId = useRef(0);
  const selectedAddress = useRef<string | null>(null);

  useEffect(() => {
    if (!focused) {
      setSuggestions([]);
      setActiveIndex(-1);
      return;
    }
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
      setStatus(unavailableHelp);
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
            : noSuggestionsHelp,
        );
      } catch {
        if (controller.signal.aborted || current !== requestId.current) return;
        setSuggestions([]);
        setActiveIndex(-1);
        setStatus(unavailableHelp);
      }
    }, 250);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [focused, noSuggestionsHelp, unavailableHelp, value]);

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

  const helperText = status || idleHelp;

  return (
    <div className={`address-autocomplete ${className ?? ""}`}>
      <input
        id={id}
        name={id}
        className={inputClassName}
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(event) => {
          selectedAddress.current = null;
          onChange(event.target.value);
        }}
        onFocus={() => {
          setFocused(true);
          if (!configuredKey()) setStatus(unavailableHelp);
        }}
        onBlur={() => {
          setFocused(false);
          setSuggestions([]);
          setActiveIndex(-1);
          setStatus("");
        }}
        onKeyDown={onKeyDown}
        autoComplete="street-address"
        placeholder={placeholder}
        aria-label={label}
        aria-autocomplete="list"
        aria-controls={suggestions.length ? listId : undefined}
        aria-activedescendant={
          activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
        }
        aria-invalid={Boolean(error)}
        aria-describedby={
          helperText ? `${id}-help${error ? ` ${id}-error` : ""}` : undefined
        }
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
      {helperText ? (
        <p id={`${id}-help`} className={helperClassName} role="status">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
