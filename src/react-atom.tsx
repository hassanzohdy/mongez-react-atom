"use client";
/* eslint-disable react-hooks/rules-of-hooks */
import {
  type Atom,
  type AtomActions,
  type AtomCollectionActions,
  type AtomOptions,
  type AtomValue,
  type ObjectAtom,
  atomCollection as baseAtomCollection,
  type CollectionOptions,
  createAtom,
} from "@mongez/atom";
import {
  useCallback,
  useEffect,
  useState as useReactState,
  useSyncExternalStore,
} from "react";
import { useDeferredDestroy, useScopedAtom } from "./scope";
import type { ReactActions, ReactAtom } from "./types";

/**
 * Build the React-aware action bag injected into every atom created via
 * the `atom()` factory in this package.
 *
 * Every hook in here resolves its atom through the store first so that
 * components rendered inside an `<AtomStoreProvider>` operate on the
 * store-scoped clone, not the module-level template. Resolution is
 * idempotent: calling a hook on an atom that is already a scoped clone
 * (`useAtom(template).useValue()`) keeps using that clone.
 *
 * Subscriptions are wired through `useSyncExternalStore` to keep React 18+
 * concurrent rendering tear-free. Its `getServerSnapshot` returns the
 * store's initial/hydrated value, not the live one, so the first client
 * render matches the server render.
 */
function reactActions<Value>(data: any): ReactActions<Value> {
  return {
    ...data.actions,

    Provider(props) {
      const { atom } = useScopedAtom(this as unknown as Atom<Value>);
      useEffect(() => {
        atom.update(props.value as Value);
      }, [props.value, atom]);
      return props.children;
    },

    useWatch(key, callback) {
      const { atom } = useScopedAtom(this as unknown as Atom<Value>);
      useEffect(() => {
        const sub = (atom as unknown as ObjectAtom<Value>).watch(key, callback);
        return () => sub.unsubscribe();
      }, [atom, key, callback]);
    },

    useState() {
      const { atom, getServerValue } = useScopedAtom(
        this as unknown as Atom<Value>
      );

      const subscribe = useCallback(
        (onChange: () => void) => {
          const sub = atom.onChange(onChange);
          return () => sub.unsubscribe();
        },
        [atom]
      );
      const getSnapshot = useCallback(() => atom.value, [atom]);

      const value = useSyncExternalStore(
        subscribe,
        getSnapshot,
        getServerValue
      );

      const setValue = useCallback(
        (next: Value | ((oldValue: Value) => Value)) => {
          atom.update(next as any);
        },
        [atom]
      );

      return [value, setValue];
    },

    useValue() {
      const { atom, getServerValue } = useScopedAtom(
        this as unknown as Atom<Value>
      );

      const subscribe = useCallback(
        (onChange: () => void) => {
          const sub = atom.onChange(onChange);
          return () => sub.unsubscribe();
        },
        [atom]
      );
      const getSnapshot = useCallback(() => atom.value, [atom]);

      return useSyncExternalStore(subscribe, getSnapshot, getServerValue);
    },

    use<K extends keyof Value>(key: K): Value[K] {
      const { atom, getServerKey } = useScopedAtom(
        this as unknown as ReactAtom<Value>
      );

      const subscribe = useCallback(
        (onChange: () => void) => {
          const sub = atom.watch(key, onChange);
          return () => sub.unsubscribe();
        },
        [atom, key]
      );
      const getSnapshot = useCallback(
        () => atom.get(key),
        [atom, key]
      );

      const getServerSnapshot = useCallback(
        () => getServerKey(key as string) as Value[K],
        [getServerKey, key]
      );

      return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
    },
  };
}

/**
 * Create a new React-aware atom.
 *
 * The returned atom carries hooks (`useState`, `useValue`, `use`, `useWatch`)
 * and a `<Provider>` component as instance methods. All hooks honor the
 * nearest `<AtomStoreProvider>` and use `useSyncExternalStore` underneath.
 *
 * Options worth knowing:
 *
 * - `register: false` keeps the atom out of the global `atoms` registry
 *   (a "local" atom). Local atoms bypass `<AtomStoreProvider>` and never
 *   need one, even on the server. Prefer `useLocalAtom()` for state that
 *   belongs to one component instance.
 * - `persist` is hydrated after mount by default
 *   (`persistHydration: "deferred"`), never while the atom is created, so
 *   the first client render matches the server render. Pass
 *   `persistHydration: "immediate"` to read storage at creation (client-only
 *   apps that never server-render).
 */
export function atom<
  Value = any,
  Actions extends AtomActions<Value> = AtomActions<Value>,
>(data: AtomOptions<AtomValue<Value>>): ReactAtom<Value, Actions> {
  return createAtom<Value, any>({
    ...data,
    persistHydration: data.persistHydration ?? "deferred",
    actions: reactActions<Value>(data),
  });
}

let localAtomCounter = 0;

/**
 * Create an atom that belongs to ONE component instance.
 *
 * The atom is created on first render with `register: false`, so it never
 * enters the global registry and never collides with another instance. It
 * ignores `<AtomStoreProvider>`, so it works on the server with no provider
 * and each server render gets its own. It is destroyed when the component
 * unmounts (a tick later, so React StrictMode's simulated remount keeps it).
 *
 * The atom's `key` is suffixed with `.local.<n>` to keep its event topic
 * unique per instance; the `key` you pass is only a readable label.
 *
 *   const form = useLocalAtom({ key: "checkout-form", default: { name: "" } });
 *   const name = form.use("name");
 */
export function useLocalAtom<
  Value = any,
  Actions extends AtomActions<Value> = AtomActions<Value>,
>(data: Omit<AtomOptions<AtomValue<Value>>, "register">): ReactAtom<Value, Actions> {
  const [local] = useReactState(() =>
    atom<Value, Actions>({
      ...data,
      key: `${data.key}.local.${++localAtomCounter}`,
      register: false,
    })
  );

  useDeferredDestroy(() => local.destroy());

  return local;
}

/**
 * Create a React-aware collection atom for working with arrays.
 */
export function atomCollection<
  Value = any,
  Actions extends AtomCollectionActions<Value> = AtomCollectionActions<Value>,
>(options: CollectionOptions<Value>) {
  return baseAtomCollection({
    ...options,
    actions: {
      ...options.actions,
      ...(reactActions(options) as any),
    } as AtomCollectionActions<Value[]> & Actions,
  });
}
