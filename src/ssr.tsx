import React, { createContext, useContext } from "react";
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

export function AtomProvider({ children }: { children: React.ReactNode }) {
  return (
    <AtomContext.Provider value={atomsObject()}>
      {children}
    </AtomContext.Provider>
  );
}
