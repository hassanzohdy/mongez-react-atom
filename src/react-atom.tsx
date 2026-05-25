"use client";
/* eslint-disable react-hooks/rules-of-hooks */
import {
  type Atom,
  type AtomActions,
  type AtomCollectionActions,
  type AtomOptions,
  type AtomValue,
  atomCollection as baseAtomCollection,
  type CollectionOptions,
  createAtom,
} from "@mongez/atom";
import {
  useCallback,
  useEffect,
  useSyncExternalStore,
} from "react";
import { useAtom } from "./store";
import type { ReactActions, ReactAtom } from "./types";

/**
 * Build the React-aware action bag injected into every atom created via
 * the `atom()` factory in this package.
 *
 * Every hook in here goes through `useAtom(this)` first so that
 * components rendered inside an `<AtomStoreProvider>` operate on the
 * store-scoped clone, not the module-level template.
 *
 * Subscriptions are wired through `useSyncExternalStore` to keep React 18+
 * concurrent rendering tear-free.
 */
function reactActions<Value>(data: any): ReactActions<Value> {
  return {
    ...data.actions,

    Provider(props) {
      const atom = useAtom(this as unknown as Atom<Value>);
      useEffect(() => {
        atom.update(props.value as Value);
      }, [props.value, atom]);
      return props.children;
    },

    useWatch(key, callback) {
      const atom = useAtom(this as unknown as Atom<Value>);
      useEffect(() => {
        const sub = atom.watch(key, callback);
        return () => sub.unsubscribe();
      }, [atom, key, callback]);
    },

    useState() {
      const atom = useAtom(this as unknown as Atom<Value>);

      const subscribe = useCallback(
        (onChange: () => void) => {
          const sub = atom.onChange(onChange);
          return () => sub.unsubscribe();
        },
        [atom]
      );
      const getSnapshot = useCallback(() => atom.value, [atom]);

      const value = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

      const setValue = useCallback(
        (next: Value | ((oldValue: Value) => Value)) => {
          atom.update(next as any);
        },
        [atom]
      );

      return [value, setValue];
    },

    useValue() {
      const atom = useAtom(this as unknown as Atom<Value>);

      const subscribe = useCallback(
        (onChange: () => void) => {
          const sub = atom.onChange(onChange);
          return () => sub.unsubscribe();
        },
        [atom]
      );
      const getSnapshot = useCallback(() => atom.value, [atom]);

      return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    },

    use<K extends keyof Value>(key: K): Value[K] {
      const atom = useAtom(this as unknown as ReactAtom<Value>);

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

      return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
    },
  };
}

/**
 * Create a new React-aware atom.
 *
 * The returned atom carries hooks (`useState`, `useValue`, `use`, `useWatch`)
 * and a `<Provider>` component as instance methods. All hooks honor the
 * nearest `<AtomStoreProvider>` and use `useSyncExternalStore` underneath.
 */
export function atom<
  Value = any,
  Actions extends AtomActions<Value> = AtomActions<Value>,
>(data: AtomOptions<AtomValue<Value>>): ReactAtom<Value, Actions> {
  return createAtom<Value, any>({
    ...data,
    actions: reactActions<Value>(data),
  });
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
