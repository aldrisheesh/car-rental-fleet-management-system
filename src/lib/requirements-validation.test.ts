import test from "node:test";
import assert from "node:assert/strict";
import { validateRequirementFile } from "./requirements-validation.ts";

const file = (bytes: number[], name: string, type: string) => new File([new Uint8Array(bytes)], name, { type });
test("accepts supported signatures", async () => {
  assert.equal(await validateRequirementFile(file([0xff, 0xd8, 0xff, 0x00], "id.jpg", "image/jpeg")), null);
  assert.equal(await validateRequirementFile(file([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], "id.png", "image/png")), null);
  assert.equal(await validateRequirementFile(file([...Buffer.from("%PDF-1.7")], "id.pdf", "application/pdf")), null);
});
test("rejects extension, MIME, and signature mismatches", async () => {
  assert.match((await validateRequirementFile(file([0xff, 0xd8, 0xff], "id.png", "image/png")))!, /Unsupported|content/);
  assert.match((await validateRequirementFile(file([0xff, 0xd8, 0xff], "id.jpg", "image/png")))!, /Unsupported|content/);
  assert.match((await validateRequirementFile(file([0, 1, 2], "id.pdf", "application/pdf")))!, /content/);
});
