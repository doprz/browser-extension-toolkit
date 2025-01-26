import type {
  StorageArea,
  StorageChange,
  StorageChangeListener,
  StorageOptions,
} from "./types";

export class ExtensionStorage<T extends Record<string, unknown>> {
  private area: StorageArea;
  private shouldSerialize: boolean;
  private prefix: string;
  private changeListeners: Set<StorageChangeListener<T>> = new Set();

  constructor(options: StorageOptions = {}) {
    this.area = options.area || "local";
    this.shouldSerialize = options.serialize ?? true;
    this.prefix = options.prefix || "";

    // Initialize change listener
    browser.storage.onChanged.addListener(this.handleStorageChange.bind(this));
  }

  /**
   * Get a value from storage
   */
  public async get<K extends keyof T>(key: K): Promise<T[K] | undefined> {
    const fullKey = this.getFullKey(key as string);
    const result = await browser.storage[this.area].get(fullKey);
    const value = result[fullKey];

    return this.shouldSerialize ? this.deserialize(value) : value;
  }

  /**
   * Get multiple values from storage
   */
  public async getAll(): Promise<Partial<T>> {
    const result = await browser.storage[this.area].get(null);
    const entries = Object.entries(result)
      .filter(([key]) => this.hasPrefix(key))
      .map(([key, value]) => [
        this.removePrefix(key),
        this.shouldSerialize ? this.deserialize(value) : value,
      ]);

    return Object.fromEntries(entries) as Partial<T>;
  }

  /**
   * Set a value in storage
   */
  public async set<K extends keyof T>(key: K, value: T[K]): Promise<void> {
    const fullKey = this.getFullKey(key as string);
    const storedValue = this.shouldSerialize ? this.serialize(value) : value;

    await browser.storage[this.area].set({
      [fullKey]: storedValue,
    });
  }

  /**
   * Remove a value from storage
   */
  public async remove<K extends keyof T>(key: K): Promise<void> {
    const fullKey = this.getFullKey(key as string);
    await browser.storage[this.area].remove(fullKey);
  }

  /**
   * Clear all values from storage
   */
  public async clear(): Promise<void> {
    if (this.prefix) {
      const all = await browser.storage[this.area].get(null);
      const keysToRemove = Object.keys(all).filter((key) =>
        this.hasPrefix(key),
      );
      await browser.storage[this.area].remove(keysToRemove);
    } else {
      await browser.storage[this.area].clear();
    }
  }

  /**
   * Set multiple values in storage at once
   */
  public async bulkSet(items: Partial<T>): Promise<void> {
    const entries = Object.entries(items).map(([key, value]) => [
      this.getFullKey(key),
      this.shouldSerialize ? this.serialize(value) : value,
    ]);

    await browser.storage[this.area].set(Object.fromEntries(entries));
  }

  /**
   * Set multiple values and remove others atomically
   */
  public async bulkUpdate(options: {
    set?: Partial<T>;
    remove?: Array<keyof T>;
  }): Promise<void> {
    const { set, remove } = options;

    if (set) {
      await this.bulkSet(set);
    }

    if (remove?.length) {
      const keysToRemove = remove.map((key) => this.getFullKey(key as string));
      await browser.storage[this.area].remove(keysToRemove);
    }
  }

  /**
   * Add a change listener
   */
  public addChangeListener(listener: StorageChangeListener<T>): void {
    this.changeListeners.add(listener);
  }

  /**
   * Remove a change listener
   */
  public removeChangeListener(listener: StorageChangeListener<T>): void {
    this.changeListeners.delete(listener);
  }

  /**
   * Internal handler for storage changes
   */
  private async handleStorageChange(
    changes: Record<string, browser.storage.StorageChange>,
    // areaName: StorageArea, // This is the proper type
    areaName: string, // The browser.storage.onChanged event listener expects a string as the second argument
  ): Promise<void> {
    if (areaName !== this.area) return;

    const relevantChanges = Object.entries(changes)
      .filter(([key]) => this.hasPrefix(key))
      .reduce<{ [K in keyof T]?: StorageChange<T[K]> }>(
        (acc, [key, change]) => ({
          ...acc,
          [this.removePrefix(key)]: {
            oldValue: change.oldValue
              ? this.shouldSerialize
                ? this.deserialize(change.oldValue)
                : change.oldValue
              : undefined,
            newValue: change.newValue
              ? this.shouldSerialize
                ? this.deserialize(change.newValue)
                : change.newValue
              : undefined,
          },
        }),
        {},
      );

    if (Object.keys(relevantChanges).length === 0) return;

    await Promise.all(
      Array.from(this.changeListeners).map((listener) =>
        listener(relevantChanges, areaName as StorageArea),
      ),
    );
  }

  private getFullKey(key: string): string {
    return this.prefix ? `${this.prefix}:${key}` : key;
  }

  private hasPrefix(key: string): boolean {
    return this.prefix ? key.startsWith(`${this.prefix}:`) : true;
  }

  private removePrefix(key: string): string {
    return this.prefix ? key.slice(this.prefix.length + 1) : key;
  }

  private serialize(value: unknown): string {
    return JSON.stringify(value);
  }

  private deserialize(value: string): unknown {
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  }
}
