const enhancedPerformanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  let cached = false;
  
  if (req.get('X-Cache-Hit') === 'true') {
    cached = true;
  }

  const originalJson = res.json;
  res.json = function(data) {
    const duration = Date.now() - startTime;
    
    performanceMetrics.recordRequest(duration, res.statusCode, cached);
    
    logger.info({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      cached: cached,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
    
    res.set({
      'X-Response-Time': `${duration}ms`,
      'X-Timestamp': new Date().toISOString(),
      'X-Performance-Metrics': JSON.stringify({
        duration,
        cached
      })
    });
    
    return originalJson.call(this, data);
  };

  if (req.app.get('sequelize')) {
    const originalQuery = req.app.get('sequelize').query;
    req.app.get('sequelize').query = function(sql, options) {
      const queryStart = Date.now();
      return originalQuery.call(this, sql, options)
        .then(result => {
          const queryDuration = Date.now() - queryStart;
          performanceMetrics.recordDatabaseQuery(queryDuration);
          return result;
        })
        .catch(error => {
          const queryDuration = Date.now() - queryStart;
          performanceMetrics.recordDatabaseQuery(queryDuration);
          throw error;
        });
    };
  }

  next();
};

const metricsExporterMiddleware = (req, res, next) => {
  if (req.path === '/metrics') {
    return res.json({
      status: 'success',
      data: performanceMetrics.getMetrics()
    });
  }
  
  if (req.path === '/metrics/reset' && req.method === 'POST') {
    performanceMetrics.reset();
    return res.json({
      status: 'success',
      message: 'Metrics reset successfully'
    });
  }
  
  next();
};

module.exports = {
  performanceMiddleware,
  enhancedPerformanceMiddleware,
  metricsExporterMiddleware,
  PerformanceMetrics,
  performanceMetrics
};