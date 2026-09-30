"use client";

import {
  AtomStore,
  type Atom,
  createAtomStore,
} from "@mongez/atom";
import React, { useContext, useState } from "react";
import {
  AtomStoreContext,
  resolveAtom,
  resolveAtomByKey,
  useDeferredDestroy,
} from "./scope";

export { AtomStoreContext };

export type AtomStoreProviderProps = {
  /**
   * An existing store to use. If omitted, the provider creates its own
   * fresh store on first render. Pass an externally created store when you
   * need to mutate it outside React (e.g. during Next.js data loading).
   */
  store?: AtomStore;

  /**
   * Atom templates to pre-register in the store. Pre-registration is
   * required when you want the initial values from `initialValues` to apply
   * to atoms that have not yet been used in React.
   */
  initialAtoms?: Atom<any>[];

  /**
   * Initial values keyed by atom key. Applied silently (no update event)
   * so the first render of subscribers sees the hydrated value.
   *
   * If an atom in this map has not been pre-registered via `initialAtoms`
   * or used yet, its value is queued and applied the first time that atom
   * enters the store via a React hook.
   */
  initialValues?: Record<string, unknown>;

  children: React.ReactNode;
};

/**
 * Provider that scopes atom reads and writes to a request-local `AtomStore`.
 *
 * Wrap the root of your component tree (or any subtree) with this provider
 * to give that subtree its own isolated copy of every atom's state. This is
 * the supported pattern for SSR in Next.js, Remix, and TanStack Start —
 * each request creates its own store, so concurrent requests cannot see
 * each other's state.
 *
 * Without a provider, atoms fall back to the module-level singleton in a
 * browser (the historical client-only behavior). On a server (no
 * `document`) that fallback throws, because the singleton is shared by
 * every concurrent request.
 *
 * Auto-created stores are destroyed a tick after unmount, and not at all if
 * the provider mounts again in between (React StrictMode), so a simulated
 * remount keeps its hydrated values.
 */
export function AtomStoreProvider({
  store,
  initialAtoms,
  initialValues,
  children,
}: AtomStoreProviderProps) {
  const [activeStore] = useState<AtomStore>(() => {
    const next = store ?? createAtomStore();

    if (initialAtoms) {
      for (const atomTemplate of initialAtoms) {
        next.use(atomTemplate);
      }
    }

    if (initialValues) {
      next.hydrate(initialValues);
    }

    return next;
  });

  // Only auto-destroy stores that the provider itself created. Stores
  // passed in via props are owned by the caller.
  useDeferredDestroy(() => activeStore.destroy(), !store);

  return (
    <AtomStoreContext.Provider value={activeStore}>
      {children}
    </AtomStoreContext.Provider>
  );
}

/**
 * Read the active atom store. Returns null when no `<AtomStoreProvider>` is
 * mounted in the tree above this component.
 */
export function useAtomStore(): AtomStore | null {
  return useContext(AtomStoreContext);
}

/**
 * Resolve an atom for the current render context.
 *
 * Two call shapes:
 *
 * - `useAtom(template)` — pass an atom you imported. Returns the
 *   store-scoped clone if a `<AtomStoreProvider>` is mounted above; passing
 *   an atom that is already a scoped clone returns that same clone. Without
 *   a provider it returns the template itself in a browser and THROWS on a
 *   server. Use this when you need to call action methods
 *   (`startLoading()`, `open()`, etc.) from event handlers in an SSR-safe
 *   way. Atoms created with `register: false` (local atoms) are returned
 *   unchanged in every case.
 *
 * - `useAtom(key)` — pass a string key. Returns the scoped atom registered
 *   under that key in the active store, or `undefined` when no provider is
 *   mounted (in a browser) or the key has not entered the store. On a
 *   server without a provider it throws. This is a legacy escape hatch;
 *   prefer the template form.
 */
export function useAtom<V, A extends Record<string, any> = {}>(
  template: Atom<V, A>
): Atom<V, A>;
export function useAtom<V = any>(key: string): Atom<V> | undefined;
export function useAtom(arg: Atom<any> | string): Atom<any> | undefined {
  const store = useContext(AtomStoreContext);

  if (typeof arg === "string") {
    return resolveAtomByKey(store, arg);
  }

  return resolveAtom(store, arg);
}
