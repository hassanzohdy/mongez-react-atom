import { useEffect, useState } from "react";
import { Obj } from "@mongez/reinforcements";
import events, { EventSubscription } from "@mongez/events";
import { Atom, AtomPartialChangeCallback, AtomOptions } from "./types";

let timeoutId: number | undefined = undefined;

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

/**
 * Watch for atom key's change
 */
export function useAtomWatch(
  atom: Atom,
  key: string,
  callback: AtomPartialChangeCallback
) {
  useEffect(() => {
    const event = atom.watch(key, callback);

    return () => event.unsubscribe();
  }, [atom, key, callback]);
}

/**
 * Listen for change for the given atom
 */
export function useAtomWatcher(atom: Atom, key: string) {
  const value = atom.get(key);
  const [, setValue] = useState(value);

  useAtomWatch(atom, key, setValue);

  return value;
}

function createAtom(data: AtomOptions): Atom {
  let defaultValue = data.default;
  let atomValue = data.default;

  let atomValueIsObject = false;

  if (defaultValue && typeof defaultValue === "object") {
    atomValue = defaultValue = Obj.clone(defaultValue);
    atomValueIsObject = true;
  }

  const atomType = Array.isArray(defaultValue) ? "array" : typeof defaultValue;

  const atomEvent: string = `atoms.${data.name}`;

  const event = (type: string): string => `${atomEvent}.${type}`;

  let changes = {};

  const watchers = {};

  return {
    default: defaultValue,
    currentValue: atomValue,
    name: data.name,
    get type() {
      return atomType;
    },
    addItem(item) {
      this.update([...this.value, item]);
    },
    removeItem(indexOrCallback) {
      const index =
        typeof indexOrCallback === "function"
          ? this.value.findIndex(indexOrCallback)
          : indexOrCallback;

      if (index === -1) return;

      this.update(this.value.filter((_, i) => i !== index));
    },
    removeItems(indexesOrCallback) {
      this.update(
        typeof indexesOrCallback === "function"
          ? this.value.filter(
              indexesOrCallback as (item: any, index: number) => boolean
            )
          : this.value.filter(
              (_, i) => !(indexesOrCallback as number[]).includes(i)
            )
      );
    },
    getItem(indexOrCallback) {
      const index =
        typeof indexOrCallback === "function"
          ? this.value.findIndex(indexOrCallback)
          : indexOrCallback;

      if (index === -1) return;

      return this.value[index];
    },
    getItemIndex(callback) {
      return this.value.findIndex(callback);
    },
    map(callback) {
      this.update(this.value.map(callback));
    },
    get length() {
      return this.value.length;
    },
    replaceItem(index, item) {
      this.update([
        ...this.value.slice(0, index),
        item,
        ...this.value.slice(index + 1),
      ]);
    },
    useWatch(key: string, callback: AtomPartialChangeCallback) {
      return useAtomWatch(this, key, callback);
    },
    useValue() {
      return useAtomValue(this);
    },
    useWatcher(key: string) {
      return useAtomWatcher(this, key);
    },
    watch(key: string, callback: AtomPartialChangeCallback): EventSubscription {
      if (!watchers[key]) {
        watchers[key] = [];
      }

      watchers[key].push(callback);
      let callbackIndex = watchers[key].length - 1;

      return {
        unsubscribe: () => {
          watchers[key].splice(callbackIndex, 1);
        },
      } as EventSubscription;
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
      const oldValue = this.currentValue;

      if (typeof newValue === "function") {
        newValue = newValue(oldValue, this);
      }

      if (data.beforeUpdate) {
        newValue = data.beforeUpdate(newValue);
      }

      this.currentValue = newValue;
      debounce(() => {
        events.trigger(event("update"), this.currentValue, oldValue, this);

        if (atomValueIsObject) {
          for (let key in watchers) {
            let keyOldValue = Obj.get(oldValue, key);
            let keyNewValue = Obj.get(newValue, key);
            if (keyOldValue !== keyNewValue) {
              watchers[key].forEach((callback) =>
                callback(keyNewValue, keyOldValue)
              );
            }
          }
        }
      });
    },
    onChange(
      callback: (newValue: any, oldValue: any, atom: Atom) => void
    ): EventSubscription {
      return events.subscribe(event("update"), callback);
    },
    get(key: string, defaultValue: any = null): any {
      if (data.get) {
        return data.get(key, defaultValue, this.currentValue);
      }

      let value = Obj.get(this.currentValue, key, defaultValue);

      return value?.bind ? value.bind(this.currentValue) : value;
    },
    destroy() {
      events.trigger(event("delete"), this);

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
 * Use the given atom and return the atom value and atom value state changer
 */
export function useAtom(atom: Atom): any {
  const [, setValue] = useState(atom.value);

  useEffect(() => {
    const event: EventSubscription = atom.onChange(setValue);

    return () => event.unsubscribe();
  }, [atom]);

  return [
    atom.value,
    (newValue: any) => {
      if (typeof newValue === "function") {
        newValue = newValue(atom.value, atom);
      }

      atom.update(newValue);
    },
  ];
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
