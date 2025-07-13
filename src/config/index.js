require("dotenv").config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  database: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    name: process.env.DB_NAME || "ecommerce",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    ssl: process.env.NODE_ENV === "production",
    max: 20,
  },

  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || "",
    db: 0,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
  },

  cache: {
    ttl: process.env.CACHE_TTL || 600, // 10 minutes
    prefix: process.env.CACHE_PREFIX || "product_api",
    listingTtl: 300, // 5 minutes for listings
    productTtl: 600, // 10 minutes for individual products
  },

  logging: {
    level: process.env.LOG_LEVEL || "info",
  },
};

module.exports = config;
