// A decision belongs to the exact uploaded file, not just its requirement type.
export function documentReplacedSinceReview(
  document: { id: string; version: number } | null | undefined,
  review: { documentId?: string; version?: number } | null,
) {
  return Boolean(
    document &&
    review?.documentId &&
    review.version !== undefined &&
    document.id !== review.documentId &&
    document.version > review.version,
  );
}

export function currentDocumentDecision(
  document: { id: string; version: number } | undefined,
  review: {
    documentId?: string;
    version?: number;
    outcome?: string;
    reason?: string | null;
  } | null,
) {
  if (
    !document ||
    !review ||
    document.id !== review.documentId ||
    document.version !== review.version
  )
    return { outcome: "", reason: "" };
  return { outcome: review.outcome ?? "", reason: review.reason ?? "" };
}
