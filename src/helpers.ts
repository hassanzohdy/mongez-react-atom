import { atom } from "./atom";
import { Atom } from "./types";

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

export type LoadingAtom = Atom<LoadingAtomType> & {
  /**
   * Start loading
   */
  start: () => void;
  /**
   * Stop loading
   */
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
  }) as LoadingAtom;

  return atomHandler;
}

/**
 * Fetching atom type
 */
export type FetchingAtomType<DataType, PaginationType> = {
  /**
   * Loading state
   */
  isLoading: boolean;
  /**
   * Fetched data
   */
  data: DataType | null;
  /**
   * Pagination data
   */
  pagination?: PaginationType;
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
  success: (data: DataType, pagination) => void;
  /**
   * Mark data as fetched successfully, this will mark loading as false and set data
   */
  failed: (error: any) => void;
  /**
   * Used only with arrays, this will append data to the current data and mark loading as false
   */
  append: (data: DataType) => void;
  /**
   * Used only with arrays, this will prepend data to current data and mark loading as false
   */
  prepend: (data: DataType) => void;
};

export type FetchingAtom<DataType, PaginationType> = Atom<
  FetchingAtomType<DataType, PaginationType>
> & {
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
  success: (data: DataType, pagination?: PaginationType) => void;
  /**
   * Mark data as fetched successfully, this will mark loading as false and set data
   */
  failed: (error: any) => void;
  /**
   * Used only with arrays, this will append data to the current data and mark loading as false
   */
  append: (data: DataType, pagination?: PaginationType) => void;
  /**
   * Used only with arrays, this will prepend data to current data and mark loading as false
   */
  prepend: (data: DataType, pagination?: PaginationType) => void;
};

/**
 * Create a fetching atom
 */
export function fetchingAtom<DataType = any, PaginationType = any>(
  key: string,
  defaultValue: DataType | null = null,
  defaultFetching = false
) {
  const atomHandler = atom<FetchingAtomType<DataType, PaginationType>>({
    key,
    default: {
      isLoading: defaultFetching,
      data: defaultValue,
      error: undefined,
      pagination: undefined,
      startLoading() {
        atomHandler.change("isLoading", true);
      },
      stopLoading() {
        atomHandler.change("isLoading", false);
      },
      success(data, pagination?: PaginationType) {
        atomHandler.merge({
          isLoading: false,
          data,
          pagination,
        });
      },
      append(data: DataType, pagination?: PaginationType) {
        atomHandler.merge({
          isLoading: false,
          data: [
            ...((atomHandler.value.data as any) || []),
            ...(data as any),
          ] as DataType,
          pagination,
        });
      },
      prepend(data: DataType, pagination?: PaginationType) {
        atomHandler.merge({
          isLoading: false,
          data: [
            ...(data as any),
            ...((atomHandler.value.data as any) || []),
          ] as DataType,
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
  }) as FetchingAtom<DataType, PaginationType>;

  atomHandler.startLoading = atomHandler.value.startLoading;
  atomHandler.stopLoading = atomHandler.value.stopLoading;
  atomHandler.failed = atomHandler.value.failed;
  atomHandler.success = atomHandler.value.success;
  atomHandler.append = atomHandler.value.append;
  atomHandler.prepend = atomHandler.value.prepend;

  return atomHandler;
}
