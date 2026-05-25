/**
 * SSR helpers.
 *
 * These are framework-agnostic primitives for the standard SSR flow:
 *
 *   server:  store.snapshot() → serializeStore() → embed in HTML
 *   client:  readHydration()  → <AtomStoreProvider initialValues={...}>
 *
 * They're intentionally small. Next.js App Router, Remix, and TanStack
 * Start each have their own preferred transport (`__NEXT_DATA__`, loader
 * payloads, streaming chunks); the helpers here only cover the "vanilla"
 * inline-script-tag transport. If your framework already has a typed
 * server-to-client payload (e.g. `useLoaderData()`), skip these helpers
 * and feed the snapshot straight into `<AtomStoreProvider initialValues>`.
 */
import type { AtomStore } from "@mongez/atom";
import React from "react";

/**
 * The default DOM id used by {@link HydrateAtomsScript} and
 * {@link readHydration}. Override per-provider if you need to embed
 * multiple snapshots in one document.
 */
export const DEFAULT_HYDRATION_SCRIPT_ID = "__mongez_atom_state";

/**
 * Build a JSON string suitable for embedding inside an HTML `<script>`
 * tag. Two safety steps beyond a plain `JSON.stringify`:
 *
 *   1. The closing tag sequence `</` is escaped to `<\/` so an atom value
 *      containing literal HTML cannot break out of the script element.
 *   2. The U+2028 / U+2029 line separators (which are valid JSON but not
 *      valid JavaScript string literals) are escaped.
 */
export function serializeSnapshot(
  snapshot: Record<string, unknown>,
  options: {
    /**
     * Custom replacer passed through to `JSON.stringify`.
     */
    replacer?: (key: string, value: unknown) => unknown;
    /**
     * Pretty-printing indent. Defaults to 0 (compact).
     */
    space?: number;
  } = {},
): string {
  const json = JSON.stringify(
    snapshot,
    options.replacer as any,
    options.space,
  );
  return json
    .replace(/<\/(script)/gi, "<\\/$1")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

/**
 * Convenience that snapshots a store and serializes the result in one call.
 *
 *   const payload = serializeStore(serverStore);
 *   // payload is a script-safe JSON string
 */
export function serializeStore(
  store: AtomStore,
  options?: Parameters<typeof serializeSnapshot>[1],
): string {
  return serializeSnapshot(store.snapshot(), options);
}

export type HydrateAtomsScriptProps = {
  /**
   * The serialized snapshot to embed. Pass either a pre-serialized string
   * (from {@link serializeStore}) or a raw snapshot object — the component
   * will serialize it for you.
   */
  snapshot: Record<string, unknown> | string;
  /**
   * DOM id for the `<script>` element. Defaults to
   * {@link DEFAULT_HYDRATION_SCRIPT_ID}. Set this when embedding multiple
   * stores in one document (e.g. a shell + a route-level boundary).
   */
  id?: string;
  /**
   * `nonce` for CSP-protected pages.
   */
  nonce?: string;
};

/**
 * Renders an inline `<script type="application/json">` carrying a store
 * snapshot for the client to pick up.
 *
 * Place this once per `<AtomStoreProvider>` you want to hydrate. The
 * matching client-side call is {@link readHydration}.
 *
 *   // server
 *   <AtomStoreProvider store={serverStore}>
 *     <App />
 *     <HydrateAtomsScript snapshot={serverStore.snapshot()} />
 *   </AtomStoreProvider>
 *
 *   // client root
 *   <AtomStoreProvider initialValues={readHydration() ?? undefined}>
 *     <App />
 *   </AtomStoreProvider>
 */
export function HydrateAtomsScript({
  snapshot,
  id = DEFAULT_HYDRATION_SCRIPT_ID,
  nonce,
}: HydrateAtomsScriptProps) {
  const serialized =
    typeof snapshot === "string" ? snapshot : serializeSnapshot(snapshot);

  return (
    <script
      id={id}
      type="application/json"
      nonce={nonce}
      // The serializer already neutralized `</script>` and the line
      // separators, so dangerouslySetInnerHTML is safe here.
      dangerouslySetInnerHTML={{ __html: serialized }}
    />
  );
}

/**
 * Read a hydration snapshot embedded via {@link HydrateAtomsScript} from
 * the current document.
 *
 * - On the server (no `document`), returns `null`.
 * - When the script tag is missing, returns `null`.
 * - When the script body is not valid JSON, returns `null` and logs the
 *   error via `console.error` (so a malformed payload is visible during
 *   development but does not crash hydration).
 */
export function readHydration(
  id: string = DEFAULT_HYDRATION_SCRIPT_ID,
): Record<string, unknown> | null {
  if (typeof document === "undefined") return null;
  const el = document.getElementById(id);
  if (!el) return null;
  try {
    return JSON.parse(el.textContent ?? "null") as
      | Record<string, unknown>
      | null;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(
      `[@mongez/react-atom] Could not parse hydration script #${id}:`,
      err,
    );
    return null;
  }
}
