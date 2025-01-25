/**
 * Supported storage areas in browser extensions
 */
export type StorageArea = "local" | "managed" | "session" | "sync";

/**
 * Storage change event details
 */
export interface StorageChange<T = unknown> {
  oldValue?: T;
  newValue?: T;
}

/**
 * Storage change listener function
 */
export type StorageChangeListener<T = unknown> = (
  changes: { [K in keyof T]?: StorageChange<T[K]> },
  areaName: StorageArea,
) => void | Promise<void>;
/**
 * Storage options for initialization
 */
export interface StorageOptions {
  area?: StorageArea;
  serialize?: boolean;
  prefix?: string;
}
