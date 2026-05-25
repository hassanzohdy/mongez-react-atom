"use client";

import { type Atom } from "@mongez/atom";
import React from "react";
import { AtomStoreContext, AtomStoreProvider } from "./store";

/**
 * @deprecated Re-export of `AtomStoreContext` from "./store". The context
 * value type changed from a key→atom record to an `AtomStore` instance; if
 * you only consumed this via `useAtom(key)` the migration is transparent.
 */
export const AtomContext = AtomStoreContext;

/**
 * Backwards-compatible alias for `<AtomStoreProvider>`.
 *
 * Maps the legacy `register` (atoms to pre-clone) to `initialAtoms`, and
 * `defaultValue` (record of initial atom values) to `initialValues`.
 *
 * @deprecated Use `<AtomStoreProvider>` from "./store" directly.
 */
export function AtomProvider({
  register,
  defaultValue,
  children,
}: {
  register?: Atom<any>[];
  defaultValue?: Record<string, unknown>;
  children: React.ReactNode;
}) {
  return (
    <AtomStoreProvider initialAtoms={register} initialValues={defaultValue}>
      {children}
    </AtomStoreProvider>
  );
}
