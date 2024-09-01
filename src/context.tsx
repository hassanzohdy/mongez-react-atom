"use client";

import { atomsList, type Atom } from "@mongez/atom";
import React, { createContext, useContext, useState } from "react";

export const AtomContext = createContext({});

/**
 * Get clone of the given atom key
 */
export function useAtom<T = any>(key: string): Atom<T> {
  const context = useContext(AtomContext) as any;

  return context[key];
}

export function AtomProvider({
  register = atomsList(),
  children,
}: {
  register?: Atom<any>[];
  children: React.ReactNode;
}) {
  const [currentAtoms] = useState(() => {
    const atoms = {};

    for (const atom of register) {
      const newAtom = atom.clone();

      atoms[atom.key] = newAtom;
    }

    return atoms;
  });

  console.log(currentAtoms);

  return (
    <AtomContext.Provider value={currentAtoms}>{children}</AtomContext.Provider>
  );
}
