import { atom } from "./react-atom";
import { type ReactAtom } from "./types";

export type PortalActions<T = any> = {
  /**
   * Opens the portal with optional data.
   * @param data - Optional data to be passed when opening the portal.
   */
  open: (data?: T) => void;

  /**
   * Closes the portal.
   */
  close: () => void;

  /**
   * Toggles the portal's open state. If the portal is closed, it opens with optional data.
   * If the portal is open, it closes.
   * @param data - Optional data to be passed when opening the portal.
   */
  toggle: (data?: T) => void;

  /**
   * Hook to determine if the portal is currently open.
   * @returns A boolean indicating if the portal is open.
   */
  useOpened: () => boolean;

  /**
   * Hook to retrieve the current data associated with the portal.
   * @returns The data associated with the portal.
   */
  useData: () => T;
};

type PortalData<T = any> = {
  opened: boolean;
  data: T;
};

export type AtomPortal<T = any> = ReactAtom<PortalData<T>, PortalActions<T>>;

/**
 * Create a portal atom
 * This atom is used to create a portal (a modal, a tooltip, a dropdown, etc.)
 */
export function portalAtom<T = any>(name: string, opened: boolean = false) {
  return atom<PortalData<T>, PortalActions<T>>({
    key: `${name}-portal`,
    default: {
      opened: opened,
      data: {} as T,
    },
    actions: {
      open(data?: T) {
        this.merge({
          opened: true,
          data,
        });
      },
      close() {
        this.change("opened", false);
      },
      toggle(data?: T) {
        const opened = this.get("opened");

        if (opened) {
          return this.change("opened", false);
        }

        this.merge({
          opened: true,
          data,
        });
      },
      useOpened() {
        return (this as ReactAtom).use("opened");
      },
      useData() {
        return (this as ReactAtom).use("data");
      },
    },
  }) as AtomPortal<T>;
}
