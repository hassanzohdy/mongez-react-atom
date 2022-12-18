import { EventSubscription } from "@mongez/events";

export type AtomPartialChangeCallback = (
  newValue: any,
  oldValue: any,
  atom: Atom<any, any>,
) => void;

export type AtomValue<Value> = Value extends Record<string, any>
  ? Value
  : Record<string, any>;

/**
 * Atom Options
 */
export type AtomOptions<Value, Actions> = {
  /**
   * Atom unique name
   *
   * @deprecated use `key` instead
   */
  name?: string;
  /**
   * Atom unique key
   *
   */
  key?: string;
  /**
   * Atom default value
   */
  default: Value;
  /**
   * Make adjustments on the value before updating the atom
   */
  beforeUpdate?: (
    newValue: Value,
    oldValue: Value,
    atom: Atom<AtomValue<Value>, Actions>,
  ) => any;
  /**
   * Triggered when atom is updated
   */
  onUpdate?: (callback: AtomChangeCallback) => EventSubscription;
  /**
   * Set getter function, works only when atom's value is object
   */
  get?: (key: string, defaultValue?: any, atomValue?: any) => any;
  /**
   * Atom actions
   *
   * Useful to work with atom's value and operate over it
   */
  actions?: Actions;
};

export type AtomChangeCallback = (
  newValue: any,
  oldValue: any,
  atom: Atom<any, any>,
) => void;

/**
 * The Atom Instance
 */
// Generic Type Value can be any type or object with
export type Atom<Value extends Record<string, any> = any, Actions = any> = {
  /**
   * An alias for useAtomWatch but specific for this atom
   */
  useWatcher<T extends keyof Value>(key: T): Value[T];

  /**
   * Return the value of atom or just key of it
   */
  use<T extends keyof Value>(key?: T): T extends keyof Value ? Value[T] : Value;

  /**
   * Atom unique name, set by the user
   *
   * @deprecated use `key` instead
   */
  name?: string;

  /**
   * Atom unique key, set by the user
   */
  key?: string;

  /**
   * Atom default value, set by the user
   */
  default: any;

  /**
   * Atom current value, initialized with the passed default value
   */
  currentValue: any;

  /**
   * Reset the atom value
   */
  reset: () => void;

  /**
   * Update atom value, the function accepts a new value,
   * or it can accept a callback that passes the old value and the atom instance
   * This will trigger atom event update
   */
  update: (
    value: ((oldValue: any, atom: Atom<Value, Actions>) => any) | any,
  ) => void;

  /**
   * Change only one key of the atom
   * Works only if atom's value is an object
   */
  change: <T extends keyof Value>(key: T, newValue: any) => void;

  /**
   * Get current value
   */
  readonly value: Value;

  /**
   * Get default value that started with atom creation
   */
  readonly defaultValue: Value;

  /**
   * Destroy the atom and remove it from atmos list
   * This will trigger an atom destroy event then unsubscribe all atom events
   */
  destroy: () => void;

  /**
   * An event listener to the atom value change
   * The callback accepts the new updated value, the old value and an atom instance
   */
  onChange: (callback: AtomChangeCallback) => EventSubscription;

  /**
   * An event listener to the atom destruction
   */
  onDestroy(callback: (atom: Atom<Value, Actions>) => void): EventSubscription;

  /**
   * Watch for atom value change
   * This can be used only when atom's default value is an object or an array
   * The key accepts dot.notation syntax
   */
  watch: <T extends keyof Value>(
    key: T,
    callback: AtomPartialChangeCallback,
  ) => EventSubscription;

  /**
   * Get value from atom's value
   * Works only if atom's value is an object
   */
  get<T extends keyof Value>(key: T, defaultValue?: any): any;

  /**
   * Watch for atom's value change and return it
   * When the atom's value is changed, the component will be rerendered again.
   */
  useValue: () => Value;

  /**
   * An alias for useAtomWatch but specific for this atom
   */
  useWatch: <T extends keyof Value>(
    key: T,
    callback: AtomPartialChangeCallback,
  ) => void;

  /**
   * Remove item by the given index or callback
   *
   * Works only if atom's value is an array
   * This will trigger the atom event change
   */
  removeItem: (
    indexOrCallback: number | ((item: any, itemIndex: number) => boolean),
  ) => void;

  /**
   * Remove list of items from the current atom for the given list of indexes or callback
   *
   * Works only if atom's value is an array
   * This will trigger the atom event change
   */
  removeItems: (
    indexesOrCallback: number[] | ((item: any, itemIndex: number) => boolean),
  ) => void;

  /**
   * Add item to the end of the atom's value
   *
   * Works only if atom's value is an array
   * This will trigger the atom event change
   */
  addItem: (item: any) => void;

  /**
   * Get item by the given index or callback
   *
   * Works only if atom's value is an array
   */
  getItem: (
    indexOrCallback: number | ((item: any, index: number) => any),
  ) => any;

  /**
   * Get item index by the given item
   *
   * Works only if atom's value is an array
   */
  getItemIndex: (
    callback: (item: any, index: number, array: any[]) => boolean,
  ) => number;

  /**
   * Replace item by the given index
   *
   * Works only if atom's value is an array
   * This will trigger the atom event change
   */
  replaceItem: (index: number, item: any) => void;

  /**
   * Modify the atom's array items by the given callback
   *
   * Works only if atom's value is an array
   * This will trigger the atom event change
   */
  map: (callback: (item: any, index: number, array: any[]) => any) => void;

  /**
   * Get the atom's value type
   */
  readonly type;

  /**
   * Get the atom's value length
   *
   * Works only if atom's value is an array or a string
   */
  readonly length: number;

  /**
   * Atom actions
   *
   * Useful to work with atom's value and operate over it
   */
  actions: Actions;
};
