import events, { EventSubscription } from "@mongez/events";
import { clone, get, set } from "@mongez/reinforcements";
import { useEffect, useState } from "react";
import {
  Atom,
  AtomOptions,
  AtomPartialChangeCallback,
  AtomValue,
} from "./types";

let timeoutId: NodeJS.Timeout | undefined = undefined;

function debounce(callback: () => void, wait = 0) {
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
  return atoms.find(atom => atom.key === name) || null;
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
  callback: AtomPartialChangeCallback,
) {
  useEffect(() => {
    const event = atom.watch(key, callback);

    return () => event.unsubscribe();
  }, [atom, key, callback]);
}

/**
 * Listen for change for the given atom
 */
export function useAtomWatcher<Value extends Record<string, any>, Actions>(
  atom: Atom<Value, Actions>,
  key: string,
) {
  const value: Value = atom.get(key);
  const [, setValue] = useState<Value>(value);

  useAtomWatch(atom, key, setValue);

  return value;
}

function createAtom<Value extends Record<string, any> = any, Actions = any>(
  data: AtomOptions<AtomValue<Value>, Actions>,
) {
  let defaultValue = data.default;
  let atomValue = data.default;

  let atomValueIsObject = false;

  if (defaultValue && typeof defaultValue === "object") {
    atomValue = defaultValue = clone(defaultValue);
    atomValueIsObject = true;
  }

  const atomType = Array.isArray(defaultValue) ? "array" : typeof defaultValue;

  const atomEvent = `atoms.${data.key}`;

  const event = (type: string): string => `${atomEvent}.${type}`;

  let changes: any = {};

  const watchers: any = {};

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
      this.update([...this.currentValue, item]);
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
              indexesOrCallback as (item: any, index: number) => boolean,
            )
          : this.value.filter(
              (_, i) => !(indexesOrCallback as number[]).includes(i),
            ),
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
      callback: (item: any, index: number, array: any[]) => boolean,
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
    useWatch<T extends keyof Value>(
      key: T,
      callback: AtomPartialChangeCallback,
    ) {
      return useAtomWatch(this, key as any, callback);
    },
    use<T extends keyof Value>(
      key?: keyof Value,
    ): T extends keyof Value ? Value[T] : Value {
      if (!key) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return this.useValue() as any;
      } else {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return this.useWatcher(key as string) as any;
      }
    },
    useValue(defaultValue?: any): Value {
      return useAtom(this, defaultValue || this.value)[0];
    },
    useWatcher<T extends keyof Value>(key: T) {
      return useAtomWatcher(this, key as string) as Value[T];
    },
    watch<T extends keyof Value>(
      key: T,
      callback: AtomPartialChangeCallback,
    ): EventSubscription {
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
    change<T extends keyof Value>(key: T, newValue: any) {
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
        newValue = data.beforeUpdate(newValue, oldValue, this as any);
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
                  callback(keyNewValue, keyOldValue),
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
        atom: Atom<Value, Actions>,
      ) => void,
    ): EventSubscription {
      return events.subscribe(event("update"), callback);
    },
    get<T extends keyof Value>(key: T, defaultValue: any = null): any {
      if (data.get) {
        return data.get(key as string, defaultValue, this.currentValue);
      }

      const value = get(this.currentValue, key as string, defaultValue);

      // if the value is bindable, then bind the current value to be used as `this`
      return value?.bind ? value.bind(this.currentValue) : value;
    },
    destroy() {
      events.trigger(event("delete"), this);

      events.unsubscribeNamespace(atomEvent);
      const atomIndex: number = atoms.findIndex(atom => atom.key === this.key);
      if (atomIndex !== -1) {
        atoms.splice(atomIndex, 1);
      }
    },
    onDestroy(
      callback: (atom: Atom<Value, Actions>) => void,
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
      atomActions[actionKey] = data.actions?.[actionKey].bind(atom);
    });
  }

  if (data.onUpdate) {
    events.subscribe(event("update"), data.onUpdate.bind(atom));
  }

  return atom;
}

/**
 * Create a new atom
 */
export function atom<Value = any, Actions = any>(
  data: AtomOptions<AtomValue<Value>, Actions>,
): Atom<AtomValue<Value>, Actions> {
  if (getAtom((data.key || data.name) as string)) {
    throw new Error(
      `An atom is already defined with that name ${data.key}, please use another name for this atom.`,
    );
  }

  if (process.env.NODE_ENV === "development" && data.name) {
    console.error(
      `Atom "${data.name}" is using the deprecated "name" property, please use "key" instead. this will be removed in the next major version.`,
    );
  }

  const atom = createAtom<AtomValue<Value>, Actions>(data as any);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
export function useAtomValue<Value = any>(
  atom: Atom<AtomValue<Value>, any>,
): any {
  return useAtom(atom)[0];
}

/**
 * Get the atom value state changer
 */
export function useAtomState<Value = any, Actions = any>(
  atom: Atom<AtomValue<Value>, Actions>,
  defaultValue?: any,
): any {
  return useAtom(atom, defaultValue)[1];
}
