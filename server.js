const app = require('./src/app.js');
const config = require('./src/config/index.js');
const logger = require('./src/utils/logger.js');
const Database = require('./src/config/database.js');

const PORT = config.port || 3000;

const startServer = async () => {
  try {
    await Database.init();

    const productRoutes = require('./src/routes/productRoutes.js');
    app.use('/api/products', productRoutes);

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
