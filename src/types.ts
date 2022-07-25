import { EventSubscription } from "@mongez/events";

export type AtomPartialChangeCallback = (
  newValue: any,
  oldValue: any,
  atom: Atom
) => void;

/**
 * Atom Options
 */
export type AtomOptions = {
  /**
   * Atom unique name
   */
  // eslint-disable-next-line no-restricted-globals
  name: string;
  /**
   * Atom default value
   */
  default: any;
  /**
   * Make adjustments on the value before updating the atom
   */
  beforeUpdate?: (newValue: any) => any;
  /**
   * Set getter function, works only when atom's value is object
   */
  get?: (key: string, defaultValue?: any, atomValue?: any) => any;
};

/**
 * The Atom Instance
 */
export type Atom = {
  /**
   * Atom unique name, set by the user
   */
  // eslint-disable-next-line no-restricted-globals
  name: string;
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
  update: (value: ((oldValue: any, atom: Atom) => any) | any) => void;
  /**
   * Change only one key of the atom
   * Works only if atom's value is an object
   */
  change: (key: string, newValue: any) => void;
  /**
   * Get current value
   */
  get value(): any;
  /**
   * Get default value that started with atom creation
   */
  get defaultValue(): any;
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
    callback: (newValue: any, oldValue: any, atom: Atom) => void
  ) => EventSubscription;
  /**
   * An event listener to the atom destruction
   */
  onDestroy(callback: (atom: Atom) => void): EventSubscription;

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
   * An alias for useAtomWatch but specific for this atom
   */
  useWatch: (key: string, callback: AtomPartialChangeCallback) => void;
  /**
   * An alias for useAtomWatch but specific for this atom
   */
  useWatcher<T>(key: string): T;
};
