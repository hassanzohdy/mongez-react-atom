import { atom } from "./react-atom";
import { ReactAtom } from "./types";

export type OpenAtomActions = {
  /**
   * Toggle open state
   */
  toggle: () => void;
  /**
   * Mark as opened
   */
  open: () => void;
  /**
   * Mark as closed
   */
  close: () => void;
};

/**
 * Open atom type
 */
export type OpenAtomType = {
  opened: boolean;
} & OpenAtomActions;

export type OpenAtom = ReactAtom<OpenAtomType> & OpenAtomActions;

/**
 * Create a boolean atom
 */
export function openAtom(key: string, defaultOpened = false) {
  const atomHandler = atom<OpenAtomType>({
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
  }) as OpenAtom;

  atomHandler.open = atomHandler.value.open;
  atomHandler.close = atomHandler.value.close;
  atomHandler.toggle = atomHandler.value.toggle;

  return atomHandler;
}

export type LoadingAtomActions = {
  /**
   * Start loading
   */
  startLoading: () => void;
  /**
   * Stop loading
   */
  stopLoading: () => void;
  /**
   * Toggle loading
   */
  toggleLoading: () => void;
};

/**
 * Loading atom type
 */
export type LoadingAtomType = {
  isLoading: boolean;
} & LoadingAtomActions;

export type LoadingAtom = ReactAtom<LoadingAtomType> & LoadingAtomActions;

/**
 * Create a loading atom
 */
export function loadingAtom(key: string, defaultLoading = false) {
  const atomHandler = atom<LoadingAtomType>({
    key,
    default: {
      isLoading: defaultLoading,
      startLoading() {
        atomHandler.change("isLoading", true);
      },
      stopLoading() {
        atomHandler.change("isLoading", false);
      },
      toggleLoading() {
        atomHandler.change("isLoading", !atomHandler.value.isLoading);
      },
    },
  }) as LoadingAtom;

  atomHandler.startLoading = atomHandler.value.startLoading;
  atomHandler.stopLoading = atomHandler.value.stopLoading;
  atomHandler.toggleLoading = atomHandler.value.toggleLoading;

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
  success: (data: DataType, pagination?: PaginationType) => void;
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

export type FetchingAtom<DataType, PaginationType> = ReactAtom<
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
