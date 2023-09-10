import React, { createContext, useContext, useState } from "react";
import { atomsObject } from "./atom";
import { Atom } from "./types";

export const AtomContext = createContext({});

/**
 * Get clone of the given atom key
 */
export function useAtom<T = any>(key: string): Atom<T> {
  const context = useContext(AtomContext);

  return context[key];
}

export function AtomProvider({
  register: _register,
  children,
}: {
  register: Atom<any>[];
  children: React.ReactNode;
}) {
  const [currentAtoms] = useState(() => {
    const atoms = atomsObject();

    for (const key in atoms) {
      const atom = atoms[key];

      const newAtom = atom.clone();

      atoms[key] = newAtom;
    }

    return atoms;
  });
  return (
    <AtomContext.Provider value={currentAtoms}>{children}</AtomContext.Provider>
  );
}
