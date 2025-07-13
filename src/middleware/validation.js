const Joi = require('joi');

const productSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().min(1).max(1000),
  category: Joi.string().min(1).max(100).required(),
  price: Joi.number().positive().precision(2).required(),
  stock: Joi.number().integer().min(0).required(),
  imageUrl: Joi.string().uri().allow(null, '')
});

const partialProductSchema = Joi.object({
  name: Joi.string().min(1).max(255),
  description: Joi.string().min(1).max(1000).allow(''),
  category: Joi.string().min(1).max(100),
  price: Joi.number().positive().precision(2),
  stock: Joi.number().integer().min(0),
  imageUrl: Joi.string().uri().allow(null, '')
}).min(1); // At least one field must be provided

const filtersSchema = Joi.object({
  category: Joi.string().min(1).max(100),
  price_min: Joi.number().positive().precision(2),
  price_max: Joi.number().positive().precision(2),
  in_stock: Joi.boolean(),
  search: Joi.string().min(1).max(100),
  sort_by: Joi.string().valid('price', 'name', 'created_at'),
  sort_order: Joi.string().valid('asc', 'desc').default('desc'),
  limit: Joi.number().integer().min(1).max(100),
  offset: Joi.number().integer().min(0)
}).custom((value, helpers) => {
  if (value.price_min && value.price_max && value.price_min > value.price_max) {
    return helpers.error('custom.price_range');
  }
  return value;
}).messages({
  'custom.price_range': 'price_min cannot be greater than price_max'
});

function validateProduct(product, isPartial = false) {
  const schema = isPartial ? partialProductSchema : productSchema;
  const { error } = schema.validate(product);
  return error;
}

function validateFilters(filters) {
  const { error } = filtersSchema.validate(filters);
  return error;
}

function validateRequest(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        details: error.details
      });
    }
    next();
  };
}

function validateQuery(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.details[0].message,
        details: error.details
      });
    }
    next();
  };
}

module.exports = {
  validateProduct,
  validateFilters,
  validateRequest,
  validateQuery,
  productSchema,
  partialProductSchema,
  filtersSchema
};