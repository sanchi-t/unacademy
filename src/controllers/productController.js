const productService = require("../services/productService");
const {
  validateProduct,
  validateFilters,
} = require("../middleware/validation");

class ProductController {
  async getAllProducts(req, res, next) {
    try {
      const filters = {
        category: req.query.category,
        price_min: req.query.price_min
          ? parseFloat(req.query.price_min)
          : undefined,
        price_max: req.query.price_max
          ? parseFloat(req.query.price_max)
          : undefined,
        in_stock:
          req.query.in_stock === "true"
            ? true
            : req.query.in_stock === "false"
              ? false
              : undefined,
        search: req.query.search,
        sort_by: req.query.sort_by,
        sort_order: req.query.sort_order,
        limit: req.query.limit ? parseInt(req.query.limit) : 10,
        offset: req.query.offset ? parseInt(req.query.offset) : 0,
      };

      Object.keys(filters).forEach((key) => {
        if (filters[key] === undefined) {
          delete filters[key];
        }
      });

      const validationError = validateFilters(filters);
      if (validationError) {
        return res.status(400).json({
          error: "Validation Error",
          message: validationError.details[0].message,
        });
      }

      const result = await productService.getAllProducts(filters);

      res.locals.cached = result.cached;

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
        meta: {
          cached: result.cached,
          responseTime: result.responseTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Invalid product ID",
        });
      }

      const result = await productService.getProductById(parseInt(id));

      if (!result) {
        return res.status(404).json({
          error: "Not Found",
          message: "Product not found",
        });
      }

      res.locals.cached = result.cached;

      res.status(200).json({
        success: true,
        data: result.product,
        meta: {
          cached: result.cached,
          responseTime: result.responseTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async createProduct(req, res, next) {
    try {
      const validationError = validateProduct(req.body);
      if (validationError) {
        return res.status(400).json({
          error: "Validation Error",
          message: validationError.details[0].message,
        });
      }
      const result = await productService.createProduct(req.body);

      res.locals.cached = result.cached;

      res.status(201).json({
        success: true,
        data: result.product,
        meta: {
          responseTime: result.responseTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Invalid product ID",
        });
      }

      const validationError = validateProduct(req.body, true);
      if (validationError) {
        return res.status(400).json({
          error: "Validation Error",
          message: validationError.details[0].message,
        });
      }

      const result = await productService.updateProduct(parseInt(id), req.body);

      if (!result) {
        return res.status(404).json({
          error: "Not Found",
          message: "Product not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result.product,
        meta: {
          responseTime: result.responseTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      const { id } = req.params;

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({
          error: "Validation Error",
          message: "Invalid product ID",
        });
      }

      const result = await productService.deleteProduct(parseInt(id));

      if (!result) {
        return res.status(404).json({
          error: "Not Found",
          message: "Product not found",
        });
      }

      res.status(200).json({
        success: true,
        data: result,
        meta: {
          responseTime: result.responseTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCategories(req, res, next) {
    try {
      const result = await productService.getCategories();
      res.locals.cached = result.cached;
      res.status(200).json({
        success: true,
        data: result.categories,
        meta: {
          cached: result.cached,
          responseTime: result.responseTime,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getCacheStats(req, res, next) {
    try {
      const stats = await productService.getCacheStats();

      res.status(200).json({
        success: true,
        data: stats,
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async clearCache(req, res, next) {
    try {
      await productService.clearCache();

      res.status(200).json({
        success: true,
        message: "Cache cleared successfully",
        meta: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProductController();
