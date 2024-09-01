"use client";

import { atomsList, type Atom } from "@mongez/atom";
import React, { createContext, useContext, useState } from "react";
import { ReactAtom } from "./types";

export const AtomContext = createContext({});

/**
 * Get clone of the given atom key
 */
export function useAtom<T = any>(key: string): ReactAtom<T> {
  const context = useContext(AtomContext) as any;

  return context[key];
}

export function AtomProvider({
  register = atomsList(),
  defaultValue,
  children,
}: {
  register?: Atom<any>[];
  children: React.ReactNode;
  defaultValue?: any;
}) {
  const [currentAtoms] = useState(() => {
    const atoms = {};

    for (const atom of register) {
      const newAtom = atom.clone();

      atoms[atom.key] = newAtom;

      if (defaultValue?.[atom.key]) {
        newAtom.silentUpdate(defaultValue[atom.key]);
      }
    }

    return atoms;
  });

  console.log(currentAtoms);

  return (
    <AtomContext.Provider value={currentAtoms}>{children}</AtomContext.Provider>
  );
}
