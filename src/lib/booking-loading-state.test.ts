import assert from "node:assert/strict";
import { test } from "node:test";
import {
  readBookingLoadingState,
  rememberBookingLoadingState,
} from "./booking-loading-state.ts";

test("unknown stages stay neutral and hints are scoped to the booking", () => {
  const values = new Map<string, string>();
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      sessionStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
      },
    },
  });
  try {
    assert.equal(readBookingLoadingState("new"), null);
    rememberBookingLoadingState("one", "payment-action");
    assert.equal(readBookingLoadingState("one"), "payment-action");
    assert.equal(readBookingLoadingState("two"), null);
    rememberBookingLoadingState("one", "payment-review");
    assert.equal(readBookingLoadingState("one"), "payment-review");
    values.set("booking-loading-variant:one", "detail");
    assert.equal(readBookingLoadingState("one"), null);
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
});

test("blocked storage and server rendering do not prevent loading", () => {
  assert.equal(readBookingLoadingState("one"), null);
  assert.doesNotThrow(() => rememberBookingLoadingState("one", "confirmed"));
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      get sessionStorage() {
        throw new Error("blocked");
      },
    },
  });
  try {
    assert.equal(readBookingLoadingState("one"), null);
    assert.doesNotThrow(() => rememberBookingLoadingState("one", "returned"));
  } finally {
    Reflect.deleteProperty(globalThis, "window");
  }
});
