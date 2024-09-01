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
import { EventSubscription } from "@mongez/events";
import { useEffect, useState } from "react";
import type { ReactActions, ReactAtom } from "./types";

function reactActions<Value>(data: any): ReactActions<Value> {
  return {
    ...data.actions,
    Provider(props) {
      const atom = this as unknown as Atom<Value>;
      atom.update(props.value as Value);

      return props.children;
    },
    useWatch(key, callback) {
      const atom = this as unknown as Atom<Value>;

      useEffect(() => {
        const event = atom.watch(key, callback);

        return () => event.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [key, callback]);

      return atom.get(key);
    },
    useState() {
      const atom = this as unknown as Atom<Value>;
      const [value, setValue] = useState(atom.currentValue);

      useEffect(() => {
        const event: EventSubscription = atom.onChange(setValue);

        return () => event.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return [value, atom.update.bind(atom)];
    },
    useValue() {
      const atom = this as ReactAtom<Value>;
      return atom.useState()[0];
    },
    use<K extends keyof Value>(key: K): Value[K] {
      const atom = this as ReactAtom<Value>;
      const value = atom.get(key);
      const [, setValue] = useState(value);

      useEffect(() => {
        const event = atom.watch(key, setValue);

        return () => event.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [key]);

      return value;
    },
    clone() {
      return atom({
        ...data,
        default: (this as unknown as Atom).currentValue,
      });
    },
  };
}

type ReactAtomAction = ReturnType<typeof reactActions>;

/**
 * Create a new atom
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
 * Create a react collection atom to work with arrays
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
