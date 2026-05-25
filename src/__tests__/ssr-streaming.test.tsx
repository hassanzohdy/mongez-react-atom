// @vitest-environment node
/**
 * Streaming SSR smoke test.
 *
 * The other SSR test file (`ssr.test.tsx`) covers the synchronous
 * `renderToString` → `hydrateRoot` round-trip, which is what `happy-dom`
 * can drive. This file covers the streaming renderer
 * (`renderToPipeableStream`), which needs a real Node environment — hence
 * the `// @vitest-environment node` pragma above.
 *
 * What we're proving:
 *
 *   1. A streamed response carries the request-scoped store's value into
 *      the output HTML.
 *   2. Two concurrent streams from independent stores produce independent
 *      output, with no state bleed at any chunk boundary. This is the
 *      property that matters under SSR load — a real server interleaves
 *      stream chunks from many requests.
 *   3. The serialized snapshot is correct at the end of the stream so
 *      the client can hydrate.
 */
import { renderToPipeableStream } from "react-dom/server";
import { PassThrough } from "node:stream";
import React from "react";
import { describe, expect, it } from "vitest";
import { createAtomStore } from "@mongez/atom";
import { atom } from "../react-atom";
import { AtomStoreProvider } from "../store";
import { serializeStore } from "../ssr";

/**
 * Drain a PassThrough into a Promise<string>, resolving once React has
 * finished writing every chunk into the stream.
 */
function collectStream(stream: PassThrough): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    stream.on("data", chunk => chunks.push(Buffer.from(chunk)));
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    stream.on("error", reject);
  });
}

/**
 * Render `element` with `renderToPipeableStream` and return the full
 * HTML once `onAllReady` has fired (i.e. after Suspense boundaries
 * resolved).
 */
function renderStreamed(element: React.ReactElement): Promise<string> {
  return new Promise((resolve, reject) => {
    const sink = new PassThrough();
    const collected = collectStream(sink);

    const { pipe } = renderToPipeableStream(element, {
      onAllReady() {
        pipe(sink);
      },
      onError(err) {
        reject(err);
      },
    });

    collected.then(resolve, reject);
  });
}

function stripReactTextBoundaries(html: string): string {
  return html.replace(/<!--\s*-->/g, "");
}

describe("Streaming SSR", () => {
  it("carries a per-request store's state into the streamed HTML", async () => {
    const userAtom = atom({
      key: "stream.user",
      default: { name: "Default" },
    });

    function Hello() {
      const u = (userAtom as any).useValue() as { name: string };
      return <span>Hello, {u.name}!</span>;
    }

    const store = createAtomStore();
    store.use(userAtom).update({ name: "Alice" });

    const html = await renderStreamed(
      <AtomStoreProvider store={store}>
        <Hello />
      </AtomStoreProvider>,
    );

    expect(stripReactTextBoundaries(html)).toContain("Hello, Alice!");
    // The module-level template is untouched even after a streaming render.
    expect(userAtom.value).toEqual({ name: "Default" });

    // The snapshot serializes cleanly and is hydrate-ready.
    const payload = serializeStore(store);
    expect(JSON.parse(payload)).toEqual({
      "stream.user": { name: "Alice" },
    });
  });

  it("two concurrent streams keep their stores isolated", async () => {
    const cartAtom = atom({
      key: "stream.cart",
      default: { items: 0 },
    });

    function CartLine() {
      const c = (cartAtom as any).useValue() as { items: number };
      return <span>items={c.items}</span>;
    }

    const storeA = createAtomStore();
    storeA.use(cartAtom).update({ items: 3 });

    const storeB = createAtomStore();
    storeB.use(cartAtom).update({ items: 7 });

    // Kick both streams off concurrently so React's scheduling actually
    // interleaves their work.
    const [htmlA, htmlB] = await Promise.all([
      renderStreamed(
        <AtomStoreProvider store={storeA}>
          <CartLine />
        </AtomStoreProvider>,
      ),
      renderStreamed(
        <AtomStoreProvider store={storeB}>
          <CartLine />
        </AtomStoreProvider>,
      ),
    ]);

    expect(stripReactTextBoundaries(htmlA)).toContain("items=3");
    expect(stripReactTextBoundaries(htmlB)).toContain("items=7");
    // No global leak.
    expect(cartAtom.value).toEqual({ items: 0 });
  });
});
