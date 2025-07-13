const redis = require('../config/redis');
const config = require('../config');
const logger = require('../utils/logger');

class CacheService {
  constructor() {
    this.prefix = config.cache.prefix;
    this.defaultTTL = config.cache.ttl;
    this.productTTL = config.cache.productTtl;
    this.listingTTL = config.cache.listingTtl;
  }

  generateProductKey(id) {
    return `${this.prefix}:product:${id}`;
  }

  generateListingKey(filters) {
    const sortedFilters = Object.keys(filters)
      .sort()
      .reduce((result, key) => {
        result[key] = filters[key];
        return result;
      }, {});
    const filterString = JSON.stringify(sortedFilters);
    return `${this.prefix}:listing:${Buffer.from(filterString).toString('base64')}`;
  }

  generateCategoriesKey() {
    return `${this.prefix}:categories`;
  }

  async getProduct(id) {
    try {
      const key = this.generateProductKey(id);
      const cached = await redis.get(key);
      
      if (cached) {
        console.debug(`Cache hit for product ${id}`);
        return cached;
      }
      
      console.debug(`Cache miss for product ${id}`);
      return null;
    } catch (error) {
      console.error('Error getting product from cache:', error);
      return null;
    }
  }

  async setProduct(id, product) {
    try {
      const key = this.generateProductKey(id);
      await redis.set(key, product, this.productTTL);
      console.debug(`Product ${id} cached for ${this.productTTL} seconds`);
      return true;
    } catch (error) {
      console.error('Error setting product in cache:', error);
      return false;
    }
  }

  async invalidateProduct(id) {
    try {
      const key = this.generateProductKey(id);
      await redis.del(key);
      console.debug(`Product ${id} cache invalidated`);
      return true;
    } catch (error) {
      console.error('Error invalidating product cache:', error);
      return false;
    }
  }

  async getListing(filters) {
    try {
      const key = this.generateListingKey(filters);
      const cached = await redis.get(key);
      
      if (cached) {
        console.debug(`Cache hit for listing with filters: ${JSON.stringify(filters)}`);
        return cached;
      }
      
      console.debug(`Cache miss for listing with filters: ${JSON.stringify(filters)}`);
      return null;
    } catch (error) {
      console.error('Error getting listing from cache:', error);
      return null;
    }
  }

  async setListing(filters, listing) {
    try {
      const key = this.generateListingKey(filters);
      await redis.set(key, listing, this.listingTTL);
      console.debug(`Listing cached for ${this.listingTTL} seconds`);
      return true;
    } catch (error) {
      console.error('Error setting listing in cache:', error);
      return false;
    }
  }

  async invalidateListings() {
    try {
      const pattern = `${this.prefix}:listing:*`;
      await redis.delPattern(pattern);
      console.debug('All listing caches invalidated');
      return true;
    } catch (error) {
      console.error('Error invalidating listing caches:', error);
      return false;
    }
  }

  async getCategories() {
    try {
      const key = this.generateCategoriesKey();
      const cached = await redis.get(key);
      
      if (cached) {
        console.debug('Cache hit for categories');
        return cached;
      }
      
      console.debug('Cache miss for categories');
      return null;
    } catch (error) {
      console.error('Error getting categories from cache:', error);
      return null;
    }
  }

  async setCategories(categories) {
    try {
      const key = this.generateCategoriesKey();
      await redis.set(key, categories, this.defaultTTL);
      console.debug(`Categories cached for ${this.defaultTTL} seconds`);
      return true;
    } catch (error) {
      console.error('Error setting categories in cache:', error);
      return false;
    }
  }

  async invalidateCategories() {
    try {
      const key = this.generateCategoriesKey();
      await redis.del(key);
      console.debug('Categories cache invalidated');
      return true;
    } catch (error) {
      console.error('Error invalidating categories cache:', error);
      return false;
    }
  }

  async invalidateProductRelatedCaches(productId) {
    try {
      await Promise.all([
        this.invalidateProduct(productId),
        this.invalidateListings(),
        this.invalidateCategories()
      ]);
      console.debug(`All product-related caches invalidated for product ${productId}`);
      return true;
    } catch (error) {
      console.error('Error invalidating product-related caches:', error);
      return false;
    }
  }

  async getCacheStats() {
    try {
      const productKeys = await redis.client.keys(`${this.prefix}:product:*`);
      const listingKeys = await redis.client.keys(`${this.prefix}:listing:*`);
      const categoryKeys = await redis.client.keys(`${this.prefix}:categories`);
      
      return {
        products: productKeys.length,
        listings: listingKeys.length,
        categories: categoryKeys.length,
        total: productKeys.length + listingKeys.length + categoryKeys.length
      };
    } catch (error) {
      console.error('Error getting cache stats:', error);
      return { products: 0, listings: 0, categories: 0, total: 0 };
    }
  }

  async clearAllCache() {
    try {
      const pattern = `${this.prefix}:*`;
      await redis.delPattern(pattern);
      console.info('All cache cleared');
      return true;
    } catch (error) {
      console.error('Error clearing all cache:', error);
      return false;
    }
  }
}

module.exports = new CacheService();