import { ExtensionStorage } from "./storage";
import { StorageOptions } from "./types";

/**
 * Decorator to persist class properties in extension storage
 */
export function persist(options: StorageOptions = {}) {
  return function (target: any, propertyKey: string) {
    const storage = new ExtensionStorage(options);

    const getter = async function (this: any) {
      return await storage.get(propertyKey);
    };

    const setter = async function (this: any, value: unknown) {
      await storage.set(propertyKey, value);
    };

    Object.defineProperty(target, propertyKey, {
      get: getter,
      set: setter,
      enumerable: true,
      configurable: true,
    });
  };
}
