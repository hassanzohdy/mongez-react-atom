/**
 * Unit tests for the SSR helpers exported from `../ssr`.
 *
 * The end-to-end hydration round-trip is in `ssr.test.tsx`; this file
 * focuses on serializer safety (escaping HTML-breakout and JS-invalid
 * code points) and the read/write pair across a real DOM.
 */
import { render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { atoms, createAtomStore } from "@mongez/atom";
import { atom } from "../react-atom";
import {
  DEFAULT_HYDRATION_SCRIPT_ID,
  HydrateAtomsScript,
  readHydration,
  serializeSnapshot,
  serializeStore,
} from "../ssr";

afterEach(() => {
  for (const key of Object.keys(atoms)) atoms[key].destroy();
});

describe("serializeSnapshot", () => {
  it("round-trips ordinary JSON-safe values", () => {
    const out = serializeSnapshot({ name: "Alice", count: 3, on: true });
    expect(JSON.parse(out)).toEqual({ name: "Alice", count: 3, on: true });
  });

  it("escapes </script> so the payload cannot break out of an inline tag", () => {
    const out = serializeSnapshot({
      bio: "hello </script><script>alert(1)</script>",
    });
    // The closing tag must not survive as literal text.
    expect(out).not.toMatch(/<\/script/i);
    // But the JSON must still round-trip back to the original string.
    expect(JSON.parse(out.replace(/<\\\//g, "</"))).toEqual({
      bio: "hello </script><script>alert(1)</script>",
    });
  });

  it("escapes U+2028 / U+2029 so the payload is valid JS string-literal content", () => {
    const ls = String.fromCharCode(0x2028);
    const ps = String.fromCharCode(0x2029);
    const out = serializeSnapshot({ note: `a${ls}b${ps}c` });
    expect(out).not.toContain(ls);
    expect(out).not.toContain(ps);
    expect(out).toContain("\\u2028");
    expect(out).toContain("\\u2029");
  });
});

describe("serializeStore", () => {
  it("snapshots the store's current values", () => {
    const flag = atom({ key: "ssr.helpers.flag", default: { on: false } });
    const store = createAtomStore();
    store.use(flag).update({ on: true });

    const out = serializeStore(store);
    expect(JSON.parse(out)).toEqual({ "ssr.helpers.flag": { on: true } });
  });
});

describe("<HydrateAtomsScript> + readHydration", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
    // Clean any stray hydration scripts injected into document.body.
    document
      .querySelectorAll(`script#${DEFAULT_HYDRATION_SCRIPT_ID}`)
      .forEach(el => el.remove());
  });

  it("emits a typed JSON script tag with the given id", () => {
    const html = renderToString(
      <HydrateAtomsScript
        snapshot={{ "ssr.helpers.user": { name: "Alice" } }}
      />,
    );
    expect(html).toContain(
      `id="${DEFAULT_HYDRATION_SCRIPT_ID}"`,
    );
    expect(html).toContain('type="application/json"');
    expect(html).toContain('"ssr.helpers.user"');
  });

  it("forwards a nonce attribute when provided (CSP support)", () => {
    const html = renderToString(
      <HydrateAtomsScript snapshot={{}} nonce="abc123" />,
    );
    expect(html).toContain('nonce="abc123"');
  });

  it("readHydration returns the embedded snapshot from a real DOM", () => {
    const snapshot = { "ssr.helpers.cart": { items: 5 } };
    render(<HydrateAtomsScript snapshot={snapshot} />, { container });

    expect(readHydration()).toEqual(snapshot);
  });

  it("readHydration returns null when the script tag is absent", () => {
    expect(readHydration("does-not-exist")).toBeNull();
  });

  it("readHydration logs and returns null for malformed JSON", () => {
    const el = document.createElement("script");
    el.id = "bad";
    el.type = "application/json";
    el.textContent = "{this is not json";
    document.body.appendChild(el);

    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(readHydration("bad")).toBeNull();
    expect(spy).toHaveBeenCalledTimes(1);
    spy.mockRestore();

    el.remove();
  });
});
