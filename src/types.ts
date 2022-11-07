import { EventSubscription } from "@mongez/events";

export type AtomPartialChangeCallback = (
  newValue: any,
  oldValue: any,
  atom: Atom<any, any>
) => void;

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
  default: any;
  /**
   * Make adjustments on the value before updating the atom
   */
  beforeUpdate?: (
    newValue: any,
    oldValue: any,
    atom: Atom<Value, Actions>
  ) => any;
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

/**
 * The Atom Instance
 */
export type Atom<Value = any, Actions = any> = {
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
    value: ((oldValue: any, atom: Atom<Value, Actions>) => any) | any
  ) => void;

  /**
   * Change only one key of the atom
   * Works only if atom's value is an object
   */
  change: (key: string, newValue: any) => void;

  /**
   * Get current value
   */
  readonly value: any;

  /**
   * Get default value that started with atom creation
   */
  readonly defaultValue: any;

  /**
   * Destroy the atom and remove it from atmos list
   * This will trigger an atom destroy event then unsubscribe all atom events
   */
  destroy: () => void;

  /**
   * An event listener to the atom value change
   * The callback accepts the new updated value, the old value and an atom instance
   */
  onChange: (
    callback: (newValue: any, oldValue: any, atom: Atom<Value, Actions>) => void
  ) => EventSubscription;

  /**
   * An event listener to the atom destruction
   */
  onDestroy(callback: (atom: Atom<Value, Actions>) => void): EventSubscription;

  /**
   * Watch for atom value change
   * This can be used only when atom's default value is an object or an array
   * The key accepts dot.notation syntax
   */
  watch: (
    key: string,
    callback: AtomPartialChangeCallback
  ) => EventSubscription;

  /**
   * Get value from atom's value
   * Works only if atom's value is an object
   */
  get(key: string, defaultValue?: any): any;

  /**
   * Watch for atom's value change and return it
   * When the atom's value is changed, the component will be rerendered again.
   */
  useValue: () => any;

  /**
   * An alias for useAtomWatch but specific for this atom
   */
  useWatch: (key: string, callback: AtomPartialChangeCallback) => void;

  /**
   * An alias for useAtomWatch but specific for this atom
   */
  useWatcher<T = never>(key: string): T;

  /**
   * Remove item by the given index or callback
   *
   * Works only if atom's value is an array
   * This will trigger the atom event change
   */
  removeItem: (
    indexOrCallback: number | ((item: any, itemIndex: number) => boolean)
  ) => void;

  /**
   * Remove list of items from the current atom for the given list of indexes or callback
   *
   * Works only if atom's value is an array
   * This will trigger the atom event change
   */
  removeItems: (
    indexesOrCallback: number[] | ((item: any, itemIndex: number) => boolean)
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
    indexOrCallback: number | ((item: any, index: number) => any)
  ) => any;

  /**
   * Get item index by the given item
   *
   * Works only if atom's value is an array
   */
  getItemIndex: (
    callback: (item: any, index: number, array: any[]) => boolean
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
