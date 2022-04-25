import { EventSubscription } from "@mongez/events";

/**
 * Default props
 */
export type AtomProps = {
  /**
   * Atom unique name
   */
  name: string;
  /**
   * Atom default value
   */
  default: any;
  /**
   * Make adjustments on the value before updating the atom 
   */
  beforeUpdate?: (newValue: any) => any;
};

/**
 * An atom object
 */
export type Atom = {
  /**
   * Atom unique name, set by the user
   */
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
};
