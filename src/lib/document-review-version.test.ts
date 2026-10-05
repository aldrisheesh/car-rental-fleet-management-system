import test from "node:test";
import assert from "node:assert/strict";
import {
  currentDocumentDecision,
  documentReplacedSinceReview,
} from "./document-review-version.ts";
test("saved replacements remain ready after remount while unchanged and unbound files do not", () => {
  const review = { documentId: "reviewed-v1", version: 1 };
  assert.equal(
    documentReplacedSinceReview({ id: "saved-v2", version: 2 }, review),
    true,
  );
  assert.equal(
    documentReplacedSinceReview({ id: "reviewed-v1", version: 1 }, review),
    false,
  );
  assert.equal(
    documentReplacedSinceReview({ id: "another-file", version: 1 }, review),
    false,
  );
  assert.equal(
    documentReplacedSinceReview({ id: "reviewed-v1", version: 2 }, review),
    false,
  );
  assert.equal(documentReplacedSinceReview(undefined, review), false);
  assert.equal(
    documentReplacedSinceReview({ id: "saved-v2", version: 2 }, {}),
    false,
  );
});
test("replacement cannot inherit an earlier decision even when the draft uses the same requirement set", () => {
  const old = {
    documentId: "v1",
    version: 1,
    outcome: "Needs Replacement",
    reason: "Unclear",
  };
  assert.deepEqual(currentDocumentDecision({ id: "v2", version: 2 }, old), {
    outcome: "",
    reason: "",
  });
  assert.equal(
    currentDocumentDecision({ id: "v1", version: 1 }, old).outcome,
    "Needs Replacement",
  );
  assert.deepEqual(currentDocumentDecision({ id: "v1", version: 2 }, old), {
    outcome: "",
    reason: "",
  });
  assert.deepEqual(currentDocumentDecision({ id: "v2", version: 2 }, null), {
    outcome: "",
    reason: "",
  });
});
