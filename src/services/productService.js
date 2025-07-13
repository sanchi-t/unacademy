const productRepository = require("../repository/productRepository");
const cacheService = require("./cacheService");
const logger = require("../utils/logger");

class ProductService {
  async getAllProducts(filters = {}) {
    try {
      const startTime = Date.now();

      const cachedData = await cacheService.getListing(filters);
      if (cachedData) {
        const duration = Date.now() - startTime;
        logger.info(`Products retrieved from cache in ${duration}ms`);
        return {
          ...cachedData,
          cached: true,
          responseTime: duration,
        };
      }

      const products = await productRepository.findAll(filters);
      const total = await productRepository.getCount(filters);

      const result = {
        products,
        total,
        page: Math.floor((filters.offset || 0) / (filters.limit || 10)) + 1,
        limit: filters.limit || 10,
        totalPages: Math.ceil(total / (filters.limit || 10)),
      };

      await cacheService.setListing(filters, result);

      const duration = Date.now() - startTime;
      logger.info(`Products retrieved from database in ${duration}ms`);

      return {
        ...result,
        cached: false,
        responseTime: duration,
      };
    } catch (error) {
      logger.error("Error in ProductService.getAllProducts:", error);
      throw error;
    }
  }

  async getProductById(id) {
    try {
      const startTime = Date.now();

      const cachedProduct = await cacheService.getProduct(id);
      if (cachedProduct) {
        const duration = Date.now() - startTime;
        logger.info(`Product ${id} retrieved from cache in ${duration}ms`);
        return {
          product: cachedProduct,
          cached: true,
          responseTime: duration,
        };
      }

      const product = await productRepository.findById(id);
      if (!product) {
        return null;
      }

      await cacheService.setProduct(id, product);

      const duration = Date.now() - startTime;
      logger.info(`Product ${id} retrieved from database in ${duration}ms`);

      return {
        product: product,
        cached: false,
        responseTime: duration,
      };
    } catch (error) {
      logger.error("Error in ProductService.getProductById:", error);
      throw error;
    }
  }

  async createProduct(productData) {
    try {
      const startTime = Date.now();
      const product = await productRepository.create(productData);

      await cacheService.invalidateProductRelatedCaches(product.id);

      const duration = Date.now() - startTime;
      logger.info(`Product created in ${duration}ms`);
      return {
        product: product.dataValues,
        responseTime: duration,
      };
    } catch (error) {
      logger.error("Error in ProductService.createProduct:", error);
      throw error;
    }
  }

  async updateProduct(id, productData) {
    try {
      const startTime = Date.now();

      const product = await productRepository.update(id, productData);
      if (!product) {
        return null;
      }

      await cacheService.invalidateProductRelatedCaches(id);

      const duration = Date.now() - startTime;
      logger.info(`Product ${id} updated in ${duration}ms`);

      return {
        product: product,
        responseTime: duration,
      };
    } catch (error) {
      logger.error("Error in ProductService.updateProduct:", error);
      throw error;
    }
  }

  async deleteProduct(id) {
    try {
      const startTime = Date.now();

      const product = await productRepository.delete(id);
      if (!product) {
        return null;
      }

      await cacheService.invalidateProductRelatedCaches(id);

      const duration = Date.now() - startTime;
      logger.info(`Product ${id} deleted in ${duration}ms`);

      return {
        id: product.id,
        deleted: true,
        responseTime: duration,
      };
    } catch (error) {
      logger.error("Error in ProductService.deleteProduct:", error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const startTime = Date.now();

      const cachedCategories = await cacheService.getCategories();
      if (cachedCategories) {
        const duration = Date.now() - startTime;
        logger.info(`Categories retrieved from cache in ${duration}ms`);
        return {
          categories: cachedCategories,
          cached: true,
          responseTime: duration,
        };
      }

      const categories = await productRepository.getCategories();

      await cacheService.setCategories(categories);

      const duration = Date.now() - startTime;
      logger.info(`Categories retrieved from database in ${duration}ms`);

      return {
        categories,
        cached: false,
        responseTime: duration,
      };
    } catch (error) {
      logger.error("Error in ProductService.getCategories:", error);
      throw error;
    }
  }

  async getCacheStats() {
    try {
      return await cacheService.getCacheStats();
    } catch (error) {
      logger.error("Error in ProductService.getCacheStats:", error);
      throw error;
    }
  }

  async clearCache() {
    try {
      return await cacheService.clearAllCache();
    } catch (error) {
      logger.error("Error in ProductService.clearCache:", error);
      throw error;
    }
  }
}

module.exports = new ProductService();
