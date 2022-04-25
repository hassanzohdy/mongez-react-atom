import React from "react";
import { Atom, AtomProps } from "./types";
import { Obj } from "@mongez/reinforcements";
import events, { EventSubscription } from "@mongez/events";

const atoms: Atom[] = [];

/**
 * Get atom by name
 */
export function getAtom(name: string): Atom | null {
  return atoms.find((atom) => atom.name === name) || null;
}

/**
 * Get atom value either by sending the atom object or the its name only
 */
export function getAtomValue(atom: string | Atom): any {
  if (typeof atom === "string") {
    atom = getAtom(atom) as Atom;
  }

  if (!atom) return;

  return atom.value;
}

function createAtom(data: AtomProps): Atom {
  let defaultValue = data.default;
  let atomValue = data.default;

  if (defaultValue && typeof defaultValue === "object") {
    atomValue = defaultValue = Obj.clone(defaultValue);
  }

  return {
    default: defaultValue,
    currentValue: atomValue,
    name: data.name,
    get defaultValue() {
      return this.default;
    },
    get value(): any {
      return this.currentValue;
    },
    update(newValue: any): void {
      const oldValue = this.currentValue;
      if (typeof newValue === "function") {
        newValue = newValue(oldValue, this);
      }

      if (data.beforeUpdate) {
        newValue = data.beforeUpdate(newValue);
      }

      this.currentValue = newValue;
      events.trigger(
        `atoms.${this.name}.update`,
        this.currentValue,
        oldValue,
        this
      );
    },
    onChange(
      callback: (newValue: any, oldValue: any, atom: Atom) => void
    ): EventSubscription {
      return events.subscribe(`atoms.${this.name}.update`, callback);
    },
    destroy() {
      events.trigger(`atoms.${this.name}.delete`, this);

      events.unsubscribeNamespace(`atoms.${this.name}`);
      const atomIndex: number = atoms.findIndex(
        (atom) => atom.name === this.name
      );
      if (atomIndex !== -1) {
        atoms.splice(atomIndex, 1);
      }
    },
    onDestroy(callback: (atom: Atom) => void): EventSubscription {
      return events.subscribe(`atoms.${this.name}.delete`, callback);
    },
    reset() {
      return this.update(this.defaultValue);
    },
  };
}

/**
 * Create a new atom
 */
export function atom(data: AtomProps): Atom {
  if (getAtom(data.name)) {
    throw new Error(
      `An atom is already defined with that name ${data.name}, please use another name for this atom.`
    );
  }

  const atom: Atom = createAtom(data);

  atoms.push(atom);

  return atom;
}

/**
 * Get all atoms list
 */
export function atomsList(): Atom[] {
  return atoms;
}

/**
 * Get current atom value from state
 * This will re-render the component once the atom's value is changed
 * @returns
 */
export function useAtomValue(atom: Atom): any {
  return useAtom(atom)[0];
}

/**
 * Get the atom value state changer
 */
export function useAtomState(atom: Atom): any {
  return useAtom(atom)[1];
}

/**
 * Use the given atom and return the atom value and atom value state changer
 */
export function useAtom(atom: Atom): any {
  const [value, setValue] = React.useState(atom.value);

  React.useEffect(() => {
    const event: EventSubscription = atom.onChange(setValue);

    return () => event.unsubscribe();
  }, []);

  return [
    value,
    (newValue: any) => {
      if (typeof newValue === "function") {
        newValue = newValue(value, atom);
      }

      atom.update(newValue);
      setValue(newValue);
    },
  ];
}
