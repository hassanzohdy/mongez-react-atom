import events, { EventSubscription } from "@mongez/events";
import { clone, get, set } from "@mongez/reinforcements";
import { useEffect, useState } from "react";
import { Atom, AtomOptions, AtomPartialChangeCallback } from "./types";

let timeoutId: NodeJS.Timeout | undefined = undefined;

function debounce(callback: () => void, wait: number = 0) {
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

const atoms: Atom<any, any>[] = [];

/**
 * Get atom by name
 */
export function getAtom(name: string): Atom<any, any> | null {
  return atoms.find((atom) => atom.key === name) || null;
}

/**
 * Get atom value either by sending the atom object or the its name only
 */
export function getAtomValue(atom: string | Atom<any, any>): any {
  if (typeof atom === "string") {
    atom = getAtom(atom) as Atom<any, any>;
  }

  if (!atom) return;

  return atom.value;
}

/**
 * Watch for atom key's change
 */
export function useAtomWatch(
  atom: Atom<any, any>,
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
export function useAtomWatcher<Value = any, Actions = any>(
  atom: Atom<Value, Actions>,
  key: string
) {
  const value: Value = atom.get(key);
  const [, setValue] = useState<Value>(value);

  useAtomWatch(atom, key, setValue);

  return value;
}

function createAtom<Value = any, Actions = any>(
  data: AtomOptions<Value, Actions>
): Atom<Value, Actions> {
  let defaultValue = data.default;
  let atomValue = data.default;

  let atomValueIsObject = false;

  if (defaultValue && typeof defaultValue === "object") {
    atomValue = defaultValue = clone(defaultValue);
    atomValueIsObject = true;
  }

  const atomType = Array.isArray(defaultValue) ? "array" : typeof defaultValue;

  const atomEvent: string = `atoms.${data.key}`;

  const event = (type: string): string => `${atomEvent}.${type}`;

  let changes = {};

  const watchers = {};

  const atomKey = data.key || data.name;

  const atomActions = {} as Actions;

  const atom: Atom<Value, Actions> = {
    default: defaultValue,
    currentValue: atomValue,
    key: atomKey,
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
    getItemIndex(
      callback: (item: any, index: number, array: any[]) => boolean
    ) {
      return this.value.findIndex(callback);
    },
    map(callback: (item: any, index: number, array: any[]) => any) {
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
    useValue(defaultValue?: any) {
      return useAtom(this, defaultValue || this.value)[0];
    },
    useWatcher<T = never>(key: string): T {
      return useAtomWatcher<T>(this, key);
    },
    watch(key: string, callback: AtomPartialChangeCallback): EventSubscription {
      if (!watchers[key]) {
        watchers[key] = [];
      }

      watchers[key].push(callback);
      const callbackIndex = watchers[key].length - 1;

      return {
        unsubscribe: () => {
          watchers[key].splice(callbackIndex, 1);
        },
      } as EventSubscription;
    },
    get defaultValue() {
      return this.default;
    },
    get value(): Value {
      return this.currentValue;
    },
    change(key: string, newValue: any) {
      changes[key] = newValue;
      debounce(() => {
        const object = clone(this.currentValue);

        for (const key in changes) {
          set(object, key, changes[key]);
        }

        changes = {};

        this.update(object);
      });
    },
    update(newValue: any): void {
      if (newValue === this.currentValue) return;

      const oldValue = this.currentValue;

      if (typeof newValue === "function") {
        newValue = newValue(oldValue, this);
      }

      if (data.beforeUpdate) {
        newValue = data.beforeUpdate(newValue, oldValue, this);
      }

      this.currentValue = newValue;
      debounce(() => {
        events.trigger(event("update"), this.currentValue, oldValue, this);

        if (atomValueIsObject) {
          for (const key in watchers) {
            const keyOldValue = get(oldValue, key);
            const keyNewValue = get(newValue, key);
            if (keyOldValue !== keyNewValue) {
              watchers[key].forEach(
                (callback: (newValue: any, oldValue: any) => void) =>
                  callback(keyNewValue, keyOldValue)
              );
            }
          }
        }
      });
    },
    onChange(
      callback: (
        newValue: any,
        oldValue: any,
        atom: Atom<Value, Actions>
      ) => void
    ): EventSubscription {
      return events.subscribe(event("update"), callback);
    },
    get(key: string, defaultValue: any = null): any {
      if (data.get) {
        return data.get(key, defaultValue, this.currentValue);
      }

      const value = get(this.currentValue, key, defaultValue);

      // if the value is bindable, then bind the current value to be used as `this`
      return value?.bind ? value.bind(this.currentValue) : value;
    },
    destroy() {
      events.trigger(event("delete"), this);

      events.unsubscribeNamespace(atomEvent);
      const atomIndex: number = atoms.findIndex(
        (atom) => atom.key === this.key
      );
      if (atomIndex !== -1) {
        atoms.splice(atomIndex, 1);
      }
    },
    onDestroy(
      callback: (atom: Atom<Value, Actions>) => void
    ): EventSubscription {
      return events.subscribe(`atoms.${this.key}.delete`, callback);
    },
    reset() {
      return this.update(this.defaultValue);
    },
    actions: atomActions,
  };

  if (data.actions) {
    Object.keys(data.actions).forEach((actionKey: string) => {
      atomActions[actionKey] = data.actions![actionKey].bind(atom);
    });
  }

  return atom;
}

/**
 * Create a new atom
 */
export function atom<Value, Actions>(
  data: AtomOptions<Value, Actions>
): Atom<Value, Actions> {
  if (getAtom((data.key || data.name) as string)) {
    throw new Error(
      `An atom is already defined with that name ${data.key}, please use another name for this atom.`
    );
  }

  if (process.env.NODE_ENV === "development" && data.name) {
    console.error(
      `Atom "${data.name}" is using the deprecated "name" property, please use "key" instead. this will be removed in the next major version.`
    );
  }

  const atom: Atom<Value, Actions> = createAtom<Value, Actions>(data);

  atoms.push(atom);

  return atom;
}

/**
 * Get all atoms list
 */
export function atomsList(): Atom<any, any>[] {
  return atoms;
}

/**
 * Use the given atom and return the atom value and atom value state changer
 */
export function useAtom(atom: Atom<any, any>, defaultValue?: any): any {
  const [value, setValue] = useState(atom.value);

  useEffect(() => {
    const event: EventSubscription = atom.onChange(setValue);

    if (defaultValue !== undefined && defaultValue !== atom.value) {
      atom.update(defaultValue);
    }

    return () => event.unsubscribe();
  }, [atom]);

  return [
    value,
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
export function useAtomValue<Value = any>(atom: Atom<Value, any>): any {
  return useAtom(atom)[0];
}

/**
 * Get the atom value state changer
 */
export function useAtomState<Value = any, Actions = any>(
  atom: Atom<Value, Actions>,
  defaultValue?: any
): any {
  return useAtom(atom, defaultValue)[1];
}
