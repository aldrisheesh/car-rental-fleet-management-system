import assert from "node:assert/strict";
import { test } from "node:test";
import { installMotionPreferences } from "./motion-preferences.ts";

function fixture() {
  const attributes = new Map<string, string>();
  const events = new EventTarget();
  const media = Object.assign(new EventTarget(), { matches: false });
  const root = {
    getAttribute: (name: string) => attributes.get(name) ?? null,
    setAttribute: (name: string, value: string) => attributes.set(name, value),
    removeAttribute: (name: string) => attributes.delete(name),
  };
  const doc = Object.assign(events, { documentElement: root });
  const cleanup = installMotionPreferences(
    doc as unknown as Document,
    {
      matchMedia: () => media,
    } as unknown as Window,
  );
  return { attributes, events, media, cleanup };
}

test("keyboard activation is instant until a pointer interaction", () => {
  const f = fixture();
  f.events.dispatchEvent(new Event("keydown"));
  assert.equal(f.attributes.get("data-input-modality"), "keyboard");
  f.events.dispatchEvent(new Event("pointerdown"));
  assert.equal(f.attributes.get("data-input-modality"), "pointer");
  f.cleanup();
});

test("assistive activation without keydown uses keyboard motion policy", () => {
  const f = fixture();
  const click = Object.assign(new Event("click"), { detail: 0 });
  f.events.dispatchEvent(click);
  assert.equal(f.attributes.get("data-input-modality"), "keyboard");
  f.events.dispatchEvent(new Event("pointerdown"));
  f.events.dispatchEvent(Object.assign(new Event("click"), { detail: 1 }));
  assert.equal(f.attributes.get("data-input-modality"), "pointer");
  f.cleanup();
});

test("motion preference changes are observed and listeners are cleaned up", () => {
  const f = fixture();
  assert.equal(f.attributes.get("data-reduced-motion"), "false");
  f.media.matches = true;
  f.media.dispatchEvent(new Event("change"));
  assert.equal(f.attributes.get("data-reduced-motion"), "true");
  f.cleanup();
  f.events.dispatchEvent(new Event("keydown"));
  f.media.dispatchEvent(new Event("change"));
  assert.equal(f.attributes.size, 0);
});
