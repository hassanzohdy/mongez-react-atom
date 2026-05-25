/**
 * End-to-end SSR smoke tests for `@mongez/react-atom`.
 *
 * These tests prove three things that the README promises and that the
 * meta-framework integrations (Next.js App Router, Remix, TanStack Start)
 * rely on:
 *
 *   1. A server-rendered store can serialize its values and the client can
 *      pick them up via `<AtomStoreProvider initialValues={...}>`, with no
 *      hydration mismatch and no flash from default → hydrated value.
 *
 *   2. Two stores can render concurrently in the same Node process without
 *      bleeding state into each other. This is the property that makes the
 *      lib safe under SSR load (multiple in-flight requests).
 *
 *   3. An atom that was never touched server-side but appears in
 *      `initialValues` still gets its hydrated value the first time it is
 *      read on the client, via the store's pending-value queue.
 *
 * The tests use plain `renderToString` (not the streaming renderer) because
 * happy-dom doesn't carry the Node-stream plumbing. The basic snapshot →
 * hydrate path exercises the same `AtomStore` code regardless of which
 * renderer the host framework uses.
 */
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { act } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { atoms, createAtomStore } from "@mongez/atom";
import { atom } from "../react-atom";
import { AtomStoreProvider } from "../store";

/**
 * React 18 inserts HTML comments between adjacent text nodes during SSR so
 * the client can re-pair them at hydration time. Those comments break naive
 * substring assertions. This helper strips them so `Hello, Alice!` reads
 * back as `Hello, Alice!` regardless of which text-boundary markers React
 * emitted.
 */
function stripReactTextBoundaries(html: string): string {
  return html.replace(/<!--\s*-->/g, "");
}

afterEach(() => {
  for (const key of Object.keys(atoms)) {
    atoms[key].destroy();
  }
});

describe("SSR end-to-end: snapshot → hydrate round-trip", () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
  });

  afterEach(() => {
    container.remove();
  });

  it("hydrates client state from a server snapshot without console errors", () => {
    // The "module-level" atom template. In a real app this would be exported
    // from a file and imported by every component.
    const userAtom = atom({
      key: "ssr.roundtrip.user",
      default: { name: "Default" },
    });

    function Hello() {
      const user = (userAtom as any).useValue() as { name: string };
      return <span data-testid="hello">Hello, {user.name}!</span>;
    }

    // ─── SERVER ───────────────────────────────────────────────────────────
    // Build a request-scoped store, mutate its scoped clone of `userAtom`,
    // then render to an HTML string. The template itself is never touched.
    const serverStore = createAtomStore();
    serverStore.use(userAtom).update({ name: "Alice" });

    const serverHtml = renderToString(
      <AtomStoreProvider store={serverStore}>
        <Hello />
      </AtomStoreProvider>,
    );

    expect(stripReactTextBoundaries(serverHtml)).toContain("Hello, Alice!");
    // Template untouched — proves request-locality on the server side.
    expect(userAtom.value).toEqual({ name: "Default" });

    const snapshot = serverStore.snapshot();
    expect(snapshot).toMatchObject({
      "ssr.roundtrip.user": { name: "Alice" },
    });

    // Pretend the HTML and the serialized snapshot crossed the wire.
    container.innerHTML = serverHtml;

    // ─── CLIENT ───────────────────────────────────────────────────────────
    // Fresh store on the client. Hydrate it with the serialized snapshot.
    // Spy on console.error so a hydration mismatch becomes a hard failure
    // instead of a silent log line.
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    act(() => {
      hydrateRoot(
        container,
        <AtomStoreProvider initialValues={snapshot}>
          <Hello />
        </AtomStoreProvider>,
      );
    });

    expect(container.textContent).toBe("Hello, Alice!");
    expect(errorSpy).not.toHaveBeenCalled();

    errorSpy.mockRestore();
  });
});

describe("SSR end-to-end: concurrent request isolation", () => {
  it("two stores rendered in the same process do not share state", () => {
    // The same template, two concurrent "requests".
    const cartAtom = atom({
      key: "ssr.concurrent.cart",
      default: { items: 0 },
    });

    function CartLine() {
      const cart = (cartAtom as any).useValue() as { items: number };
      return <span>items={cart.items}</span>;
    }

    // Request A: 3 items
    const storeA = createAtomStore();
    storeA.use(cartAtom).update({ items: 3 });

    // Request B: 7 items, created and rendered while A is still alive
    const storeB = createAtomStore();
    storeB.use(cartAtom).update({ items: 7 });

    const htmlA = renderToString(
      <AtomStoreProvider store={storeA}>
        <CartLine />
      </AtomStoreProvider>,
    );
    const htmlB = renderToString(
      <AtomStoreProvider store={storeB}>
        <CartLine />
      </AtomStoreProvider>,
    );

    expect(stripReactTextBoundaries(htmlA)).toContain("items=3");
    expect(stripReactTextBoundaries(htmlB)).toContain("items=7");
    // The module-level template still holds the default — no global leak.
    expect(cartAtom.value).toEqual({ items: 0 });
  });
});

describe("SSR end-to-end: lazy hydration of untouched atoms", () => {
  it("applies queued initialValues the first time an atom is used", () => {
    // The server never touched this atom (so it's not in the snapshot),
    // but the client still wants to seed it from initialValues — e.g. when
    // the framework hydrates a known set of atoms regardless of which ones
    // were read during SSR.
    const featureFlagsAtom = atom({
      key: "ssr.lazy.flags",
      default: { darkMode: false },
    });

    let seen: { darkMode: boolean } | null = null;
    function ReadFlags() {
      seen = (featureFlagsAtom as any).useValue();
      return null;
    }

    const container = document.createElement("div");
    document.body.appendChild(container);

    act(() => {
      const root = hydrateRoot(
        container,
        <AtomStoreProvider
          initialValues={{ "ssr.lazy.flags": { darkMode: true } }}
        >
          <ReadFlags />
        </AtomStoreProvider>,
      );
      // hydrateRoot returns the root; render() it implicitly via the mount.
      void root;
    });

    expect(seen).toEqual({ darkMode: true });
    // Template default is still the initial false — only the scoped clone
    // received the hydrated value.
    expect(featureFlagsAtom.value).toEqual({ darkMode: false });

    container.remove();
  });
});
