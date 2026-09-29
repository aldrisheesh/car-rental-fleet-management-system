const PHILIPPINE_MOBILE_DIGITS = 10;

function localMobileDigits(value: string) {
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0063")) digits = digits.slice(4);
  else if (digits.startsWith("63")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, PHILIPPINE_MOBILE_DIGITS);
}

export function formatPhilippineMobile(value: string) {
  const digits = localMobileDigits(value);
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6)]
    .filter(Boolean)
    .join(" ");
}

export function isValidPhilippineMobile(value: string) {
  const digits = localMobileDigits(value);
  return digits.length === PHILIPPINE_MOBILE_DIGITS && digits.startsWith("9");
}

export function toPhilippineMobileE164(value: string) {
  return isValidPhilippineMobile(value)
    ? `+63${localMobileDigits(value)}`
    : null;
}
