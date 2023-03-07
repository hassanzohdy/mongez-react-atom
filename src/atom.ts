import events, { EventSubscription } from "@mongez/events";
import { clone, get } from "@mongez/reinforcements";
import { useEffect, useState } from "react";
import {
  Atom,
  AtomOptions,
  AtomPartialChangeCallback,
  AtomValue
} from "./types";

const atoms: Atom<any>[] = [];

/**
 * Get atom by name
 */
export function getAtom<T>(name: string): Atom<T> | undefined {
  return atoms.find((atom) => atom.key === name);
}

function createAtom<Value = any>(data: AtomOptions<AtomValue<Value>>) {
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

  const watchers: any = {};

  const atomKey = data.key;

  const atom: Atom<Value> = {
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
          ? (this.value as any[]).findIndex(indexOrCallback)
          : indexOrCallback;

      if (index === -1) return;

      this.update((this.value as any[]).filter((_, i) => i !== index));
    },
    removeItems(indexesOrCallback) {
      this.update(
        typeof indexesOrCallback === "function"
          ? (this.value as any[]).filter(
              indexesOrCallback as (item: any, index: number) => boolean
            )
          : (this.value as any[]).filter(
              (_, i) => !(indexesOrCallback as number[]).includes(i)
            )
      );
    },
    getItem(indexOrCallback) {
      const index =
        typeof indexOrCallback === "function"
          ? (this.value as any[]).findIndex(indexOrCallback)
          : indexOrCallback;

      if (index === -1) return;

      return this.value[index];
    },
    getItemIndex(
      callback: (item: any, index: number, array: any[]) => boolean
    ) {
      return (this.value as any[]).findIndex(callback);
    },
    map(callback: (item: any, index: number, array: any[]) => any) {
      this.update((this.value as any[]).map(callback));
    },
    get length() {
      return (this.value as any[]).length;
    },
    replaceItem(index, item) {
      this.update([
        ...(this.value as any[]).slice(0, index),
        item,
        ...(this.value as any[]).slice(index + 1),
      ]);
    },
    useWatch<T extends keyof Value>(
      key: T,
      callback: AtomPartialChangeCallback
    ) {
      useEffect(() => {
        const event = this.watch(key, callback);

        return () => event.unsubscribe();
      }, [key, callback]);
    },
    use<T extends keyof Value>(
      key?: keyof Value
    ): T extends keyof Value ? Value[T] : Value {
      if (!key) {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return this.useValue() as any;
      } else {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return this.useWatcher(key as any) as any;
      }
    },
    useState() {
      const [value, setValue] = useState(this.currentValue);

      useEffect(() => {
        const event: EventSubscription = this.onChange(setValue);

        return () => event.unsubscribe();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);

      return [value, this.update.bind(this)];
    },
    useValue() {
      return this.useState()[0];
    },
    useWatcher<T extends keyof Value>(key: T) {
      const value = this.get(key);
      const [, setValue] = useState(value);

      this.useWatch(key, setValue);

      return value;
    },
    watch<T extends keyof Value>(
      key: T,
      callback: AtomPartialChangeCallback
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
      this.update({
        ...this.currentValue,
        [key]: newValue,
      });
    },
    update(newValue: Value) {
      if (newValue === this.currentValue) return;

      const oldValue = this.currentValue;

      if (typeof newValue === "function") {
        newValue = newValue(oldValue, this);
      }

      if (data.beforeUpdate) {
        newValue = data.beforeUpdate(newValue, oldValue, this);
      }

      this.currentValue = newValue;
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
    },
    onChange(
      callback: (newValue: Value, oldValue: Value, atom: Atom<Value>) => void
    ): EventSubscription {
      return events.subscribe(event("update"), callback);
    },
    get<T extends keyof Value>(key: T, defaultValue: any = null): Value[T] {
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
      const atomIndex: number = atoms.findIndex(
        (atom) => atom.key === this.key
      );
      if (atomIndex !== -1) {
        atoms.splice(atomIndex, 1);
      }
    },
    onDestroy(callback: (atom: Atom<Value>) => void): EventSubscription {
      return events.subscribe(`atoms.${this.key}.delete`, callback);
    },
    reset() {
      return this.update(this.defaultValue);
    },
  };

  if (data.onUpdate) {
    events.subscribe(event("update"), data.onUpdate.bind(atom));
  }

  return atom;
}

/**
 * Create a new atom
 */
export function atom<Value = any>(
  data: AtomOptions<AtomValue<Value>>
): Atom<AtomValue<Value>> {
  // if (getAtom<Value>(data.key)) {
  //   throw new Error(
  //     `An atom is already defined with that name '${data.key}', please use another name for this atom.`
  //   );
  // }

  const atom = createAtom<AtomValue<Value>>(data as any);

  atoms.push(atom);

  return atom;
}

/**
 * Get all atoms list
 */
export function atomsList(): Atom<any>[] {
  return atoms;
}
