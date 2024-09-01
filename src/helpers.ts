import { ReactNode } from "react";
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
  /**
   * Listen and get the opened state
   */
  useOpened: () => boolean;
};

/**
 * Open atom type
 */
export type OpenAtomType = {
  opened: boolean;
} & OpenAtomActions;

/**
 * Create a boolean atom
 */
export function openAtom(
  key: string,
  defaultOpened = false,
): ReactAtom<boolean, OpenAtomActions> {
  return atom<boolean, OpenAtomActions>({
    key,
    default: defaultOpened,
    actions: {
      toggle() {
        this.update(!this.currentValue);
      },
      open() {
        this.update(true);
      },
      close() {
        this.update(false);
      },
      useOpened() {
        return (this as unknown as ReactAtom).useState()[0];
      },
    },
  });
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

export type LoadingAtom = ReactAtom<LoadingAtomActions> & LoadingAtomActions;

/**
 * Create a loading atom
 */
export function loadingAtom(key: string, defaultLoading = false) {
  const atomHandler = atom<boolean, LoadingAtomActions>({
    key,
    default: defaultLoading,
    actions: {
      startLoading() {
        this.update(true);
      },
      stopLoading() {
        this.update(false);
      },
      toggleLoading() {
        this.update(!this.currentValue);
      },
    },
  });

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
};

export type FetchingAtomActions<DataType, PaginationType> = {
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
  failed: (error: ReactNode) => void;
  /**
   * Used only with arrays, this will append data to the current data and mark loading as false
   */
  append: (data: DataType) => void;
  /**
   * Used only with arrays, this will prepend data to current data and mark loading as false
   */
  prepend: (data: DataType) => void;
  /**
   * Get and use loading state
   */
  useLoading: () => boolean;
  /**
   * Get and use data
   */
  useData: () => DataType | null;
  /**
   * Get and use error
   */
  useError: () => ReactNode;
  /**
   * Get and use pagination
   */
  usePagination: () => PaginationType | undefined;
};

/**
 * Create a fetching atom
 */
export function fetchingAtom<DataType = any, PaginationType = any>(
  key: string,
  defaultValue: DataType | null = null,
  defaultFetching = true,
) {
  return atom<
    FetchingAtomType<DataType, PaginationType>,
    FetchingAtomActions<DataType, PaginationType>
  >({
    key,
    actions: {
      startLoading() {
        this.change("isLoading", true);
      },
      stopLoading() {
        this.change("isLoading", false);
      },
      useLoading() {
        return (this as unknown as ReactAtom).use("isLoading");
      },
      useData() {
        return (this as unknown as ReactAtom).use("data");
      },
      useError() {
        return (this as unknown as ReactAtom).use("error");
      },
      usePagination() {
        return (this as unknown as ReactAtom).use("pagination");
      },
      success(data, pagination?: PaginationType) {
        this.merge({
          isLoading: false,
          data,
          pagination,
        });
      },
      append(data: DataType) {
        const newData: any[] = [...(this.value.data as any), ...(data as any)];
        this.merge({
          isLoading: false,
          data: newData as DataType,
        });
      },
      prepend(data: DataType) {
        const newData: any[] = [...(data as any), ...(this.value.data as any)];
        this.merge({
          isLoading: false,
          data: newData as DataType,
        });
      },
      failed(error) {
        this.merge({
          isLoading: false,
          error,
        });
      },
    },
    default: {
      isLoading: defaultFetching,
      data: defaultValue,
      error: undefined,
      pagination: undefined,
    },
  });
}
