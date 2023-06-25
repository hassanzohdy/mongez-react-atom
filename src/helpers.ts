import { atom } from "./atom";

/**
 * Boolean atom type
 */
export type BooleanAtomType = {
  opened: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
};

/**
 * Create a boolean atom
 */
export function booleanAtom(key: string, defaultOpened = false) {
  const atomHandler = atom<BooleanAtomType>({
    key,
    default: {
      opened: defaultOpened,
      toggle() {
        atomHandler.change("opened", !atomHandler.value.opened);
      },
      open() {
        atomHandler.change("opened", true);
      },
      close() {
        atomHandler.change("opened", false);
      },
    },
  });

  return atomHandler;
}

/**
 * Loading atom type
 */
export type LoadingAtomType = {
  isLoading: boolean;
  start: () => void;
  stop: () => void;
};

/**
 * Create a loading atom
 */
export function loadingAtom(key: string, defaultLoading = false) {
  const atomHandler = atom<LoadingAtomType>({
    key,
    default: {
      isLoading: defaultLoading,
      start() {
        atomHandler.change("isLoading", true);
      },
      stop() {
        atomHandler.change("isLoading", false);
      },
    },
  });

  return atomHandler;
}

/**
 * Fetching atom type
 */
export type FetchingAtomType = {
  /**
   * Loading state
   */
  isLoading: boolean;
  /**
   * Fetched data
   */
  data: any;
  /**
   * Pagination data
   */
  pagination?: any;
  /**
   * Fetching error
   */
  error: any;
  /**
   * Start loading
   */
  startLoading: () => void;
  /**
   * Stop loading
   */
  stopLoading: () => void;
  /**
   * Mark data as fetched successfully, this will mark loading as false and set data
   */
  success: (data: any) => void;
  /**
   * Mark data as fetched successfully, this will mark loading as false and set data
   */
  failed: (error: any) => void;
  /**
   * Used only with arrays, this will append data to the current data and mark loading as false
   */
  append: (data: any[]) => void;
  /**
   * Used only with arrays, this will prepend data to current data and mark loading as false
   */
  prepend: (data: any[]) => void;
};

/**
 * Create a fetching atom
 */
export function fetchingAtom(key: string, defaultFetching = false) {
  const atomHandler = atom<FetchingAtomType>({
    key,
    default: {
      isLoading: defaultFetching,
      data: null,
      error: null,
      startLoading() {
        atomHandler.change("isLoading", true);
      },
      stopLoading() {
        atomHandler.change("isLoading", false);
      },
      success(data, pagination = null) {
        atomHandler.merge({
          isLoading: false,
          data,
          pagination,
        });
      },
      append(data, pagination = null) {
        atomHandler.merge({
          isLoading: false,
          data: [...atomHandler.value.data, ...data],
          pagination,
        });
      },
      prepend(data, pagination = null) {
        atomHandler.merge({
          isLoading: false,
          data: [...data, ...atomHandler.value.data],
          pagination,
        });
      },
      failed(error) {
        atomHandler.merge({
          isLoading: false,
          error,
        });
      },
    },
  });

  return atomHandler;
}
