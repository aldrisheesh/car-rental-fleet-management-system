export const HANDOVER_TIMES = Array.from(
  { length: 11 },
  (_, index) => `${String(index + 8).padStart(2, "0")}:00`,
);
export function isHandoverTime(value: string) {
  return HANDOVER_TIMES.includes(value.slice(11, 16));
}
