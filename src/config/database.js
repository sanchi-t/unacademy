const { Sequelize } = require('sequelize');
const config = require('./index');

class Database {
  constructor() {
    this.sequelize = new Sequelize(
      config.database.name,
      config.database.user,
      config.database.password,
      {
        host: config.database.host,
        port: config.database.port,
        dialect: 'postgres',
        pool: {
          max: config.database.max || 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        dialectOptions: {
          ssl: config.database.ssl
            ? {
                require: true,
                rejectUnauthorized: false
              }
            : false
        }
      }
    );

    this.models = {};
  }

  /**
   * Initializes the database connection and registers models.
   * Must be called once before accessing models.
   */
  async init() {
    try {
      await this.sequelize.authenticate();
      console.info('✅ Database connection established.');

      this._registerModels();
      await this.sync();

      console.info('✅ Models registered and synced.');
    } catch (err) {
      console.error('❌ Database initialization failed:', err);
      process.exit(1);
    }
  }

  _registerModels() {
    const Product = require('../models/Product');

    this.models.Product = Product(this.sequelize, Sequelize.DataTypes);
  }

  getModel(name) {
    return this.models[name];
  }

  getSequelizeInstance() {
    return this.sequelize;
  }

  async query(text, params) {
    try {
      return await this.sequelize.query(text, {
        replacements: params,
        type: this.sequelize.QueryTypes.SELECT
      });
    } catch (error) {
      throw error;
    }
  }

  async transaction(callback) {
    return this.sequelize.transaction(callback);
  }

  async getClient() {
    return this.sequelize.transaction();
  }

  async close() {
    await this.sequelize.close();
    console.info('🛑 Database connection closed.');
  }

  async sync(options = {}) {
    return this.sequelize.sync(options);
  }
}

const db = new Database();
module.exports = db;
