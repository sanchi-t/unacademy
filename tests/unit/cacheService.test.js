jest.mock("../../src/config/redis", () => {
  const Redis = require("ioredis-mock");
  return new Redis();
});

const cacheService = require("../../src/services/cacheService");

describe("Cache Service", () => {
  it("should store and retrieve product by ID", async () => {
    const product = { id: 1, name: "Test Product" };
    await cacheService.setProduct(product.id, JSON.stringify(product));

    const result = await cacheService.getProduct(product.id);
    expect(result).toEqual(JSON.stringify(product));
  });

  it("should return null for missing key", async () => {
    const result = await cacheService.getProduct(999);
    expect(result).toBeNull();
  });
});
