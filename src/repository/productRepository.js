const { Op } = require('sequelize');
const Database = require('../config/database');
const logger = require('../utils/logger');

class ProductRepository {
    constructor() {
        this.Product = Database.getModel('Product');
        if (!this.Product) {
            throw new Error('Product model not initialized properly.');
        }
        else {
            console.log('Product model initialized successfully.');
        }
    }
  async findAll(filters = {}) {
    try {
      const { 
        category, 
        price_min, 
        price_max, 
        search, 
        limit = 10, 
        offset = 0,
        sort_by = 'createdAt',
        sort_order = 'DESC'
      } = filters;

      const where = {};
      const sortableFields = {
      price: 'price',
      name: 'name',
      created_at: 'createdAt',
    };
    const safeSortBy = sortableFields[sort_by] || 'createdAt';
    const safeSortOrder = ['ASC', 'DESC'].includes(sort_order.toUpperCase()) ? sort_order.toUpperCase() : 'DESC';
      const order = [[safeSortBy, safeSortOrder]];
      console.log("SortBy__________",sort_by, sort_order, order);
      console.log("MINPRICE__________",price_min);
      if (category) {
        where.category = category.toLowerCase()
      }

      if (price_min || price_max) {
        where.price = {};
        if (price_min) where.price[Op.gte] = price_min;
        if (price_max) where.price[Op.lte] = price_max;
      }

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }
      const products = await this.Product.findAll({
        where,
        limit,
        offset,
        order,
        raw: true
      });
      return products;
    } catch (error) {
      logger.error('Error in ProductRepository.findAll:', error);
      throw error;
    }
  }

  async getCount(filters = {}) {
    try {
      const { category, price_min, price_max, search } = filters;

      const where = {};

      if (category) {
        where.category = category.toLowerCase();
      }

      if (price_min || price_max) {
        where.price = {};
        if (price_min) where.price[Op.gte] = price_min;
        if (price_max) where.price[Op.lte] = price_max;
      }

      if (search) {
        where[Op.or] = [
          { name: { [Op.iLike]: `%${search}%` } },
          { description: { [Op.iLike]: `%${search}%` } }
        ];
      }

      return await this.Product.count({ where });
    } catch (error) {
      logger.error('Error in ProductRepository.getCount:', error);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await this.Product.findByPk(id, { raw: true });
    } catch (error) {
      logger.error('Error in ProductRepository.findById:', error);
      throw error;
    }
  }

  async create(productData) {
    try {
    if (productData.name) productData.name = productData.name.toLowerCase();
    if (productData.category) productData.category = productData.category.toLowerCase();
        console.log('Creating product with data:', productData);
      return await this.Product.create(productData, { raw: true });
    } catch (error) {
      logger.error('Error in ProductRepository.create:', error);
      throw error;
    }
  }

  async update(id, productData) {
    try {
      const [affectedCount] = await this.Product.update(productData, {
        where: { id },
        returning: true
      });

      if (affectedCount === 0) {
        return null;
      }

      return await this.findById(id);
    } catch (error) {
      logger.error('Error in ProductRepository.update:', error);
      throw error;
    }
  }

  async delete(id) {
    try {
      const product = await this.findById(id);
      if (!product) {
        return null;
      }

      await this.Product.destroy({ where: { id } });
      return product;
    } catch (error) {
      logger.error('Error in ProductRepository.delete:', error);
      throw error;
    }
  }

  async getCategories() {
    try {
      const categories = await this.Product.findAll({
        attributes: ['category'],
        group: ['category'],
        raw: true
      });

      return categories.map(item => item.category);
    } catch (error) {
      logger.error('Error in ProductRepository.getCategories:', error);
      throw error;
    }
  }
}

module.exports = new ProductRepository();