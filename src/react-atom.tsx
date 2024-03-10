"use client";
/* eslint-disable react-hooks/rules-of-hooks */
import { EventSubscription } from "@mongez/events";
import React, { useEffect, useState } from "react";
import { plainAtom } from "./atom";
import type {
  Atom,
  AtomOptions,
  AtomPartialChangeCallback,
  AtomValue,
  ReactAtom,
} from "./types";

/**
 * Create a new atom
 */
export function atom<Value = any>(data: AtomOptions<AtomValue<Value>>) {
  const newAtom = plainAtom(data);

  return reactAtom(newAtom);
}

export function reactAtom<Value>(atom: Atom<Value>): ReactAtom<Value> {
  let outputAtom = atom as ReactAtom<Value>;

  outputAtom.useWatch = function <T extends keyof Value>(
    key: T,
    callback: AtomPartialChangeCallback
  ) {
    useEffect(() => {
      const event = this.watch(key, callback);

      return () => event.unsubscribe();
    }, [key, callback]);
  };

  outputAtom.Provider = (props) => {
    atom.update(props.value as Value);

    return props.children;
  };

  outputAtom.Provider.displayName = `${outputAtom.key}.Provider`;

  outputAtom.useState = () => {
    const [value, setValue] = useState(outputAtom.currentValue);

    useEffect(() => {
      const event: EventSubscription = outputAtom.onChange(setValue);

      return () => event.unsubscribe();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return [value, outputAtom.update.bind(outputAtom)];
  };

  outputAtom.useValue = () => {
    return outputAtom.useState()[0];
  };

  outputAtom.use = function <T extends keyof Value>(key: T): Value[T] {
    const value = outputAtom.get(key);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [, setValue] = useState(value);

    outputAtom.useWatch(key, setValue);

    return value;
  };

  outputAtom.clone = () => {
    return reactAtom(atom.clone());
  };

  return outputAtom;
}
