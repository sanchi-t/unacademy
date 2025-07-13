const express = require("express");
const productController = require("../controllers/productController");
const {
  validateRequest,
  validateQuery,
  productSchema,
  partialProductSchema,
  filtersSchema,
} = require("../middleware/validation");
const db = require("../config/database");

const router = express.Router();

// GET /api/products - Get all products with optional filters
router.get("/", productController.getAllProducts);

// GET /api/products/categories - Get all categories
router.get("/categories", productController.getCategories);

// GET /api/products/cache/stats - Get cache statistics
router.get("/cache/stats", productController.getCacheStats);

// DELETE /api/products/cache - Clear cache
router.delete("/cache", productController.clearCache);

// GET /api/products/:id - Get product by ID
router.get("/:id", productController.getProductById);

// POST /api/products - Create new product
router.post(
  "/",
  validateRequest(productSchema),
  productController.createProduct,
);

// PUT /api/products/:id - Update product
router.put(
  "/:id",
  validateRequest(partialProductSchema),
  productController.updateProduct,
);

// DELETE /api/products/:id - Delete product
router.delete("/:id", productController.deleteProduct);

module.exports = router;
