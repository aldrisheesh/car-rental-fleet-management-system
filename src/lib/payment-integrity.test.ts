import test from "node:test";
import assert from "node:assert/strict";
import { meetsRequiredDownPayment, projectCustomerPayment } from "./payment-integrity.ts";

test("known required amount gates verification", () => { assert.equal(meetsRequiredDownPayment(499, 500), false); assert.equal(meetsRequiredDownPayment(500, 500), true); });
test("unresolved required amount remains explicitly ungated", () => { assert.equal(meetsRequiredDownPayment(1, null), true); });
test("customer projection excludes review and storage internals", () => { const p = projectCustomerPayment({ id:"p", booking_id:"b", status:"Pending Verification", required_amount:null, reviewed_by:"secret", reviewed_submitted_amount:1, storage_path:"secret", payment_proofs:[{id:"x",is_current:true,storage_path:"secret",version:1}] }); assert.equal((p as any).reviewed_by, undefined); assert.equal((p as any).storage_path, undefined); assert.equal(p.payment_proofs[0].storage_path, undefined); });
