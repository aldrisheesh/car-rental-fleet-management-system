export type RescheduleBlock = { start: string; end: string };

/** Reservations use half-open intervals: handover at an existing return is allowed. */
export function hasRescheduleConflict(
  start: Date | null,
  durationMs: number,
  blocks: readonly RescheduleBlock[],
) {
  if (
    !start ||
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(durationMs) ||
    durationMs <= 0
  )
    return true;
  const end = start.getTime() + durationMs;
  return blocks.some(
    (block) =>
      start.getTime() < new Date(block.end).getTime() &&
      end > new Date(block.start).getTime(),
  );
}
