jest.mock("../../src/repository/productRepository");
jest.mock("../../src/services/cacheService");
jest.mock("../../src/config/redis", () => {
  return {
    connect: jest.fn(),
    quit: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
  };
});

const productService = require("../../src/services/productService");
const cacheService = require("../../src/services/cacheService");
const productRepository = require("../../src/repository/productRepository");

describe("Product Service", () => {
  afterEach(() => jest.clearAllMocks());

  it("should return product from cache", async () => {
    const cached = { id: 1, name: "Cached Product" };
    cacheService.getProduct.mockResolvedValue(cached);

    const result = await productService.getProductById(1);

    expect(result.cached).toBe(true);
    expect(result.product).toEqual(cached);
    expect(cacheService.getProduct).toHaveBeenCalledWith(1);
    expect(productRepository.findById).not.toHaveBeenCalled();
  });

  it("should return product from DB if not cached", async () => {
    const dbProduct = { id: 2, name: "DB Product" };
    cacheService.getProduct.mockResolvedValue(null);
    productRepository.findById.mockResolvedValue(dbProduct);

    const result = await productService.getProductById(2);

    expect(result.cached).toBe(false);
    expect(result.product).toEqual(dbProduct);
    expect(cacheService.setProduct).toHaveBeenCalledWith(2, dbProduct);
  });
});
