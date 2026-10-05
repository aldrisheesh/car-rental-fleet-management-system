import {
  BOOKING_CATEGORIES,
  categoryValue,
  splitCategory,
  type CategoryDomain,
} from "@/lib/booking-categories";

/** Uses the same field geometry as its surrounding customer or admin form. */
export function CategorizedField({
  id,
  label,
  domain,
  value,
  onChange,
  disabled,
  optional = false,
  customer = false,
  categoryPrefix,
}: {
  id: string;
  label: string;
  domain: CategoryDomain;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  optional?: boolean;
  customer?: boolean;
  categoryPrefix?: string;
}) {
  const selected = splitCategory(domain, value);
  const other = selected.code.endsWith(".other");
  const optionPrefix =
    categoryPrefix ?? (domain === "document_review" ? "document." : undefined);
  return (
    <div className={`categorized-field ${customer ? "customer-field" : ""}`}>
      <label
        className={customer ? "customer-label" : "categorized-field__label"}
        htmlFor={id}
      >
        {label}
        {optional ? " (optional)" : ""}
      </label>
      <select
        id={id}
        name={id}
        className={customer ? "customer-input" : "categorized-field__control"}
        value={selected.code}
        disabled={disabled}
        required={!optional}
        onChange={(event) =>
          onChange(categoryValue(domain, event.target.value, selected.details))
        }
      >
        <option value="">
          {optional ? "Not specified" : "Choose a category"}
        </option>
        {BOOKING_CATEGORIES[domain]
          .filter(
            ([code]) =>
              !optionPrefix ||
              code.startsWith(optionPrefix) ||
              code === selected.code,
          )
          .map(([code, text]) => (
            <option key={code} value={code}>
              {text}
            </option>
          ))}
      </select>
      {selected.code ? (
        <div className="categorized-field__details">
          <label
            className={customer ? "customer-label" : "categorized-field__label"}
            htmlFor={`${id}-details`}
          >
            {domain === "destination"
              ? "City or trip details"
              : "Additional details"}
            {other ? " (required)" : " (optional)"}
          </label>
          <input
            id={`${id}-details`}
            className={
              customer ? "customer-input" : "categorized-field__control"
            }
            value={selected.details}
            maxLength={domain === "destination" ? 140 : 350}
            required={other}
            disabled={disabled}
            onChange={(event) =>
              onChange(categoryValue(domain, selected.code, event.target.value))
            }
          />
        </div>
      ) : selected.details ? (
        <p className="categorized-field__help">
          Previously recorded: {selected.details}. Choose a category when
          updating this record.
        </p>
      ) : null}
    </div>
  );
}
