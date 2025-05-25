import pako from "pako";

export interface CachedObject<T> {
  data: T;
  version: number;
  timestamp: number;
}

export interface CacheOptions<T> {
  version?: number;
  ttl?: number; // Time to live in milliseconds
  refresh?: () => Promise<T>;
  gracePeriod?: number; // Time in milliseconds while we can still return the stale data while it is being refreshed.
}

class Cache {
  private static instance: Cache;
  private currentVersion = 1;
  private storage: Storage;
  private ongoingRefreshes: Map<string, Promise<unknown>> = new Map();
  private memoryStorage: Map<string, string> = new Map();

  private constructor() {
    this.storage =
      typeof window !== "undefined"
        ? window.localStorage
        : {
            getItem: (key: string) => this.memoryStorage.get(key) || null,
            setItem: (key: string, value: string) =>
              this.memoryStorage.set(key, value),
            removeItem: (key: string) => this.memoryStorage.delete(key),
            clear: () => this.memoryStorage.clear(),
            length: this.memoryStorage.size,
            key: (index: number) =>
              Array.from(this.memoryStorage.keys())[index],
          };
  }

  public static getInstance(): Cache {
    if (!Cache.instance) {
      Cache.instance = new Cache();
    }
    return Cache.instance;
  }

  private compressData(data: string): string {
    const uint8Array = new TextEncoder().encode(data);
    const compressed = pako.deflate(uint8Array);
    // Convert to base64 in chunks to avoid call stack size exceeded
    const chunkSize = 1024;
    let result = "";
    for (let i = 0; i < compressed.length; i += chunkSize) {
      const chunk = compressed.slice(i, i + chunkSize);
      result += String.fromCharCode.apply(null, Array.from(chunk));
    }
    return btoa(result);
  }

  private decompressData(compressedBase64: string): string {
    const compressed = Uint8Array.from(atob(compressedBase64), (c) =>
      c.charCodeAt(0)
    );
    const decompressed = pako.inflate(compressed);
    return new TextDecoder().decode(decompressed);
  }

  private getCompressionRatio(original: string, compressed: string) {
    const originalSize = new TextEncoder().encode(original).length;
    const compressedSize = compressed.length;
    return {
      originalSize,
      compressedSize,
      ratio: (compressedSize / originalSize) * 100,
    };
  }

  public set<T>(key: string, data: T, options: CacheOptions<T> = {}): void {
    try {
      const cachedObject: CachedObject<T> = {
        data,
        version: options.version || this.currentVersion,
        timestamp: Date.now(),
      };

      const jsonString = JSON.stringify(cachedObject, (_, value) =>
        typeof value === "bigint" ? value.toString() : value
      );
      const compressed = this.compressData(jsonString);
      // const ratio = this.getCompressionRatio(jsonString, compressed);
      // console.log(
      //   `Cache set ${key}: ${ratio.originalSize} -> ${
      //     ratio.compressedSize
      //   } bytes (${ratio.ratio.toFixed(2)}%)`
      // );

      this.storage.setItem(key, compressed);
    } catch (err) {
      console.error(
        "Error setting cache:",
        err,
        "key:",
        key,
        "data size:",
        JSON.stringify(data).length,
        `${((JSON.stringify(data).length * 2) / 1024 / 1024).toFixed(2)}MB`
      );
    }
  }

  /**
   * Returns cached data for the given key, or refreshes the cache if it is miss or stale.
   * If the cache is hit and fresh, it returns the cached data directly.
   * If the cache is stale but within grace period, it returns stale data immediately and triggers background refresh.
   * If the cache is stale and beyond grace period, it refreshes the data and returns a promise.
   * If the cache is miss, it refreshes the data and returns a promise (or null if no refresh function).
   *
   * If multiple refresh requests are made for the same key, the first request will refresh the cache and all other requests will wait for the refresh to complete.
   */
  public get<T>(key: string, options: CacheOptions<T> = {}): Promise<T | null> {
    const cacheMiss = (): Promise<T | null> => {
      if (!options.refresh) {
        return Promise.resolve(null);
      }
      if (!this.ongoingRefreshes.has(key)) {
        const refreshPromise = options
          .refresh?.()
          .then((data: T) => {
            this.set(key, data, {
              version: options.version || this.currentVersion,
              ttl: options.ttl,
              gracePeriod: options.gracePeriod,
            });
            return Promise.resolve(data);
          })
          .finally(() => {
            // Clean up the ongoing refresh entry
            this.ongoingRefreshes.delete(key);
          });

        // Store the refresh promise
        this.ongoingRefreshes.set(key, refreshPromise);
        return refreshPromise as Promise<T>;
      } else {
        return this.ongoingRefreshes.get(key) as Promise<T>;
      }
    };

    try {
      const compressed = this.storage.getItem(key);
      if (!compressed) return cacheMiss();

      const jsonString = this.decompressData(compressed);
      const cachedObject: CachedObject<T> = JSON.parse(jsonString);

      // Check version
      if (options.version && cachedObject.version !== options.version) {
        this.remove(key);
        return cacheMiss();
      }

      const age = Date.now() - cachedObject.timestamp;

      // Check TTL
      if (options.ttl && age > options.ttl) {
        // Data is stale
        if (options.gracePeriod && age <= options.ttl + options.gracePeriod) {
          // Within grace period - return stale data immediately and trigger background refresh
          if (options.refresh && !this.ongoingRefreshes.has(key)) {
            const refreshPromise = options
              .refresh()
              .then((data: T) => {
                this.set(key, data, {
                  version: options.version || this.currentVersion,
                  ttl: options.ttl,
                  gracePeriod: options.gracePeriod,
                });
                return Promise.resolve(data);
              })
              .finally(() => {
                // Clean up the ongoing refresh entry
                this.ongoingRefreshes.delete(key);
              });

            // Store the refresh promise
            this.ongoingRefreshes.set(key, refreshPromise);
          }
          return Promise.resolve(cachedObject.data); // Return stale data immediately
        } else {
          // Beyond grace period - remove stale data and refresh
          this.remove(key);
          return cacheMiss();
        }
      }

      // Data is fresh
      return Promise.resolve(cachedObject.data);
    } catch (err) {
      console.error("Error getting cache:", err, "key:", key);
      return cacheMiss();
    }
  }

  public remove(key: string): void {
    this.storage.removeItem(key);
  }

  public clear(): void {
    this.storage.clear();
    this.ongoingRefreshes.clear();
  }

  public setVersion(version: number): void {
    this.currentVersion = version;
  }
}

export const cache = Cache.getInstance();
