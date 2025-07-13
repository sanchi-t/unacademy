const redis = require("redis");
const config = require("./index");
const logger = require("../utils/logger");

class RedisClient {
  constructor() {
    this.client = redis.createClient({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password,
      db: config.redis.db,
      retryDelayOnFailover: config.redis.retryDelayOnFailover,
      maxRetriesPerRequest: config.redis.maxRetriesPerRequest,
    });

    this.client.on("connect", () => {
      logger.info("Redis connected successfully");
    });

    this.client.on("error", (error) => {
      logger.error("Redis connection error:", error);
    });

    this.client.on("ready", () => {
      logger.info("Redis client ready");
    });

    this.client.on("end", () => {
      logger.info("Redis connection ended");
    });

    this.connect();
  }

  async connect() {
    try {
      await this.client.connect();
    } catch (error) {
      logger.error("Failed to connect to Redis:", error);
      throw error;
    }
  }

  async get(key) {
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error("Redis GET error:", error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      const serialized = JSON.stringify(value);
      if (ttl) {
        await this.client.setEx(key, ttl, serialized);
      } else {
        await this.client.set(key, serialized);
      }
      return true;
    } catch (error) {
      logger.error("Redis SET error:", error);
      return false;
    }
  }

  async del(key) {
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error("Redis DEL error:", error);
      return false;
    }
  }

  async delPattern(pattern) {
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      logger.error("Redis DEL pattern error:", error);
      return false;
    }
  }

  async exists(key) {
    try {
      return await this.client.exists(key);
    } catch (error) {
      logger.error("Redis EXISTS error:", error);
      return false;
    }
  }

  async flushAll() {
    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      logger.error("Redis FLUSHALL error:", error);
      return false;
    }
  }

  async close() {
    await this.client.quit();
    logger.info("Redis connection closed");
  }
}

module.exports = new RedisClient();
