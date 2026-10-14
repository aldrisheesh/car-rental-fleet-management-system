import assert from "node:assert/strict";
import test from "node:test";
import { emailConfirmationUrl } from "./email-confirmation-url.ts";
test("confirmation returns to the configured production origin rather than request host", () => {
  assert.equal(
    emailConfirmationUrl(
      "https://briahcarrental.site",
      "https://untrusted.example",
      true,
    ),
    "https://briahcarrental.site/auth/confirmed",
  );
});
test("production confirmation cannot silently fall back to localhost or an insecure origin", () => {
  for (const base of [
    undefined,
    "http://localhost:3000",
    "https://127.0.0.1:3000",
    "http://briahcarrental.site",
    "https://user:secret@briahcarrental.site",
  ]) {
    assert.throws(() =>
      emailConfirmationUrl(base, "http://localhost:3000", true),
    );
  }
  assert.equal(
    emailConfirmationUrl(undefined, "http://127.0.0.1:3000", false),
    "http://127.0.0.1:3000/auth/confirmed",
  );
});
