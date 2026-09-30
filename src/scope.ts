"use client";

/**
 * Internal plumbing shared by the store provider and the React hooks:
 * the store context, atom resolution, the fail-closed server check, the
 * server snapshot and the deferred-destroy helper.
 *
 * Not re-exported from the package entry; import from "./store" for the
 * public surface.
 */
import {
  AtomStore,
  type Atom,
  isLocalAtom,
} from "@mongez/atom";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";

/**
 * React context that holds the active atom store. Components that read or
 * write atoms via the React hooks resolve the store-scoped clone from this
 * context. When the context is null (no provider mounted), hooks fall back
 * to the module-level singleton atom in a browser, which is the right
 * behavior for a client-only SPA. On a server (no `document`) they throw.
 */
export const AtomStoreContext = createContext<AtomStore | null>(null);

/**
 * True when rendering outside a browser (Node, edge runtimes, workers).
 */
export function isServerRuntime(): boolean {
  return typeof document === "undefined";
}

/**
 * Fail closed: reading an atom on the server with no store would hand every
 * concurrent request the same module-level atom, so one request's state
 * could leak into another's. Throw instead, naming the atom and the fix.
 */
function assertStoreOnServer(atomKey: string, store: AtomStore | null): void {
  if (store || !isServerRuntime()) return;

  throw new Error(
    `[@mongez/react-atom] Atom "${atomKey}" was used while rendering on the ` +
      "server without an <AtomStoreProvider> above it. Without a provider the " +
      "hook would read the module-level singleton, which every concurrent " +
      "request shares, so one request's state could leak into another's. " +
      "Wrap the page (or layout) in <AtomStoreProvider> so each request gets " +
      "its own store. For per-component state use useLocalAtom() or " +
      "atom({ register: false }), which need no provider."
  );
}

/**
 * Resolve the atom a hook should operate on for the current store context.
 *
 * - Local atoms (`register: false`) are returned unchanged.
 * - Inside a provider: the store's scoped clone. Idempotent for atoms that
 *   are already scoped clones.
 * - No provider in a browser: the atom itself (client-only singleton).
 * - No provider on a server: throws.
 */
export function resolveAtom<V, A extends Record<string, any>>(
  store: AtomStore | null,
  template: Atom<V, A>
): Atom<V, A> {
  if (isLocalAtom(template)) return template;

  assertStoreOnServer(template.key, store);

  return store ? store.use(template) : template;
}

/**
 * Same guard for the legacy `useAtom(key)` form.
 */
export function resolveAtomByKey<V>(
  store: AtomStore | null,
  key: string
): Atom<V> | undefined {
  assertStoreOnServer(key, store);

  return store?.get<V>(key);
}

/**
 * Read a dot-notation key out of a plain value. Mirrors what `atom.get(key)`
 * does for atoms without a custom `get` option; used for server snapshots,
 * which are plain values rather than live atoms.
 */
function readPath(value: unknown, key: string): unknown {
  let current: unknown = value;

  for (const segment of key.split(".")) {
    if (current === null || typeof current !== "object") return undefined;
    if (!Object.prototype.hasOwnProperty.call(current, segment)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current;
}

export type ScopedAtom<V, A extends Record<string, any>> = {
  /**
   * The atom the hook reads and writes: the store's scoped clone inside a
   * provider, otherwise the atom itself.
   */
  atom: Atom<V, A>;

  /**
   * React's `getServerSnapshot` for the whole value. On a server it is the
   * live value (single pass, nothing mutates mid-render). On the client,
   * during hydration, it is the store's initial/hydrated value, frozen at
   * the first read, so the first client render matches the server HTML.
   */
  getServerValue: () => V;

  /**
   * Same as `getServerValue`, narrowed to one (dot-notation) key.
   */
  getServerKey: (key: string) => unknown;
};

/**
 * Resolve the scoped atom for a hook and build its server snapshot readers.
 * Also schedules the deferred persist hydration for the resolved atom.
 */
export function useScopedAtom<V, A extends Record<string, any>>(
  template: Atom<V, A>
): ScopedAtom<V, A> {
  const store = useContext(AtomStoreContext);
  const atom = resolveAtom(store, template);

  // Persisted values are read after mount, never during render, so the
  // first client render matches the server render.
  useEffect(() => {
    void atom.hydratePersisted();
  }, [atom]);

  const isStoreScoped = store !== null && !isLocalAtom(template);

  const getServerValue = useCallback((): V => {
    if (isServerRuntime()) return atom.value;

    // A store clone: the frozen hydrated value. A singleton or local atom:
    // its default, which is all a server could have rendered for it.
    return isStoreScoped
      ? (store as AtomStore).serverSnapshot(atom)
      : atom.defaultValue;
  }, [atom, isStoreScoped, store]);

  const getServerKey = useCallback(
    (key: string): unknown => {
      const value = getServerValue();

      return value === atom.value
        ? (atom as unknown as { get(key: string): unknown }).get(key)
        : readPath(value, key);
    },
    [atom, getServerValue]
  );

  return { atom, getServerValue, getServerKey };
}

/**
 * Destroy something when the component unmounts, but a tick later, and not
 * at all if the component mounts again in between.
 *
 * React StrictMode (and Offscreen/Activity) simulates unmount + remount by
 * running effect cleanup and then the effect again on the same instance.
 * Destroying synchronously in that cleanup would leave the remounted tree
 * holding a destroyed store or atom.
 */
export function useDeferredDestroy(
  destroy: () => void,
  enabled: boolean = true
): void {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const destroyRef = useRef(destroy);
  destroyRef.current = destroy;

  useEffect(() => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }

    if (!enabled) return undefined;

    return () => {
      timer.current = setTimeout(() => {
        timer.current = null;
        destroyRef.current();
      }, 0);
    };
  }, [enabled]);
}
