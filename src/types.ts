import type React from "react";
import type {
  Atom,
  AtomPartialChangeCallback,
  AtomActions,
} from "@mongez/atom";

export type ReactActions<Value> = {
  /**
   * Get and watch for the given key in the atom's value
   */
  use<T extends keyof Value>(key: T): Value[T];

  /**
   * An alias for useAtomWatch but specific for this atom
   */
  useWatch: <T extends keyof Value>(
    key: T,
    callback: AtomPartialChangeCallback
  ) => void;

  /**
   * React atom provider
   */
  Provider: React.ComponentType<{
    value: Partial<Value>;
    children: React.ReactNode;
  }>;

  /**
   * Watch for atom's value change and return it
   * When the atom's value is changed, the component will be rerendered again.
   */
  useValue: () => Value;

  /**
   * Use state for atom value
   *
   * This will return an array with the first item is the atom's value
   * and the second item is a function to update the atom's value
   * As it will cause a re-render once the atoms'value is updated
   */
  useState: () => [Value, (value: Value) => void];
};

export type ReactAtom<
  Value = any,
  Actions extends AtomActions<Value> = AtomActions<Value>
> = Atom<Value, ReactActions<Value> & Actions>;
