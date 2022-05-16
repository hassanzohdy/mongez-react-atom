import React, { useEffect, useState } from "react";
import { Obj } from "@mongez/reinforcements";
import events, { EventSubscription } from "@mongez/events";
import { Atom, AtomPartialChangeCallback, AtomOptions } from "./types";

let timeoutId = undefined;

function debounce(callback, wait: number = 0) {
  // Clear previous delayed action, if existent
  if (timeoutId !== undefined) {
    clearTimeout(timeoutId);
    timeoutId = undefined;
  }

  // Start new delayed action for latest call
  timeoutId = setTimeout(() => {
    callback();
    timeoutId = undefined; // Clear timeout
  }, wait);
}

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

function createAtom(data: AtomOptions): Atom {
  let defaultValue = data.default;
  let atomValue = data.default;

  let atomValueIsObject = false;

  if (defaultValue && typeof defaultValue === "object") {
    atomValue = defaultValue = Obj.clone(defaultValue);
    atomValueIsObject = true;
  }

  let atomEvent: string = `atoms.${data.name}`;

  const event = (type: string): string => `${atomEvent}.${type}`;

  let changes = {};

  return {
    default: defaultValue,
    currentValue: atomValue,
    name: data.name,
    watch(key: string, callback: AtomPartialChangeCallback): EventSubscription {
      return events.subscribe(event(`update.partial.${key}`), callback);
    },
    get defaultValue() {
      return this.default;
    },
    get value(): any {
      return this.currentValue;
    },
    change(key: string, newValue: any) {
      changes[key] = newValue;
      debounce(() => {
        let object = Obj.clone(this.currentValue);

        for (let key in changes) {
          Obj.set(object, key, changes[key]);
        }

        changes = {};

        this.update(object);
      });
    },
    update(newValue: any): void {
      debounce(() => {
        const oldValue = this.currentValue;

        if (typeof newValue === "function") {
          newValue = newValue(oldValue, this);
        }

        if (data.beforeUpdate) {
          newValue = data.beforeUpdate(newValue);
        }

        this.currentValue = newValue;

        if (atomValueIsObject) {
          if (newValue && typeof newValue === "object") {
            let flattenOldValue = Obj.flatten(oldValue);
            let flattenNewValue = Obj.flatten(newValue);

            for (let key in flattenOldValue) {
              if (!Object.prototype.hasOwnProperty.call(flattenNewValue, key)) {
                events.trigger(event(`update.partial.${key}`), undefined, flattenOldValue[key], this);
              } else if (flattenOldValue[key] !== flattenNewValue[key]) {
                events.trigger(event(`update.partial.${key}`), flattenNewValue[key], flattenOldValue[key], this);
              }
            }

            for (let key in flattenNewValue) {
              if (!Object.prototype.hasOwnProperty.call(flattenOldValue, key)) {
                events.trigger(event(`update.partial.${key}`), flattenNewValue[key], undefined, this);
              }
            }
          }
        }

        events.trigger(
          event('update'),
          this.currentValue,
          oldValue,
          this
        );
      });
    },
    onChange(
      callback: (newValue: any, oldValue: any, atom: Atom) => void
    ): EventSubscription {
      return events.subscribe(event('update'), callback);
    },
    get(key: string, defaultValue: any = null): any {
      return Obj.get(this.currentValue, key, defaultValue);
    },
    destroy() {
      events.trigger(event('delete'), this);

      events.unsubscribeNamespace(atomEvent);
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
export function atom(data: AtomOptions): Atom {
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
  const [value, setValue] = useState(atom.value);

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

/**
 * Watch for atom key's change
 */
export function useAtomWatch(atom: Atom, key: string, callback: AtomPartialChangeCallback) {
  useEffect(() => {
    const event = atom.watch(key, callback);

    return () => event.unsubscribe();
  }, [key]);
}

/**
 * Listen for change for the given atom
 */
export function useAtomWatcher(atom: Atom, key: string) {
  const [value, setValue] = useState(atom.get(key));

  useAtomWatch(atom, key, setValue);

  return [value, setValue];
}