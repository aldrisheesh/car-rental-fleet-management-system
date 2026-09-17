import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const routeFile = new URL("../routes/bookings.$bookingId.tsx", import.meta.url);

test("requirement uploads open an in-page preview without a separate review screen", async () => {
  const source = await readFile(routeFile, "utf8");
  const previewFunction = source.slice(
    source.indexOf("function RequirementDocumentPreview"),
    source.indexOf("function RequirementsOverview"),
  );

  assert.match(source, /<Dialog\s/);
  assert.match(source, /<PdfDocumentPreview/);
  assert.match(source, /import\("pdfjs-dist"\)/);
  assert.match(source, /canvas\.toDataURL\("image\/png"\)/);
  assert.match(source, /Preview document/);
  assert.match(source, /Submit requirements for verification/);
  assert.doesNotMatch(previewFunction, /window\.open\(/);
  assert.doesNotMatch(source, /Review documents/);
});
