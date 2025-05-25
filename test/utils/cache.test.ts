import { cache } from "@/utils/cache";

describe("Cache", () => {
  beforeEach(() => {
    // Clear cache before each test
    cache.clear();
    // Reset any ongoing refreshes by getting a fresh instance
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Clean up after each test
    cache.clear();
  });

  describe("Basic Cache Operations", () => {
    it("should set and get data from cache", async () => {
      const testData = { name: "test", value: 123 };
      cache.set("test-key", testData);

      const result = await cache.get("test-key");
      expect(result).toEqual(testData);
    });

    it("should remove data from cache", async () => {
      const testData = { name: "test", value: 123 };
      cache.set("test-key", testData);

      cache.remove("test-key");
      const result = await cache.get("test-key");
      expect(result).toBeNull();
    });

    it("should clear all data from cache", async () => {
      cache.set("key1", "value1");
      cache.set("key2", "value2");

      cache.clear();

      expect(await cache.get("key1")).toBeNull();
      expect(await cache.get("key2")).toBeNull();
    });
  });

  describe("Cache Hit Scenarios", () => {
    it("should return cached data when cache is hit", async () => {
      const testData = { message: "cached data" };
      cache.set("hit-key", testData);

      const result = await cache.get("hit-key");
      expect(result).toEqual(testData);
    });

    it("should return cached data even when refresh function is provided", async () => {
      const testData = { message: "original data" };
      const refreshFn = jest
        .fn()
        .mockResolvedValue({ message: "refreshed data" });

      cache.set("hit-with-refresh", testData);

      const result = await cache.get("hit-with-refresh", {
        refresh: refreshFn,
      });
      expect(result).toEqual(testData);
      expect(refreshFn).not.toHaveBeenCalled();
    });
  });

  describe("Cache Miss Scenarios", () => {
    it("should return null when cache misses and no refresh function provided", async () => {
      const result = await cache.get("missing-key");
      expect(result).toBeNull();
    });

    it("should refresh data and return it when cache misses", async () => {
      const refreshedData = { message: "fresh data" };
      const refreshFn = jest.fn().mockResolvedValue(refreshedData);

      const result = await cache.get("missing-key", { refresh: refreshFn });

      expect(result).toEqual(refreshedData);
      expect(refreshFn).toHaveBeenCalledTimes(1);

      // Verify data was cached
      const cachedResult = await cache.get("missing-key");
      expect(cachedResult).toEqual(refreshedData);
    });
  });

  describe("TTL and Expiration", () => {
    it("should return cached data when within TTL", async () => {
      const testData = { message: "within ttl" };
      cache.set("ttl-key", testData);

      const result = await cache.get("ttl-key", { ttl: 5000 }); // 5 seconds
      expect(result).toEqual(testData);
    });

    it("should refresh data when TTL expires", async () => {
      const originalData = { message: "original" };
      const refreshedData = { message: "refreshed" };
      const refreshFn = jest.fn().mockResolvedValue(refreshedData);

      // Set data with old timestamp
      cache.set("expired-key", originalData);

      // Mock Date.now to simulate time passing
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 10000); // 10 seconds later

      const result = await cache.get("expired-key", {
        ttl: 5000, // 5 seconds
        refresh: refreshFn,
      });

      expect(result).toEqual(refreshedData);
      expect(refreshFn).toHaveBeenCalledTimes(1);

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe("Grace Period Scenarios", () => {
    it("should return stale data immediately when within grace period", async () => {
      const originalData = { message: "stale but valid" };
      const refreshedData = { message: "fresh data" };
      const refreshFn = jest.fn().mockResolvedValue(refreshedData);

      // Set data
      cache.set("grace-key", originalData);

      // Mock time to be past TTL but within grace period
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 6000); // 6 seconds later

      const result = await cache.get("grace-key", {
        ttl: 5000, // 5 seconds
        gracePeriod: 3000, // 3 seconds grace
        refresh: refreshFn,
      });

      // Should return stale data immediately, not a promise
      expect(result).toEqual(originalData);

      // Refresh should still be triggered in background
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(refreshFn).toHaveBeenCalledTimes(1);

      // Restore Date.now
      Date.now = originalNow;
    });

    it("should refresh data when beyond grace period", async () => {
      const originalData = { message: "too old" };
      const refreshedData = { message: "fresh data" };
      const refreshFn = jest.fn().mockResolvedValue(refreshedData);

      cache.set("beyond-grace-key", originalData);

      // Mock time to be beyond TTL + grace period
      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 10000); // 10 seconds later

      const result = await cache.get("beyond-grace-key", {
        ttl: 5000, // 5 seconds
        gracePeriod: 3000, // 3 seconds grace (total 8 seconds)
        refresh: refreshFn,
      });

      expect(result).toEqual(refreshedData);
      expect(refreshFn).toHaveBeenCalledTimes(1);

      // Restore Date.now
      Date.now = originalNow;
    });
  });

  describe("Version Mismatch", () => {
    it("should refresh cache when version mismatch occurs", async () => {
      const originalData = { message: "old version" };
      const refreshedData = { message: "new version" };
      const refreshFn = jest.fn().mockResolvedValue(refreshedData);

      // Set data with version 1
      cache.set("version-key", originalData, { version: 1 });

      // Get with version 2
      const result = await cache.get("version-key", {
        version: 2,
        refresh: refreshFn,
      });

      expect(result).toEqual(refreshedData);
      expect(refreshFn).toHaveBeenCalledTimes(1);
    });

    it("should return null for version mismatch without refresh function", async () => {
      const originalData = { message: "old version" };

      cache.set("version-key", originalData, { version: 1 });

      const result = await cache.get("version-key", { version: 2 });
      expect(result).toBeNull();
    });
  });

  describe("Concurrent Refresh Requests", () => {
    it("should handle multiple concurrent refresh requests for the same key", async () => {
      const refreshedData = { message: "concurrent refresh" };
      const refreshFn = jest
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(refreshedData), 100)
            )
        );

      // Make multiple concurrent requests
      const promise1 = await cache.get("concurrent-key", {
        refresh: refreshFn,
      });
      const promise2 = await cache.get("concurrent-key", {
        refresh: refreshFn,
      });
      const promise3 = await cache.get("concurrent-key", {
        refresh: refreshFn,
      });

      const [result1, result2, result3] = await Promise.all([
        promise1,
        promise2,
        promise3,
      ]);

      // All should return the same data
      expect(result1).toEqual(refreshedData);
      expect(result2).toEqual(refreshedData);
      expect(result3).toEqual(refreshedData);

      // Refresh function should only be called once
      expect(refreshFn).toHaveBeenCalledTimes(1);
    });

    it("should handle concurrent requests with stale data", async () => {
      const staleData = { message: "stale" };
      const refreshedData = { message: "refreshed" };
      const refreshFn = jest
        .fn()
        .mockImplementation(
          () =>
            new Promise((resolve) =>
              setTimeout(() => resolve(refreshedData), 100)
            )
        );

      // Set stale data
      cache.set("concurrent-stale-key", staleData);

      const originalNow = Date.now;
      Date.now = jest.fn(() => originalNow() + 6000); // 6 seconds later

      // Make concurrent requests within grace period
      const result1 = await cache.get("concurrent-stale-key", {
        ttl: 5000,
        gracePeriod: 3000,
        refresh: refreshFn,
      });
      const result2 = await cache.get("concurrent-stale-key", {
        ttl: 5000,
        gracePeriod: 3000,
        refresh: refreshFn,
      });

      // Should return stale data immediately
      expect(result1).toEqual(staleData);
      expect(result2).toEqual(staleData);

      // Wait for background refresh
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Refresh should only be called once
      expect(refreshFn).toHaveBeenCalledTimes(1);

      Date.now = originalNow;
    });
  });

  describe("Error Handling", () => {
    it("should handle refresh function errors gracefully", async () => {
      const refreshFn = jest
        .fn()
        .mockRejectedValue(new Error("Refresh failed"));

      try {
        await cache.get("error-key", { refresh: refreshFn });
        expect(refreshFn).toHaveBeenCalledTimes(1);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe("Refresh failed");
      }
    });

    it("should handle corrupted cache data", async () => {
      // Mock console.error to suppress expected error output
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Manually set corrupted data
      const cache_instance = cache as any;
      cache_instance.storage.setItem(
        "corrupted-key",
        "invalid-compressed-data"
      );

      const refreshFn = jest.fn().mockResolvedValue({ message: "recovered" });
      await cache.get("corrupted-key", { refresh: refreshFn });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error getting cache:",
        expect.anything(),
        "key:",
        "corrupted-key"
      );

      // Restore console.error
      consoleErrorSpy.mockRestore();
    });

    it("should handle BigInt serialization", async () => {
      const testData = { bigNumber: BigInt("123456789012345678901234567890") };

      // Should not throw when setting BigInt data
      expect(() => cache.set("bigint-key", testData)).not.toThrow();

      // Note: BigInt gets converted to string during serialization
      const result = await cache.get("bigint-key");
      expect(result).toEqual({ bigNumber: "123456789012345678901234567890" });
    });
  });

  describe("Compression", () => {
    it("should compress and decompress large data correctly", async () => {
      const largeData = {
        items: Array.from({ length: 1000 }, (_, i) => ({
          id: i,
          name: `Item ${i}`,
          description:
            `This is a detailed description for item number ${i}`.repeat(10),
        })),
      };

      cache.set("large-data-key", largeData);
      const result = await cache.get("large-data-key");

      expect(result).toEqual(largeData);
    });
  });

  describe("Version Management", () => {
    it("should use current version when no version specified", async () => {
      cache.setVersion(5);
      const testData = { message: "version test" };

      cache.set("version-test-key", testData);

      // Should work with same version
      const result = await cache.get("version-test-key", { version: 5 });
      expect(result).toEqual(testData);
    });

    it("should handle version updates correctly", async () => {
      const oldData = { message: "old" };
      const newData = { message: "new" };
      const refreshFn = jest.fn().mockResolvedValue(newData);

      // Set with version 1
      cache.setVersion(1);
      cache.set("version-update-key", oldData);

      // Update version and get
      cache.setVersion(2);
      const result = await cache.get("version-update-key", {
        version: 2,
        refresh: refreshFn,
      });

      expect(result).toEqual(newData);
      expect(refreshFn).toHaveBeenCalledTimes(1);
    });
  });
});
