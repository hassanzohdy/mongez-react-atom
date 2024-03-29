import events, { EventSubscription } from "@mongez/events";
import { clone, get, Random } from "@mongez/reinforcements";
import {
  Atom,
  AtomOptions,
  AtomPartialChangeCallback,
  AtomValue,
} from "./types";

export const atoms: Atom<any>[] = [];

/**
 * Get atom by name
 */
export function getAtom<T>(name: string): Atom<T> | undefined {
  return atoms.find((atom) => atom.key === name);
}

export function createAtom<Value = any>(data: AtomOptions<AtomValue<Value>>) {
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
      this.update([...this.currentValue, item] as Value);
    },
    removeItem(indexOrCallback) {
      const index =
        typeof indexOrCallback === "function"
          ? (this.value as any[]).findIndex(indexOrCallback)
          : indexOrCallback;

      if (index === -1) return;

      this.update((this.value as any[]).filter((_, i) => i !== index) as Value);
    },
    removeItems(indexesOrCallback) {
      const newData: any =
        typeof indexesOrCallback === "function"
          ? (this.value as any[]).filter(
              indexesOrCallback as (item: any, index: number) => boolean
            )
          : (this.value as any[]).filter(
              (_, i) => !(indexesOrCallback as number[]).includes(i)
            );

      this.update(newData as Value);
    },
    getItem(indexOrCallback) {
      const index =
        typeof indexOrCallback === "function"
          ? (this.value as any[]).findIndex(indexOrCallback)
          : indexOrCallback;

      if (index === -1) return;

      return (this.value as any)[index];
    },
    getItemIndex(
      callback: (item: any, index: number, array: any[]) => boolean
    ) {
      return (this.value as any[]).findIndex(callback);
    },
    map(callback: (item: any, index: number, array: any[]) => any) {
      this.update((this.value as any[]).map(callback) as Value);
    },
    get length() {
      return (this.value as any[])?.length;
    },
    replaceItem(index, item) {
      this.update([
        ...(this.value as any[]).slice(0, index),
        item,
        ...(this.value as any[]).slice(index + 1),
      ] as Value);
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
    silentChange<T extends keyof Value>(key: T, newValue: any) {
      this.silentUpdate({
        ...this.currentValue,
        [key]: newValue,
      });
    },
    merge(newValue: Partial<Value>) {
      this.update({
        ...this.currentValue,
        ...newValue,
      });
    },
    update(newValue: ((oldValue: Value, atom: Atom<Value>) => Value) | Value) {
      if (newValue === this.currentValue) return;

      const oldValue = this.currentValue;

      if (typeof newValue === "function") {
        newValue = (newValue as any)(oldValue, this);
      }

      if (data.beforeUpdate) {
        newValue = data.beforeUpdate(newValue as Value, oldValue, this);
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
    silentUpdate(
      newValue: ((oldValue: Value, atom: Atom<Value>) => Value) | Value
    ) {
      if (newValue === this.currentValue) return;

      const oldValue = this.currentValue;

      if (typeof newValue === "function") {
        newValue = (newValue as any)(oldValue, this);
      }

      if (data.beforeUpdate) {
        newValue = data.beforeUpdate(newValue as Value, oldValue, this);
      }

      this.currentValue = newValue;
    },
    onChange(
      callback: (newValue: Value, oldValue: Value, atom: Atom<Value>) => void
    ): EventSubscription {
      return events.subscribe(event("update"), callback);
    },
    onReset(callback: (atom: Atom<Value>) => void): EventSubscription {
      return events.subscribe(event("reset"), callback);
    },
    get<T extends keyof Value>(key: T, defaultValue?: any): Value[T] {
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
      const update = this.update(this.defaultValue);
      events.trigger(event("reset"), this);

      return update;
    },
    /**
     * Reset the value without triggering the update event
     * But this will trigger the reset event
     */
    silentReset() {
      this.currentValue = clone(this.defaultValue);
      events.trigger(event("reset"), this);

      return this;
    },
    clone() {
      return createAtom({
        key: this.key + "Cloned" + Random.int(1000, 9999),
        default: clone(this.currentValue),
        beforeUpdate: data.beforeUpdate,
        get: data.get,
        onUpdate: data.onUpdate,
      });
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
export function plainAtom<Value = any>(
  data: AtomOptions<AtomValue<Value>>
): Atom<AtomValue<Value>> {
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

/**
 * Return atoms in object format
 */
export function atomsObject(): { [key: string]: Atom<any> } {
  return atoms.reduce((acc: any, atom: Atom) => {
    acc[atom.key] = { ...atom };
    return acc;
  }, {});
}
